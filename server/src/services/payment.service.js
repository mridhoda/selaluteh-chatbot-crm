import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { ordersRepository, paymentsRepository } from '../db/repositories/index.js';
import { assertOutletAccess, buildOutletScopedQuery } from './access-control.service.js';
import { notifyOrderUpdatedRealtime, notifyPaidOrderRealtime, notifyPaymentUpdatedRealtime, sendOrderStatusMessage } from './order.service.js';
import { getPaymentRuntimeConfig } from './settings.service.js';

const TERMINAL_PAID_STATUSES = new Set(['paid', 'refunded', 'partially_refunded']);
const ACTIVE_SESSION_STATUSES = new Set(['pending', 'created']);

function resolveEntityId(value) {
  if (!value || typeof value !== 'object') return value || null;
  return value.id || value._id || null;
}

export async function createPayment({ user, workspaceId, outletId, orderId, customer, amount, currency = 'IDR', paymentMethod = null, provider = null }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  if (user) await assertOutletAccess(user, order.outletId);

  const expectedAmount = order.totals?.total || 0;
  const requestedAmount = amount ?? expectedAmount;
  if (requestedAmount !== expectedAmount) {
    throw new AppError('AMOUNT_MISMATCH', 'Payment amount must match order total', 400);
  }

  const existingReusable = await paymentsRepository.findReusableAttempt({ workspaceId, orderId });
  if (existingReusable) return existingReusable;

  const existingAttempts = await paymentsRepository.count({ workspaceId, orderId });
  const attemptNumber = existingAttempts + 1;

  const merchantReference = `PAY-${workspaceId.toString().slice(-6)}-${orderId.toString().slice(-6)}-${Date.now()}`;

  let providerTransactionId = null;
  let paymentUrl = null;
  const activeProvider = (requestedAmount === 0) ? 'manual' : (provider || env.paymentProvider);

  if (activeProvider !== 'manual') {
    try {
      const adapter = await loadPaymentAdapter(activeProvider);
      const result = await adapter.createPayment({
        orderId: orderId.toString(),
        merchantReference,
        amount: requestedAmount,
        currency,
        customer: customer || { name: '', email: '', phone: '' },
      });
      providerTransactionId = result.providerTransactionId;
      paymentUrl = result.paymentUrl;
    } catch (err) {
      console.error(`[Payment] Provider error:`, err.message);
      throw new AppError('PAYMENT_PROVIDER_ERROR', 'Payment provider temporarily unavailable', 502);
    }
  } else {
    paymentUrl = '';
  }

  const payment = await paymentsRepository.create({
    workspaceId,
    outletId: outletId || order.outletId,
    orderId,
    contactId: resolveEntityId(order.contactId),
    attemptNumber,
    provider: activeProvider,
    providerTransactionId,
    merchantReference,
    status: 'pending',
    amount: requestedAmount,
    currency,
    paymentUrl,
    paymentMethod: paymentMethod || (activeProvider === 'manual' ? 'manual' : null),
    customerSnapshot: customer || {},
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const updatedOrder = await ordersRepository.updateOne({ workspaceId, orderId, updates: { payment_status: 'pending' } });
  notifyPaymentUpdatedRealtime({ workspaceId, outletId: payment.outletId, payment, order: updatedOrder });
  notifyOrderUpdatedRealtime({ workspaceId, outletId: updatedOrder?.outletId || payment.outletId, order: updatedOrder });

  return payment;
}

export async function createPaymentForOrder({ workspaceId, orderId, customer, paymentMethod, provider = null }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  return createPayment({
    workspaceId,
    outletId: order.outletId,
    orderId,
    amount: order.totals?.total || 0,
    currency: order.totals?.currency || 'IDR',
    customer,
    paymentMethod,
    provider,
  });
}

export async function createXenditPaymentSessionForOrder({ user, workspaceId, orderId, customer = {}, idempotencyKey }) {
  if (env.paymentProvider !== 'xendit') {
    throw new AppError('XENDIT_NOT_ENABLED', 'Xendit payment provider is not enabled', 400);
  }
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  if (user) await assertOutletAccess(user, order.outletId);

  if (order.paymentStatus === 'paid' || order.payment_status === 'paid') {
    throw new AppError('PAYMENT_ALREADY_PAID', 'Order is already paid', 409);
  }

  if (idempotencyKey) {
    const existingByKey = await paymentsRepository.findByIdempotencyKey({ workspaceId, orderId, idempotencyKey });
    if (existingByKey) return toPaymentSessionResponse(existingByKey);
  }

  const reusable = await paymentsRepository.findReusableAttempt({ workspaceId, orderId });
  if (reusable) {
    if (TERMINAL_PAID_STATUSES.has(reusable.status)) {
      throw new AppError('PAYMENT_ALREADY_PAID', 'Payment is already paid', 409);
    }
    if (ACTIVE_SESSION_STATUSES.has(reusable.status) && reusable.paymentUrl) return toPaymentSessionResponse(reusable);
  }

  const existingAttempts = await paymentsRepository.count({ workspaceId, orderId });
  const attemptNumber = existingAttempts + 1;
  const referenceId = buildXenditReference({ order, attemptNumber });
  const expiresAt = new Date(Date.now() + env.xenditPaymentSessionTtlMinutes * 60 * 1000).toISOString();
  
  const paymentAmount = order.totals?.total || order.totalAmount || 0;
  if (paymentAmount <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Amount must be greater than zero for Xendit', 400);
  }

  const adapter = await loadPaymentAdapter('xendit');
  const providerSession = await adapter.createPaymentSession({
    referenceId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: paymentAmount,
    currency: order.totals?.currency || order.currency || 'IDR',
    customer: buildCustomerSnapshot(order, customer),
    successReturnUrl: buildReturnUrl('success'),
    cancelReturnUrl: buildReturnUrl('cancel'),
    expiresAt,
    metadata: {
      workspace_id: workspaceId,
      outlet_id: order.outletId,
      order_id: order.id,
      attempt: String(attemptNumber),
    },
  });

  const payment = await paymentsRepository.create({
    workspaceId,
    outletId: order.outletId,
    orderId,
    contactId: resolveEntityId(order.contactId),
    attemptNumber,
    provider: 'xendit',
    providerTransactionId: providerSession.providerSessionId,
    providerSessionId: providerSession.providerSessionId,
    providerRef: providerSession.providerSessionId,
    merchantReference: referenceId,
    status: providerSession.status || 'pending',
    amount: providerSession.amount || order.totals?.total || order.totalAmount || 0,
    currency: providerSession.currency || order.totals?.currency || order.currency || 'IDR',
    paymentUrl: providerSession.paymentUrl,
    paymentMethod: 'LINK_PAYMENT',
    customerSnapshot: buildCustomerSnapshot(order, customer),
    expiresAt: providerSession.expiresAt || expiresAt,
    metadata: {
      idempotency_key: idempotencyKey || null,
      environment: env.xenditMode,
      provider_session_id: providerSession.providerSessionId,
      provider_payment_request_id: providerSession.providerPaymentRequestId,
      provider_payment_id: providerSession.providerPaymentId,
      business_id: providerSession.businessId,
    },
  });

  const updatedOrder = await ordersRepository.updateOne({ workspaceId, orderId, updates: { payment_status: 'pending' } });
  notifyPaymentUpdatedRealtime({ workspaceId, outletId: payment.outletId, payment, order: updatedOrder });
  notifyOrderUpdatedRealtime({ workspaceId, outletId: updatedOrder?.outletId || payment.outletId, order: updatedOrder });
  return toPaymentSessionResponse(payment);
}

export async function createPaymentSessionForOrder({ user, workspaceId, orderId, customer = {}, idempotencyKey, provider }) {
  const runtimeConfig = await getPaymentRuntimeConfig({ workspaceId });
  const activeProvider = provider || runtimeConfig.provider || env.paymentProvider;
  if (activeProvider === 'xendit') {
    return createXenditPaymentSessionForOrder({ user, workspaceId, orderId, customer, idempotencyKey });
  }
  if (activeProvider !== 'doku') {
    throw new AppError('PAYMENT_PROVIDER_NOT_ENABLED', `Payment provider ${activeProvider || 'manual'} does not support payment links`, 400);
  }
  if (!runtimeConfig.configured) {
    throw new AppError('DOKU_NOT_CONFIGURED', 'DOKU credentials are not configured in Settings', 409);
  }

  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  if (user) await assertOutletAccess(user, order.outletId);

  if (order.paymentStatus === 'paid' || order.payment_status === 'paid') {
    throw new AppError('PAYMENT_ALREADY_PAID', 'Order is already paid', 409);
  }

  if (idempotencyKey) {
    const existingByKey = await paymentsRepository.findByIdempotencyKey({ workspaceId, orderId, idempotencyKey });
    if (existingByKey) return toPaymentSessionResponse(existingByKey);
  }

  const reusable = await paymentsRepository.findReusableAttempt({ workspaceId, orderId });
  if (reusable) {
    if (TERMINAL_PAID_STATUSES.has(reusable.status)) {
      throw new AppError('PAYMENT_ALREADY_PAID', 'Payment is already paid', 409);
    }
    if (ACTIVE_SESSION_STATUSES.has(reusable.status) && reusable.paymentUrl) return toPaymentSessionResponse(reusable);
  }

  const existingAttempts = await paymentsRepository.count({ workspaceId, orderId });
  const attemptNumber = existingAttempts + 1;
  const referenceId = buildPaymentReference({ order, attemptNumber, provider: 'doku' });
  const paymentAmount = order.totals?.total || order.totalAmount || 0;
  if (paymentAmount <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Amount must be greater than zero for DOKU', 400);
  }

  const adapter = await loadPaymentAdapter('doku');
  const providerSession = await adapter.createPaymentSession({
    referenceId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: paymentAmount,
    currency: order.totals?.currency || order.currency || 'IDR',
    customer: buildCustomerSnapshot(order, customer),
    items: order.items || [],
    successReturnUrl: buildReturnUrl('success'),
    cancelReturnUrl: buildReturnUrl('cancel'),
    notificationUrl: buildDokuWebhookUrl(),
    idempotencyKey,
    metadata: {
      workspace_id: workspaceId,
      outlet_id: order.outletId,
      order_id: order.id,
      attempt: String(attemptNumber),
    },
  }, runtimeConfig.doku);

  const payment = await paymentsRepository.create({
    workspaceId,
    outletId: order.outletId,
    orderId,
    contactId: resolveEntityId(order.contactId),
    attemptNumber,
    provider: 'doku',
    providerTransactionId: providerSession.providerTransactionId || providerSession.providerSessionId,
    providerSessionId: providerSession.providerSessionId,
    providerRef: providerSession.providerSessionId,
    merchantReference: referenceId,
    status: providerSession.status || 'pending',
    amount: providerSession.amount || paymentAmount,
    currency: providerSession.currency || order.totals?.currency || order.currency || 'IDR',
    paymentUrl: providerSession.paymentUrl,
    paymentMethod: 'LINK_PAYMENT',
    customerSnapshot: buildCustomerSnapshot(order, customer),
    expiresAt: providerSession.expiresAt || null,
    metadata: {
      idempotency_key: idempotencyKey || null,
      environment: runtimeConfig.environment,
      provider_session_id: providerSession.providerSessionId,
      provider_transaction_id: providerSession.providerTransactionId,
      raw_provider_response: providerSession.rawProviderResponse,
    },
  });

  const updatedOrder = await ordersRepository.updateOne({ workspaceId, orderId, updates: { payment_status: 'pending' } });
  notifyPaymentUpdatedRealtime({ workspaceId, outletId: payment.outletId, payment, order: updatedOrder });
  notifyOrderUpdatedRealtime({ workspaceId, outletId: updatedOrder?.outletId || payment.outletId, order: updatedOrder });
  return toPaymentSessionResponse(payment);
}

export async function refreshPaymentSession({ user, workspaceId, paymentId }) {
  const payment = await getPaymentDetail({ workspaceId, paymentId });
  await assertOutletAccess(user, payment.outletId);
  if (payment.provider !== 'xendit' || !payment.providerTransactionId) {
    throw new AppError('NO_PROVIDER_TRANSACTION', 'No Xendit payment session to refresh', 400);
  }
  const adapter = await loadPaymentAdapter('xendit');
  const providerSession = await adapter.getPaymentSession(payment.providerTransactionId);
  await reconcileProviderSession({ payment, providerSession });
  const refreshed = await paymentsRepository.findById({ workspaceId, paymentId });
  return toPaymentSessionResponse(refreshed);
}

export async function reconcileProviderSession({ payment, providerSession }) {
  if (!providerSession?.status || providerSession.status === payment.status) return payment;
  if (TERMINAL_PAID_STATUSES.has(payment.status) && providerSession.status !== 'paid') return payment;
  if (providerSession.amount && Number(payment.amount) !== Number(providerSession.amount)) {
    await paymentsRepository.updatePayment(payment.id, { reconciliation_status: 'amount_mismatch' });
    throw new AppError('PAYMENT_AMOUNT_MISMATCH', 'Provider amount does not match payment amount', 409);
  }
  if (providerSession.currency && payment.currency !== providerSession.currency) {
    await paymentsRepository.updatePayment(payment.id, { reconciliation_status: 'amount_mismatch' });
    throw new AppError('PAYMENT_CURRENCY_MISMATCH', 'Provider currency does not match payment currency', 409);
  }
  const allowedFrom = providerSession.status === 'paid' ? ['pending', 'expired'] : ['pending'];
  const updates = {
    reconciliation_status: providerSession.status === 'paid' ? 'matched' : 'pending',
  };
  if (providerSession.status === 'paid') updates.paid_at = new Date().toISOString();
  const updatedPayment = await paymentsRepository.transitionStatus({ paymentId: payment.id, fromStatuses: allowedFrom, newStatus: providerSession.status, updates });
  if (updatedPayment) {
    const updatedOrder = providerSession.status === 'paid'
      ? await ordersRepository.updateOne({
          workspaceId: payment.workspaceId,
          orderId: payment.orderId,
          updates: { payment_status: 'paid', paid_at: new Date().toISOString(), status: 'accepted' },
        })
      : null;
    notifyPaymentUpdatedRealtime({ workspaceId: payment.workspaceId, outletId: updatedPayment.outletId, payment: updatedPayment, order: updatedOrder });
    if (updatedOrder) notifyPaidOrderRealtime({ workspaceId: payment.workspaceId, outletId: updatedOrder.outletId, order: updatedOrder });
  }
  return updatedPayment;
}

export function buildPaymentInstruction(payment) {
  if (!payment) return '';
  const total = Number(payment.amount || 0).toLocaleString('id-ID');
  if (payment.provider === 'manual' || !payment.paymentUrl) {
    return `Pembayaran: manual/COD\nTotal: Rp ${total}\nSilakan bayar saat pengambilan atau sesuai instruksi outlet.`;
  }
  return `Link pembayaran:\n${payment.paymentUrl}\n\nTotal: Rp ${total}`;
}

export async function getPaymentDetail({ workspaceId, paymentId }) {
  const payment = await paymentsRepository.findById({ workspaceId, paymentId });
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);
  return payment;
}

export function toPaymentSessionResponse(payment) {
  if (!payment) return null;
  return {
    paymentId: payment.id,
    orderId: payment.orderId,
    provider: payment.provider,
    environment: payment.metadata?.environment || (payment.provider === 'xendit' ? env.xenditMode : undefined),
    status: payment.status,
    amount: Number(payment.amount || 0),
    currency: payment.currency || 'IDR',
    paymentUrl: payment.paymentUrl || payment.paymentLink || '',
    paymentLink: payment.paymentUrl || payment.paymentLink || '',
    paymentLinkUrl: payment.paymentUrl || payment.paymentLink || '',
    expiresAt: payment.expiresAt || payment.expiryTime || null,
    attemptNumber: payment.attemptNumber,
    referenceId: payment.merchantReference,
  };
}

export async function listPayments({ workspaceId, orderId, status, page, limit, sort }) {
  const data = await paymentsRepository.list({ workspaceId, orderId, status, page, limit, sort });
  const total = await paymentsRepository.count({ workspaceId, orderId, status });
  return { data, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 20 } };
}

async function enrichPaymentForList({ workspaceId, payment }) {
  if (!payment) return payment;

  const [order, events] = await Promise.all([
    payment.orderId ? ordersRepository.workspaceFindById({ workspaceId, orderId: payment.orderId }) : null,
    paymentsRepository.listEvents({ paymentId: payment.id }),
  ]);

  const latestSettledEvent = [...(events || [])].reverse().find((event) => (
    event.feeAmount != null || event.netAmount != null || event.paymentMethod
  ));
  const customerSnapshot = payment.customerSnapshot || order?.customerSnapshot || {};
  const contact = typeof order?.contactId === 'object' ? order.contactId : null;
  const outlet = order?.outlet || null;
  const amount = Number(payment.amount ?? order?.totalAmount ?? order?.totals?.total ?? 0);
  const providerFee = latestSettledEvent?.feeAmount ?? payment.providerFee ?? 0;

  return {
    ...payment,
    orderNumber: order?.orderNumber || null,
    outletName: outlet?.name || order?.outletNameSnapshot || order?.fulfillmentSnapshot?.outletName || null,
    outletCode: outlet?.code || null,
    customerName: customerSnapshot.name || customerSnapshot.contactName || order?.customerNameSnapshot || contact?.name || null,
    customerPhone: customerSnapshot.phone || order?.customerPhoneSnapshot || contact?.phone || null,
    paymentMethod: payment.paymentMethod || latestSettledEvent?.paymentMethod || order?.paymentMethod || payment.method || null,
    grossAmount: amount,
    providerFee,
    netAmount: latestSettledEvent?.netAmount ?? Math.max(amount - Number(providerFee || 0), 0),
    events,
  };
}

export async function listPaymentsForUser({ user, orderId, status, page, limit, sort }) {
  const scope = await buildOutletScopedQuery(user);
  const data = await paymentsRepository.list({
    workspaceId: scope.workspaceId,
    orderId,
    status,
    outletId: scope.outletId,
    outletIds: scope.outletIds,
    page,
    limit,
    sort,
  });
  const enrichedData = await Promise.all(data.map((payment) => enrichPaymentForList({
    workspaceId: scope.workspaceId,
    payment,
  })));
  const total = await paymentsRepository.count({
    workspaceId: scope.workspaceId,
    orderId,
    status,
    outletId: scope.outletId,
    outletIds: scope.outletIds,
  });
  return { data: enrichedData, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 20 } };
}

export async function getPaymentDetailForUser({ user, paymentId }) {
  const payment = await getPaymentDetail({ workspaceId: user.workspaceId, paymentId });
  await assertOutletAccess(user, payment.outletId);
  return payment;
}

export async function syncPaymentWithProvider({ workspaceId, paymentId }) {
  const payment = await paymentsRepository.findById({ workspaceId, paymentId });
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);
  if (!payment.providerTransactionId || payment.provider === 'manual') {
    throw new AppError('NO_PROVIDER_TRANSACTION', 'No provider transaction to sync', 400);
  }

  const adapter = await loadPaymentAdapter(payment.provider);
  const result = await adapter.getPayment(payment.providerTransactionId);

  if (result.status !== payment.status && result.status === 'paid') {
    await processPaidPayment({ payment, providerEvent: result });
  } else if (result.status === 'paid' && payment.reconciliationStatus !== 'matched') {
    const updatedPayment = await paymentsRepository.updatePayment(payment.id, { reconciliation_status: 'matched' });
    notifyPaymentUpdatedRealtime({ workspaceId, outletId: updatedPayment?.outletId || payment.outletId, payment: updatedPayment || payment });
  }

  return paymentsRepository.findById({ workspaceId, paymentId });
}

async function processPaidPayment({ payment, providerEvent }) {
  const paidAmount = providerEvent.amount || payment.amount;
  const updated = await paymentsRepository.atomicStatusUpdate({
    paymentId: payment.id,
    expectedStatus: 'pending',
    newStatus: 'paid',
  });
  if (!updated) return; // concurrent update won

  await paymentsRepository.addEvent({
    paymentId: payment.id,
    event: {
      providerEventId: providerEvent.providerTransactionId || providerEvent.providerEventId,
      eventType: 'settlement',
      status: 'paid',
      amount: paidAmount,
      currency: providerEvent.currency || 'IDR',
      feeAmount: providerEvent.feeAmount || 0,
      netAmount: providerEvent.netAmount || (paidAmount - (providerEvent.feeAmount || 0)),
      paymentMethod: providerEvent.paymentMethod,
      paidAt: providerEvent.paidAt ? new Date(providerEvent.paidAt) : new Date(),
    },
  });

  await paymentsRepository.updatePayment(payment.id, { reconciliation_status: 'matched' });

  const updatedOrder = await ordersRepository.updateOne({
    workspaceId: payment.workspaceId,
    orderId: payment.orderId,
    updates: { payment_status: 'paid', paid_at: new Date().toISOString(), status: 'accepted' },
  });
  notifyPaymentUpdatedRealtime({ workspaceId: payment.workspaceId, outletId: updated.outletId, payment: updated, order: updatedOrder });
  notifyPaidOrderRealtime({ workspaceId: payment.workspaceId, outletId: updatedOrder?.outletId || updated.outletId, order: updatedOrder });
  await notifyPaidOnce({ order: updatedOrder, paymentId: payment.id });
}

async function notifyPaidOnce({ order, paymentId }) {
  if (!order) return;
  const sentPayments = order.metadata?.paid_notification_payment_ids || [];
  if (sentPayments.includes(paymentId)) return;

  await sendOrderStatusMessage({
    order,
    from: 'ai',
    messageText: `Pembayaran pesanan ${order.orderNumber || ''} sudah kami terima ✅\n\nPesanan telah dikonfirmasi dan akan segera diproses.\n\nKami akan memberi tahu saat pesanan siap diambil.`,
  });

  await ordersRepository.updateOne({
    workspaceId: order.workspaceId,
    orderId: order.id,
    updates: { metadata: { ...(order.metadata || {}), paid_notification_payment_ids: [...sentPayments, paymentId] } },
  });
}

function buildCustomerSnapshot(order, input = {}) {
  const customerSnapshot = order.customerSnapshot || {};
  return {
    referenceId: input.referenceId || resolveEntityId(order.contactId) || resolveEntityId(order.chatId) || order.id,
    name: input.name || customerSnapshot.name || order.customerNameSnapshot || 'Customer',
    phone: input.phone || customerSnapshot.phone || order.customerPhoneSnapshot || '',
    email: input.email || customerSnapshot.email || '',
  };
}

function buildXenditReference({ order, attemptNumber }) {
  const outletCode = (order.outlets?.code || order.outletCode || String(order.outletId || '').slice(0, 6) || 'OUTLET').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
  const orderNumber = String(order.orderNumber || order.id).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-24);
  return `SLT_${outletCode}_${orderNumber}_PAY${String(attemptNumber).padStart(2, '0')}`.slice(0, 64);
}

function buildPaymentReference({ order, attemptNumber, provider }) {
  if (provider === 'xendit') return buildXenditReference({ order, attemptNumber });
  const orderNumber = String(order.orderNumber || order.id).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-24);
  return `SLT${orderNumber}PAY${String(attemptNumber).padStart(2, '0')}`.slice(0, 64);
}

function buildReturnUrl(kind) {
  const base = env.publicBaseUrl || env.corsOrigin?.split(',')?.[0] || 'http://localhost:5000';
  return `${base.replace(/\/$/, '')}/payments/return/${kind}`;
}

function buildDokuWebhookUrl() {
  const base = env.publicBaseUrl || env.corsOrigin?.split(',')?.[0] || 'http://localhost:5000';
  return `${base.replace(/\/$/, '')}/webhook/doku`;
}

async function loadPaymentAdapter(provider) {
  if (provider === 'xendit') {
    return import('../integrations/payments/xendit-client.js');
  }
  if (provider === 'doku') {
    return import('../integrations/payments/doku-client.js');
  }
  throw new Error(`Unknown or disabled payment provider: ${provider}`);
}
