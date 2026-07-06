export function assertPaymentProviderAuthority({ runtimeProvider, requestedProvider }) {
  return Object.freeze({ provider: runtimeProvider || requestedProvider || 'manual' });
}

export function assertPaymentSnapshot({ amount, currency = 'IDR', expiresAt }) {
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) throw new Error('INVALID_PAYMENT_AMOUNT');
  if (currency !== 'IDR') throw new Error('INVALID_PAYMENT_CURRENCY');
  if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) throw new Error('INVALID_PAYMENT_EXPIRY');
}

export function assertPaidOnlyFromVerifiedProvider({ source, verified }) {
  if (!verified || !['verified_webhook', 'reconciliation'].includes(source)) {
    throw new Error('PAYMENT_PAID_AUTHORITY_REQUIRED');
  }
}

export function assertCanonicalOrderCreation({ source, checkoutId }) {
  if (source !== 'cart_checkout_order' || !checkoutId) throw new Error('ORDER_CANONICAL_FLOW_REQUIRED');
}
