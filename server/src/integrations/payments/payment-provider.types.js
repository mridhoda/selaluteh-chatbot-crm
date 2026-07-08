/**
 * Canonical payment provider contract.
 * Each provider adapter must implement the same provider-agnostic surface.
 */

export const PAYMENT_STATUSES = Object.freeze(['unpaid', 'pending', 'processing', 'paid', 'failed', 'expired', 'cancelled', 'refunded', 'manual_review']);

export const RECONCILIATION_STATUSES = Object.freeze(['pending', 'matched', 'missing_webhook', 'unmatched', 'amount_mismatch', 'duplicate', 'provider_paid_order_pending', 'manual_review']);

export const PAYMENT_PROVIDER_CODES = Object.freeze({
  BAYARGG: 'bayargg',
  DOKU: 'doku',
  XENDIT: 'xendit',
  MIDTRANS: 'midtrans',
  MANUAL: 'manual',
});

export const PAYMENT_METHODS = Object.freeze({
  QRIS: 'qris',
  VIRTUAL_ACCOUNT: 'virtual_account',
  EWALLET: 'ewallet',
  CARD: 'card',
  MANUAL_TRANSFER: 'manual_transfer',
  LINK_PAYMENT: 'link_payment',
});

export const PROVIDER_ERROR_CODES = Object.freeze({
  UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  TIMEOUT: 'PROVIDER_TIMEOUT',
  INVALID_RESPONSE: 'PROVIDER_INVALID_RESPONSE',
  UNAUTHORIZED: 'PROVIDER_UNAUTHORIZED',
  RATE_LIMITED: 'PROVIDER_RATE_LIMITED',
  PAYMENT_REJECTED: 'PROVIDER_PAYMENT_REJECTED',
  SIGNATURE_INVALID: 'PROVIDER_SIGNATURE_INVALID',
  AMOUNT_MISMATCH: 'PROVIDER_AMOUNT_MISMATCH',
  REFERENCE_NOT_FOUND: 'PROVIDER_REFERENCE_NOT_FOUND',
});

export const SAFE_PAYMENT_ERRORS = Object.freeze({
  PROVIDER_UNAVAILABLE: 'PAYMENT_PROVIDER_UNAVAILABLE',
  CREATION_FAILED: 'PAYMENT_CREATION_FAILED',
  STATUS_UNKNOWN: 'PAYMENT_STATUS_UNKNOWN',
  EXPIRED: 'PAYMENT_EXPIRED',
});

export function normalizeProviderCode(provider) {
  return String(provider || '').trim().toLowerCase();
}

export function normalizeProviderStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  if (['success', 'succeeded', 'settled', 'settlement', 'completed', 'capture', 'paid'].includes(value)) return 'paid';
  if (['created', 'active', 'waiting_provider', 'waiting', 'pending', 'unpaid'].includes(value)) return 'pending';
  if (['processing', 'process'].includes(value)) return 'processing';
  if (['expire', 'expired'].includes(value)) return 'expired';
  if (['cancel', 'canceled', 'cancelled'].includes(value)) return 'cancelled';
  if (['refund', 'refunded'].includes(value)) return 'refunded';
  if (['manual_review', 'review_required'].includes(value)) return 'manual_review';
  if (['fail', 'failed', 'deny', 'denied', 'rejected'].includes(value)) return 'failed';
  return 'pending';
}

export function assertPaymentAdapterContract(adapter, provider = 'unknown') {
  const required = ['createPayment', 'verifyWebhook', 'getPayment'];
  for (const method of required) {
    if (typeof adapter?.[method] !== 'function') {
      throw new Error(`Payment adapter ${provider} must implement ${method}()`);
    }
  }
  return Object.freeze({
    ...adapter,
    createPayment: adapter.createPayment,
    verifyWebhook: adapter.verifyWebhook,
    getPayment: adapter.getPayment,
    createPaymentSession: typeof adapter.createPaymentSession === 'function' ? adapter.createPaymentSession : adapter.createPayment,
    getPaymentSession: typeof adapter.getPaymentSession === 'function' ? adapter.getPaymentSession : adapter.getPayment,
    cancelPayment: typeof adapter.cancelPayment === 'function' ? adapter.cancelPayment : async () => ({ success: false, unsupported: true }),
    refundPayment: typeof adapter.refundPayment === 'function' ? adapter.refundPayment : async () => ({ success: false, unsupported: true }),
  });
}

/**
 * @typedef {Object} CreatePaymentParams
 * @property {string} orderId
 * @property {string} merchantReference - unique internal reference
 * @property {number} amount
 * @property {string} currency
 * @property {Object} customer - { name, email, phone }
 * @property {Object} [items] - optional item details
 * @property {string} [returnUrl]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} PaymentResult
 * @property {string} providerTransactionId
 * @property {string} merchantReference
 * @property {string} status - pending|paid|failed|expired
 * @property {number} amount
 * @property {string} currency
 * @property {string} paymentUrl - checkout URL to send to customer
 * @property {Object} [rawProviderResponse]
 */

/**
 * @typedef {Object} VerifiedWebhookEvent
 * @property {string} providerTransactionId
 * @property {string} merchantReference
 * @property {string} eventType - e.g. settlement, expired, deny
 * @property {string} status - paid|failed|expired
 * @property {number} amount
 * @property {string} currency
 * @property {number} [feeAmount]
 * @property {number} [netAmount]
 * @property {string} [paymentMethod]
 * @property {string} [paidAt]
 * @property {Object} [raw]
 */

/**
 * Contract methods each adapter must export:
 *
 * createPayment(params: CreatePaymentParams): Promise<PaymentResult>
 *   - Creates a payment link/transaction at the provider.
 *
 * getPayment(providerTransactionId: string): Promise<PaymentResult>
 *   - Queries payment status from provider.
 *
 * cancelPayment(providerTransactionId: string): Promise<{ success: boolean }>
 *   - Attempts to cancel/void a pending transaction.
 *
 * verifyWebhook(rawBody: string, headers: Object): Promise<{ valid: boolean, event: VerifiedWebhookEvent|null }>
 *   - Verifies webhook signature, parses and normalizes event.
 *
 * normalizeEvent(providerEvent: Object): Promise<VerifiedWebhookEvent>
 *   - Converts provider-specific webhook payload to canonical event.
 *
 * refundPayment(providerTransactionId: string, amount?: number): Promise<{ success: boolean }>
 *   - Optional. Initiates refund.
 */
