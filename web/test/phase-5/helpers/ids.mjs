export function createCheckoutIdempotencyKeyFixture(suffix = '001') {
  return `phase5-checkout-idempotency-${suffix}`
}

export function createQrTokenFixture(suffix = 'outlet-001') {
  return `qr_phase5_${suffix}_token_fixture`
}
