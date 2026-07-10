import { paymentsSupabaseRepository as paymentsRepository, ordersSupabaseRepository as ordersRepository } from '../db/repositories/index.js';
import { getSupabaseServiceClient } from '../db/supabase.js';
import { notifyPaidOrderRealtime, notifyPaymentUpdatedRealtime, sendOrderStatusMessage } from './order.service.js';
import { AppError } from '../utils/errors.js';
import { FulfillmentStatus, OrderStatus, PaymentStatus } from '../orders/order-types.js';
import { resolvePaymentProvider } from './payment-provider-resolver.service.js';

function paidOrderUpdates(paidAt = new Date().toISOString()) {
  return {
    payment_status: PaymentStatus.PAID,
    fulfillment_status: FulfillmentStatus.PREPARING,
    status: OrderStatus.PREPARING,
    preparing_at: paidAt,
    paid_at: paidAt,
  };
}

async function markOrderPaidPreparing({ workspaceId, orderId, paidAt }, deps = {}) {
  const ordersRepo = deps.ordersRepository || ordersRepository;
  const order = await ordersRepo.workspaceFindById({ workspaceId, orderId });
  const fulfillmentStatus = order?.fulfillmentStatus || order?.fulfillment_status;
  if (order?.paymentStatus === PaymentStatus.PAID && ![FulfillmentStatus.NOT_STARTED, FulfillmentStatus.AWAITING_ACCEPTANCE, FulfillmentStatus.ACCEPTED, 'unfulfilled', null, undefined].includes(fulfillmentStatus)) {
    return order;
  }
  return ordersRepo.updateOne({ workspaceId, orderId, updates: paidOrderUpdates(paidAt) });
}

export function determineReconciliationStatus({ payment, order, providerStatus }) {
  if (payment.reconciliationStatus === 'matched') return 'matched';
  const internalStatus = payment.status;
  const orderPaymentStatus = order?.paymentStatus || 'unpaid';

  if (providerStatus === 'paid' && internalStatus === 'paid') {
    if (payment.amount !== order?.totals?.total) return 'amount_mismatch';
    return 'matched';
  }
  if (providerStatus === 'paid' && internalStatus !== 'paid') {
    return 'missing_webhook';
  }
  if (internalStatus === 'paid' && providerStatus !== 'paid') {
    return 'unmatched';
  }
  return 'pending';
}

export async function reconcilePayment({ workspaceId, paymentId, providerStatus }) {
  const payment = await paymentsRepository.findById({ workspaceId, paymentId });
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);

  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId: payment.orderId });

  const recStatus = determineReconciliationStatus({ payment, order, providerStatus });
  if (recStatus === payment.reconciliationStatus) return payment;

  const updates = { reconciliation_status: recStatus };

  if (providerStatus === 'paid' && payment.provider_fee !== null && payment.net_amount !== null) {
    updates.provider_fee = payment.provider_fee;
    updates.net_amount = payment.net_amount;
  }

  const updated = await paymentsRepository.updatePayment(paymentId, updates);
  notifyPaymentUpdatedRealtime({ workspaceId, outletId: updated?.outletId || payment.outletId, payment: updated || payment, order });
  await reconcilePaymentAudit({ workspaceId, paymentId, oldStatus: payment.reconciliationStatus, newStatus: recStatus, providerStatus, order });
  return updated;
}

export async function batchReconcileByStatus({ workspaceId, status, newStatus }) {
  const payments = await paymentsRepository.list({ workspaceId, status });
  const results = [];
  for (const payment of payments) {
    const order = payment.orderId ? await ordersRepository.workspaceFindById({ workspaceId, orderId: payment.orderId }) : null;
    const recStatus = determineReconciliationStatus({ payment, order, providerStatus: status });
    if (recStatus === payment.reconciliationStatus) continue;

    const updates = { reconciliation_status: recStatus };
    if (status === 'paid' && payment.provider_fee !== null && payment.net_amount !== null) {
      updates.provider_fee = payment.provider_fee;
      updates.net_amount = payment.net_amount;
    }

    const updatedPayment = await paymentsRepository.updatePayment(payment.id, updates);
    notifyPaymentUpdatedRealtime({ workspaceId, outletId: updatedPayment?.outletId || payment.outletId, payment: updatedPayment || payment, order });
    await reconcilePaymentAudit({ workspaceId, paymentId: payment.id, oldStatus: payment.reconciliationStatus, newStatus: recStatus, providerStatus: status, order });
    results.push({ paymentId: payment.id, oldStatus: payment.reconciliationStatus, newStatus: recStatus });
  }
  return results;
}

export async function getNeedsAttentionPayments({ workspaceId, page, limit }) {
  const data = await paymentsRepository.list({
    workspaceId,
    reconciliationStatus: ['missing_webhook', 'unmatched', 'amount_mismatch'],
    page, limit,
  });
  const total = await paymentsRepository.count({
    workspaceId,
    reconciliationStatus: ['missing_webhook', 'unmatched', 'amount_mismatch'],
  });
  return { data, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 20 } };
}

export async function retryPaymentProcessing({ workspaceId, paymentId }, deps = {}) {
  const paymentsRepo = deps.paymentsRepository || paymentsRepository;
  const payment = await paymentsRepo.findById({ workspaceId, paymentId });
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);

  if (payment.reconciliationStatus === 'missing_webhook' && payment.providerTransactionId) {
    const { adapter, providerConfig } = await resolveStatusQueryAdapter({ workspaceId, provider: payment.provider }, deps);
    const result = await adapter.getPayment(payment.providerTransactionId, providerConfig);
    if (result.status === 'paid' && payment.status !== 'paid') {
      await processPaidPaymentFromReconciliation({ payment, providerEvent: result }, deps);
    }
  }

  return paymentsRepo.findById({ workspaceId, paymentId });
}

async function processPaidPaymentFromReconciliation({ payment, providerEvent }, deps = {}) {
  const paymentsRepo = deps.paymentsRepository || paymentsRepository;
  const notifyPaymentUpdated = deps.notifyPaymentUpdatedRealtime || notifyPaymentUpdatedRealtime;
  const notifyPaidOrder = deps.notifyPaidOrderRealtime || notifyPaidOrderRealtime;
  const sendStatusMessage = deps.sendOrderStatusMessage || sendOrderStatusMessage;
  const updated = await paymentsRepo.transitionStatus({
    workspaceId: payment.workspaceId,
    paymentId: payment.id,
    fromStatuses: ['pending', 'processing'],
    newStatus: 'paid',
    updates: { paid_at: providerEvent.paidAt ? new Date(providerEvent.paidAt).toISOString() : new Date().toISOString() },
  });
  if (!updated) return { updated: false, reason: 'state_conflict' };

  const feeAmount = providerEvent.feeAmount !== undefined ? providerEvent.feeAmount : 0;
  const netAmount = providerEvent.netAmount !== undefined ? providerEvent.netAmount : (payment.amount - feeAmount);

  await paymentsRepo.addEvent({
    workspaceId: payment.workspaceId,
    paymentId: payment.id,
    event: {
      providerEventId: providerEvent.providerTransactionId,
      eventType: 'settlement',
      status: 'paid',
      amount: providerEvent.amount || payment.amount,
      currency: providerEvent.currency || 'IDR',
      feeAmount,
      netAmount,
      paymentMethod: providerEvent.paymentMethod,
      paidAt: providerEvent.paidAt ? new Date(providerEvent.paidAt) : new Date(),
    },
  });

  const orderBefore = payment.orderId ? await (deps.ordersRepository || ordersRepository).workspaceFindById({ workspaceId: payment.workspaceId, orderId: payment.orderId }) : null;
  const wasAlreadyPaid = orderBefore?.paymentStatus === PaymentStatus.PAID || orderBefore?.payment_status === PaymentStatus.PAID;
  const updatedOrder = await markOrderPaidPreparing({ workspaceId: payment.workspaceId, orderId: payment.orderId, paidAt: providerEvent.paidAt }, deps);

  if (updatedOrder) {
    notifyPaymentUpdated({ workspaceId: payment.workspaceId, outletId: updated?.outletId || updatedOrder.outletId, payment: updated, order: updatedOrder });
    if (!wasAlreadyPaid) {
      notifyPaidOrder({ workspaceId: payment.workspaceId, outletId: updatedOrder.outletId, order: updatedOrder });
      try {
        await sendStatusMessage({
          order: updatedOrder,
          from: 'ai',
          messageText: `Pembayaran pesanan ${updatedOrder.orderNumber || ''} sudah kami terima.\n\nPesanan otomatis masuk ke kitchen dan sedang diproses.\n\nKami akan memberi tahu saat pesanan siap diambil.`,
        });
      } catch (err) {
        console.error('[PaymentReconciliation] Failed to send paid notification:', err.message);
      }
    }
  }
  return { updated: true, payment: updated, order: updatedOrder, paidNotificationSent: Boolean(updatedOrder && !wasAlreadyPaid) };
}

async function resolveStatusQueryAdapter({ workspaceId, provider }, deps = {}) {
  const resolver = deps.resolvePaymentProvider || resolvePaymentProvider;
  const resolved = await resolver({ workspaceId, provider, capability: 'statusQuery' });
  if (!resolved.capabilities?.supportsStatusQuery || !resolved.adapter?.getPayment) {
    throw new AppError('PAYMENT_PROVIDER_STATUS_QUERY_UNSUPPORTED', `${provider} does not support payment status reconciliation`, 400);
  }
  return resolved;
}

export async function detectMissingWebhooks({ workspaceId, limit = 50 }) {
  const data = await paymentsRepository.list({
    workspaceId,
    reconciliationStatus: 'missing_webhook',
    page: 1,
    limit,
  });
  const total = await paymentsRepository.count({
    workspaceId,
    reconciliationStatus: 'missing_webhook',
  });

  return { data, meta: { total, page: 1, limit } };
}

export async function reconcileMissingWebhook({ workspaceId, paymentId }, deps = {}) {
  const paymentsRepo = deps.paymentsRepository || paymentsRepository;
  const payment = await paymentsRepo.findById({ workspaceId, paymentId });
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);
  if (payment.reconciliationStatus !== 'missing_webhook') {
    return payment;
  }

  if (!payment.providerTransactionId) {
    throw new AppError('MISSING_TRANSACTION', 'No provider transaction ID for this payment', 400);
  }

  const { adapter, providerConfig } = await resolveStatusQueryAdapter({ workspaceId, provider: payment.provider }, deps);
  const result = await adapter.getPayment(payment.providerTransactionId, providerConfig);

  if (result.status === 'paid' && payment.status !== 'paid') {
    await processPaidPaymentFromReconciliation({ payment, providerEvent: result }, deps);
  }

  const updated = await paymentsRepo.findById({ workspaceId, paymentId });
  const order = updated?.orderId ? await (deps.ordersRepository || ordersRepository).workspaceFindById({ workspaceId, orderId: updated.orderId }) : null;
  const recStatus = determineReconciliationStatus({ payment: updated, order, providerStatus: result.status });
  const finalPayment = recStatus !== updated.reconciliationStatus
    ? await paymentsRepo.updatePayment({ workspaceId, paymentId, updates: { reconciliation_status: recStatus } })
    : updated;
  await reconcilePaymentAudit({ workspaceId, paymentId, oldStatus: 'missing_webhook', newStatus: finalPayment.reconciliationStatus, providerStatus: result.status, order }, deps);
  return finalPayment;
}

export async function reconcilePendingProviderPayment({ workspaceId, paymentId }, deps = {}) {
  const paymentsRepo = deps.paymentsRepository || paymentsRepository;
  const payment = await paymentsRepo.findById({ workspaceId, paymentId });
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);
  if (!['pending', 'processing'].includes(payment.status)) return { reconciled: false, reason: 'not_pending', payment };
  if (!payment.providerTransactionId) return { reconciled: false, reason: 'missing_transaction', payment };

  const { adapter, providerConfig } = await resolveStatusQueryAdapter({ workspaceId, provider: payment.provider }, deps);
  const result = await adapter.getPayment(payment.providerTransactionId, providerConfig);
  let updatedPayment = payment;
  let paidResult = null;

  if (result.status === 'paid') {
    paidResult = await processPaidPaymentFromReconciliation({ payment, providerEvent: result }, deps);
    updatedPayment = await paymentsRepo.findById({ workspaceId, paymentId });
  } else if (result.status === 'expired') {
    updatedPayment = await paymentsRepo.updatePayment({ workspaceId, paymentId, updates: { reconciliation_status: 'pending' } }) || payment;
  }

  const order = updatedPayment?.orderId ? await (deps.ordersRepository || ordersRepository).workspaceFindById({ workspaceId, orderId: updatedPayment.orderId }) : null;
  const recStatus = determineReconciliationStatus({ payment: updatedPayment, order, providerStatus: result.status });
  if (recStatus !== updatedPayment.reconciliationStatus) {
    updatedPayment = await paymentsRepo.updatePayment({ workspaceId, paymentId, updates: { reconciliation_status: recStatus } }) || updatedPayment;
  }
  await reconcilePaymentAudit({ workspaceId, paymentId, oldStatus: payment.reconciliationStatus, newStatus: updatedPayment.reconciliationStatus, providerStatus: result.status, order }, deps);
  return { reconciled: true, providerStatus: result.status, payment: updatedPayment, order, paidNotificationSent: paidResult?.paidNotificationSent === true };
}

export async function reconcilePaymentAudit({ workspaceId, paymentId, oldStatus, newStatus, providerStatus, order }, deps = {}) {
  const client = (deps.getSupabaseServiceClient || getSupabaseServiceClient)();
  const auditLog = {
    workspace_id: workspaceId,
    payment_id: paymentId,
    old_status: oldStatus,
    new_status: newStatus,
    provider_status: providerStatus,
    order_id: order?.id || null,
    order_number: order?.orderNumber || null,
    auditor: 'system',
    audited_at: new Date().toISOString(),
  };
  await client.from('reconciliation_audit').insert(auditLog);
}
