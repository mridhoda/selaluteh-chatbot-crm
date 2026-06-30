import { paymentsSupabaseRepository as paymentsRepository, ordersSupabaseRepository as ordersRepository } from '../db/repositories/index.js';
import { notifyPaidOrderRealtime, notifyPaymentUpdatedRealtime, sendOrderStatusMessage } from './order.service.js';
import { AppError } from '../utils/errors.js';

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

export async function retryPaymentProcessing({ workspaceId, paymentId }) {
  const payment = await paymentsRepository.findById({ workspaceId, paymentId });
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);

  if (payment.reconciliationStatus === 'missing_webhook' && payment.providerTransactionId) {
    const adapter = await loadPaymentAdapter(payment.provider);
    const result = await adapter.getPayment(payment.providerTransactionId);
    if (result.status === 'paid' && payment.status !== 'paid') {
      await processPaidPaymentFromReconciliation({ payment, providerEvent: result });
    }
  }

  return paymentsRepository.findById({ workspaceId, paymentId });
}

async function processPaidPaymentFromReconciliation({ payment, providerEvent }) {
  const updated = await paymentsRepository.atomicStatusUpdate({
    paymentId: payment.id,
    expectedStatus: 'pending',
    newStatus: 'paid',
  });
  if (!updated) return;

  const feeAmount = providerEvent.feeAmount !== undefined ? providerEvent.feeAmount : 0;
  const netAmount = providerEvent.netAmount !== undefined ? providerEvent.netAmount : (payment.amount - feeAmount);

  await paymentsRepository.addEvent({
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

  const updatedOrder = await ordersRepository.updateOne({
    workspaceId: payment.workspaceId,
    orderId: payment.orderId,
    updates: { payment_status: 'paid', status: 'accepted', paid_at: new Date().toISOString() },
  });

  if (updatedOrder) {
    notifyPaymentUpdatedRealtime({ workspaceId: payment.workspaceId, outletId: updated?.outletId || updatedOrder.outletId, payment: updated, order: updatedOrder });
    notifyPaidOrderRealtime({ workspaceId: payment.workspaceId, outletId: updatedOrder.outletId, order: updatedOrder });
    try {
      await sendOrderStatusMessage({
        order: updatedOrder,
        from: 'ai',
        messageText: `Pembayaran pesanan ${updatedOrder.orderNumber || ''} sudah kami terima ✅\n\nPesanan telah dikonfirmasi dan akan segera diproses.\n\nKami akan memberi tahu saat pesanan siap diambil.`,
      });
    } catch (err) {
      console.error('[PaymentReconciliation] Failed to send paid notification:', err.message);
    }
  }
}

async function loadPaymentAdapter(provider) {
  if (provider === 'xendit') return import('../integrations/payments/xendit-client.js');
  if (provider === 'doku') return import('../integrations/payments/doku-client.js');
  throw new AppError('UNKNOWN_PROVIDER', `Unknown payment provider: ${provider}`, 400);
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

export async function reconcileMissingWebhook({ workspaceId, paymentId }) {
  const payment = await paymentsRepository.findById({ workspaceId, paymentId });
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);
  if (payment.reconciliationStatus !== 'missing_webhook') {
    return payment;
  }

  if (!payment.providerTransactionId) {
    throw new AppError('MISSING_TRANSACTION', 'No provider transaction ID for this payment', 400);
  }

  const adapter = await loadPaymentAdapter(payment.provider);
  const result = await adapter.getPayment(payment.providerTransactionId);

  if (result.status === 'paid' && payment.status !== 'paid') {
    await processPaidPaymentFromReconciliation({ payment, providerEvent: result });
  }

  const updated = await paymentsRepository.findById({ workspaceId, paymentId });
  await reconcilePaymentAudit({ workspaceId, paymentId, oldStatus: 'missing_webhook', newStatus: updated.reconciliationStatus, providerStatus: result.status });
  return updated;
}

export async function reconcilePaymentAudit({ workspaceId, paymentId, oldStatus, newStatus, providerStatus, order }) {
  const client = getSupabaseServiceClient();
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
