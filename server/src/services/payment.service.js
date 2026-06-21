import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { ordersRepository, paymentsRepository } from '../db/repositories/index.js';
import { assertOutletAccess } from './access-control.service.js';

const TERMINAL_PAID_STATUSES = new Set(['paid', 'refunded', 'partially_refunded']);
const ACTIVE_SESSION_STATUSES = new Set(['pending', 'created']);

export async function createPayment({ workspaceId, outletId, orderId, customer, amount, currency = 'IDR', paymentMethod = null }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);

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

  if (env.paymentProvider !== 'manual') {
    try {
      const adapter = await loadPaymentAdapter(env.paymentProvider);
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
    attemptNumber,
    provider: env.paymentProvider,
    providerTransactionId,
    merchantReference,
    status: 'pending',
    amount: requestedAmount,
    currency,
    paymentUrl,
    paymentMethod: paymentMethod || (env.paymentProvider === 'manual' ? 'manual' : null),
    customerSnapshot: customer || {},
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await ordersRepository.updateOne({ workspaceId, orderId, updates: { payment_status: 'pending' } });

  return payment;
}

export async function createPaymentForOrder({ workspaceId, orderId, customer, paymentMethod }) {
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
  });
}

export async function createXenditPaymentSessionForOrder({ user, workspaceId, orderId, customer = {}, idempotencyKey }) {
  if (env.paymentProvider !== 'xendit') {
    throw new AppError('XENDIT_NOT_ENABLED', 'Xendit payment provider is not enabled', 400);
  }
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  await assertOutletAccess(user, order.outletId);

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
  const adapter = await loadPaymentAdapter('xendit');
  const providerSession = await adapter.createPaymentSession({
    referenceId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.totals?.total || order.totalAmount || 0,
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

  await ordersRepository.updateOne({ workspaceId, orderId, updates: { payment_status: 'pending' } });
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
  const allowedFrom = providerSession.status === 'paid' ? ['pending', 'created', 'expired'] : ['pending', 'created'];
  const updates = {
    reconciliation_status: providerSession.status === 'paid' ? 'matched' : 'pending',
  };
  if (providerSession.status === 'paid') updates.paid_at = new Date().toISOString();
  return paymentsRepository.transitionStatus({ paymentId: payment.id, fromStatuses: allowedFrom, newStatus: providerSession.status, updates });
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

  await ordersRepository.updateOne({ workspaceId: payment.workspaceId, orderId: payment.orderId, updates: { payment_status: 'paid' } });
}

function buildCustomerSnapshot(order, input = {}) {
  const customerSnapshot = order.customerSnapshot || {};
  return {
    referenceId: input.referenceId || order.contactId || order.chatId || order.id,
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

function buildReturnUrl(kind) {
  const base = env.publicBaseUrl || env.corsOrigin?.split(',')?.[0] || 'http://localhost:5000';
  return `${base.replace(/\/$/, '')}/payments/return/${kind}`;
}

async function loadPaymentAdapter(provider) {
  if (provider === 'midtrans') {
    return import('../integrations/payments/midtrans-client.js');
  }
  if (provider === 'xendit') {
    return import('../integrations/payments/xendit-client.js');
  }
  throw new AppError('UNKNOWN_PROVIDER', `Unknown payment provider: ${provider}`, 400);
}
