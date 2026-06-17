import { env } from '../../config/env.js';

export async function createPayment(params) {
  return {
    providerTransactionId: `midtrans-${params.merchantReference}-${Date.now()}`,
    merchantReference: params.merchantReference,
    status: 'pending',
    amount: params.amount,
    currency: params.currency || 'IDR',
    paymentUrl: `${env.publicBaseUrl || 'https://example.com'}/pay/${params.merchantReference}`,
    rawProviderResponse: { simulated: true },
  };
}

export async function getPayment(providerTransactionId) {
  return {
    providerTransactionId,
    merchantReference: '',
    status: 'pending',
    amount: 0,
    currency: 'IDR',
    paymentUrl: '',
    rawProviderResponse: { simulated: true },
  };
}

export async function cancelPayment(providerTransactionId) {
  return { success: true };
}

export async function verifyWebhook(rawBody, headers) {
  const parsed = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  const event = await normalizeEvent(parsed);
  return { valid: true, event };
}

export async function normalizeEvent(providerEvent) {
  const statusMap = { settlement: 'paid', capture: 'paid', accept: 'paid', pending: 'pending', deny: 'failed', cancel: 'cancelled', expire: 'expired', refund: 'refunded' };
  return {
    providerTransactionId: providerEvent.transaction_id,
    merchantReference: providerEvent.order_id,
    eventType: providerEvent.transaction_status,
    status: statusMap[providerEvent.transaction_status] || 'pending',
    amount: parseInt(providerEvent.gross_amount || 0, 10),
    currency: providerEvent.currency || 'IDR',
    feeAmount: parseInt(providerEvent.fee_amount || 0, 10),
    netAmount: parseInt(providerEvent.net_amount || 0, 10),
    paymentMethod: providerEvent.payment_type,
    paidAt: providerEvent.settlement_time || providerEvent.transaction_time,
    raw: providerEvent,
  };
}
