import { env } from '../../config/env.js';

export async function createPayment(params) {
  return {
    providerTransactionId: `xendit-${params.merchantReference}-${Date.now()}`,
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
  const statusMap = { PAID: 'paid', SETTLED: 'paid', PENDING: 'pending', EXPIRED: 'expired', CANCELLED: 'cancelled' };
  return {
    providerTransactionId: providerEvent.id || providerEvent.invoice_id,
    merchantReference: providerEvent.external_id,
    eventType: providerEvent.status,
    status: statusMap[providerEvent.status] || 'pending',
    amount: providerEvent.amount || 0,
    currency: providerEvent.currency || 'IDR',
    feeAmount: providerEvent.fee_amount || 0,
    netAmount: providerEvent.net_amount || 0,
    paymentMethod: providerEvent.payment_method || providerEvent.payment_channel,
    paidAt: providerEvent.paid_at || providerEvent.updated,
    raw: providerEvent,
  };
}
