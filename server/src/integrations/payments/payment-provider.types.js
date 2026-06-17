/**
 * Canonical payment provider contract.
 * Each provider adapter must implement these methods.
 */

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded'];

export const RECONCILIATION_STATUSES = ['pending', 'matched', 'missing_webhook', 'unmatched', 'amount_mismatch', 'duplicate', 'provider_paid_order_pending'];

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
