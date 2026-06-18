import { paymentsSupabaseRepository as paymentsRepository, ordersSupabaseRepository as ordersRepository } from '../db/repositories/index.js';
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
  if (recStatus !== payment.reconciliationStatus) {
    return paymentsRepository.updatePayment(paymentId, { reconciliationStatus: recStatus });
  }
  return payment;
}

export async function batchReconcileByStatus({ workspaceId, status, newStatus }) {
  const payments = await paymentsRepository.list({ workspaceId, status });
  const results = [];
  for (const payment of payments) {
    const order = payment.orderId ? await ordersRepository.workspaceFindById({ workspaceId, orderId: payment.orderId }) : null;
    const recStatus = determineReconciliationStatus({ payment, order, providerStatus: status });
    if (recStatus !== payment.reconciliationStatus) {
      await paymentsRepository.updatePayment(payment.id, { reconciliation_status: recStatus });
      results.push({ paymentId: payment.id, oldStatus: payment.reconciliationStatus, newStatus: recStatus });
    }
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

  await paymentsRepository.addEvent({
    paymentId: payment.id,
    event: {
      providerEventId: providerEvent.providerTransactionId,
      eventType: 'settlement',
      status: 'paid',
      amount: providerEvent.amount || payment.amount,
      currency: providerEvent.currency || 'IDR',
      feeAmount: providerEvent.feeAmount || 0,
      netAmount: providerEvent.netAmount || (payment.amount - (providerEvent.feeAmount || 0)),
      paymentMethod: providerEvent.paymentMethod,
      paidAt: providerEvent.paidAt ? new Date(providerEvent.paidAt) : new Date(),
    },
  });

  await ordersRepository.updateOne({ workspaceId: payment.workspaceId, orderId: payment.orderId, updates: { payment_status: 'paid' } });
}

async function loadPaymentAdapter(provider) {
  if (provider === 'midtrans') return import('../integrations/payments/midtrans-client.js');
  if (provider === 'xendit') return import('../integrations/payments/xendit-client.js');
  throw new AppError('UNKNOWN_PROVIDER', `Unknown payment provider: ${provider}`, 400);
}
