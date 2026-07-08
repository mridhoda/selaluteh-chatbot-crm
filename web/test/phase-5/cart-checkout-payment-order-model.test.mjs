import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildCartValidationPayload,
  buildCheckoutPayload,
  canStartCheckoutMutation,
  createCartIntentContext,
  createCartIntentItem,
  createCartPreview,
  createCheckoutAttempt,
  getNextPaymentPollingDelay,
  getPaymentStatusLabel,
  normalizePaymentStatus,
  normalizeValidatedCart,
  sanitizePublicOrder,
  shouldSlowPaymentPolling,
  shouldStopPaymentPolling,
  toTimelineStatus,
} from '../../src/features/public-store/utils/cartIntentModel.js'
import { phase5ApiFixtures } from './fixtures/api-contract-fixtures.mjs'

test('cart intent stores product, quantity, modifier option ids, allowed outlet, and QR token only', () => {
  const item = createCartIntentItem({
    productId: 'prod-aren-creamy',
    quantity: 2,
    selectedModifierOptionIds: ['opt-ice', 'opt-less-sugar'],
    clientLineId: 'line-safe-001',
  })
  const context = createCartIntentContext({
    storefrontSlug: 'selalu-kopi',
    outletId: 'outlet-smd-001',
    qrSessionToken: 'qr-safe-token',
    includeOutlet: true,
  })

  assert.deepEqual(item, {
    clientLineId: 'line-safe-001',
    productId: 'prod-aren-creamy',
    quantity: 2,
    selectedModifierOptionIds: ['opt-ice', 'opt-less-sugar'],
  })
  assert.deepEqual(context, {
    storefrontSlug: 'selalu-kopi',
    outletId: 'outlet-smd-001',
    qrSessionToken: 'qr-safe-token',
  })
  assert.equal('customer' in item, false)
  assert.equal('paymentStatus' in item, false)
  assert.equal('totalMinor' in item, false)
})

test('stored cart intent can be reconstructed without customer, payment, or authority fields', () => {
  const item = createCartIntentItem({
    clientLineId: 'legacy-line-001',
    productId: 'prod-aren-creamy',
    quantity: 1,
    selectedModifierOptionIds: [],
    customer: { phone: '6281234567890' },
    paymentStatus: 'paid',
    lineTotalMinor: 999999,
  })

  assert.deepEqual(Object.keys(item).sort(), ['clientLineId', 'productId', 'quantity', 'selectedModifierOptionIds'].sort())
})

test('locked QR context omits selected outlet and relies on backend QR session authority', () => {
  const context = createCartIntentContext({
    storefrontSlug: 'selalu-kopi',
    outletId: 'outlet-smd-001',
    qrSessionToken: 'qr-locked-token',
    includeOutlet: false,
  })

  assert.deepEqual(context, { storefrontSlug: 'selalu-kopi', qrSessionToken: 'qr-locked-token' })
})

test('cart validation payload uses intent fields and normalized backend totals become authority', () => {
  const payload = buildCartValidationPayload({
    context: phase5ApiFixtures.cartValidationRequest,
    items: phase5ApiFixtures.cartValidationRequest.items,
  })
  const validated = normalizeValidatedCart(phase5ApiFixtures.cartValidationResponse)

  assert.equal(payload.items[0].productId, 'prod-aren-creamy')
  assert.equal(payload.items[0].quantity, 2)
  assert.equal(payload.items[0].selectedModifierOptionIds.length, 0)
  assert.equal(payload.totalMinor, undefined)
  assert.equal(validated.totals.totalMinor, 30000)
  assert.equal(validated.totalsAuthority, 'backend_validated')
})

test('local cart totals are preview only and never checkout authority', () => {
  const preview = createCartPreview({
    context: { storefrontSlug: 'selalu-kopi', outletId: 'outlet-smd-001' },
    items: [{ productId: 'prod-aren-creamy', quantity: 2, selectedModifierOptionIds: [], clientLineId: 'line-001' }],
    products: phase5ApiFixtures.publicStorefront.menu.products,
  })
  const checkoutPayload = buildCheckoutPayload({
    context: { storefrontSlug: 'selalu-kopi', outletId: 'outlet-smd-001' },
    items: [{ productId: 'prod-aren-creamy', quantity: 2, selectedModifierOptionIds: [], clientLineId: 'line-001' }],
    customer: { name: 'Tamu Selkop', phone: '6281234567890', note: 'less ice' },
  })

  assert.equal(preview.totalsAuthority, 'local_preview_only')
  assert.equal(preview.totals.totalMinor > 0, true)
  assert.equal(checkoutPayload.totals, undefined)
  assert.equal(checkoutPayload.totalMinor, undefined)
  assert.equal(checkoutPayload.payment_status, undefined)
  assert.equal(checkoutPayload.fulfillment_status, undefined)
})

test('checkout idempotency reuses key for same attempt and can generate new attempt intentionally', () => {
  const first = createCheckoutAttempt({ generator: () => 'idem-001' })
  const retry = createCheckoutAttempt({ existingAttempt: first, generator: () => 'idem-should-not-use' })
  const next = createCheckoutAttempt({ generator: () => 'idem-002' })

  assert.equal(first.idempotencyKey, 'idem-001')
  assert.equal(retry.idempotencyKey, 'idem-001')
  assert.equal(next.idempotencyKey, 'idem-002')
})

test('checkout duplicate prevention requires not submitting, items, and backend validated cart', () => {
  assert.equal(canStartCheckoutMutation({ submitting: true, hasItems: true, hasValidatedCart: true }), false)
  assert.equal(canStartCheckoutMutation({ submitting: false, hasItems: false, hasValidatedCart: true }), false)
  assert.equal(canStartCheckoutMutation({ submitting: false, hasItems: true, hasValidatedCart: false }), false)
  assert.equal(canStartCheckoutMutation({ submitting: false, hasItems: true, hasValidatedCart: true }), true)
})

test('redirect and payment URL are never treated as paid', () => {
  const payment = normalizePaymentStatus({
    paymentId: 'payment_test_001',
    paymentUrl: 'https://payments.example.test/pay/1',
    status: 'pending',
    publicOrderToken: 'public_order_test_001',
  })

  assert.equal(payment.paymentUrl.includes('https://payments.example.test'), true)
  assert.equal(payment.paymentStatus, 'pending')
  assert.equal(payment.isTerminal, false)
  assert.equal(getPaymentStatusLabel(payment.paymentStatus), 'Menunggu pembayaran')
})

test('payment polling stops on terminal statuses and continues for pending safely', () => {
  assert.equal(shouldStopPaymentPolling('pending'), false)
  assert.equal(shouldStopPaymentPolling('paid'), true)
  assert.equal(shouldStopPaymentPolling('failed'), true)
  assert.equal(shouldStopPaymentPolling('expired'), true)
  assert.equal(shouldStopPaymentPolling('manual_review'), true)
})

test('payment polling slows instead of hot-looping when rate limited', () => {
  const payment = normalizePaymentStatus({ status: 'rate_limited' })

  assert.equal(payment.isTerminal, false)
  assert.equal(payment.isRateLimited, true)
  assert.equal(shouldStopPaymentPolling('rate_limited'), false)
  assert.equal(shouldSlowPaymentPolling('rate_limited'), true)
  assert.equal(getNextPaymentPollingDelay('rate_limited', { intervalMs: 5000, rateLimitedIntervalMs: 45000 }), 45000)
  assert.equal(getNextPaymentPollingDelay('paid', { intervalMs: 5000, rateLimitedIntervalMs: 45000 }), null)
  assert.equal(getPaymentStatusLabel('rate_limited'), 'Terlalu banyak pengecekan')
})

test('public order sanitization hides internal IDs, raw provider payload, admin notes, and sensitive customer data', () => {
  const sanitized = sanitizePublicOrder({
    ...phase5ApiFixtures.publicOrderTracking,
    id: 'internal-order-id',
    internalOrderId: 'internal-order-id',
    providerPayload: { secret: 'raw-provider' },
    rawProviderPayload: { secret: 'raw-provider' },
    adminNotes: 'private note',
    adminUser: { id: 'admin-001' },
    customer: {
      name: 'Tamu Selkop',
      phone: '6281234567890',
      phoneMasked: '6281****890',
      email: 'secret@example.test',
    },
  })

  assert.equal(sanitized.orderNumberPublic, 'STH-TEST-001')
  assert.equal(sanitized.customer.phoneMasked, '6281****890')
  assert.equal(sanitized.id, undefined)
  assert.equal(sanitized.internalOrderId, undefined)
  assert.equal(sanitized.providerPayload, undefined)
  assert.equal(sanitized.rawProviderPayload, undefined)
  assert.equal(sanitized.adminNotes, undefined)
  assert.equal(sanitized.adminUser, undefined)
  assert.equal(sanitized.customer.phone, undefined)
  assert.equal(sanitized.customer.email, undefined)
  assert.equal(JSON.stringify(sanitized).includes('internal-order-id'), false)
  assert.equal(JSON.stringify(sanitized).includes('raw-provider'), false)
  assert.equal(JSON.stringify(sanitized).includes('private note'), false)
  assert.equal(JSON.stringify(sanitized).includes('6281234567890'), false)
})

test('stored public cart intent excludes customer contact and backend authority fields', () => {
  const stored = createCartIntentItem({
    productId: 'prod-aren-creamy',
    quantity: 1,
    selectedModifierOptionIds: [],
    customer: { name: 'Sensitive', phone: '6281234567890' },
    paymentStatus: 'paid',
    fulfillmentStatus: 'completed',
    totals: { totalMinor: 1 },
  })

  assert.deepEqual(Object.keys(stored).sort(), ['clientLineId', 'productId', 'quantity', 'selectedModifierOptionIds'].sort())
  assert.equal(JSON.stringify(stored).includes('6281234567890'), false)
  assert.equal(JSON.stringify(stored).includes('paid'), false)
})

test('public order sanitization drops unsafe invoice links and maps timeline statuses', () => {
  const sanitized = sanitizePublicOrder({
    ...phase5ApiFixtures.publicOrderTracking,
    publicOrderStatus: 'payment_expired',
    invoice: {
      downloadUrl: 'https://provider.example.test/raw-invoice',
      shareUrl: '/order/public_order_test_001',
      rawProviderPayload: { secret: 'hidden' },
    },
  })

  assert.equal(sanitized.invoice.downloadUrl, null)
  assert.equal(sanitized.invoice.shareUrl, '/order/public_order_test_001')
  assert.equal(sanitized.invoice.rawProviderPayload, undefined)
  assert.equal(toTimelineStatus(sanitized.publicOrderStatus), 'PAYMENT_EXPIRED')
})

test('public order model supports payment pending, failed, expired, and completed display states', () => {
  for (const [paymentStatus, publicOrderStatus] of [
    ['pending', 'payment_pending'],
    ['failed', 'payment_failed'],
    ['expired', 'payment_expired'],
    ['paid', 'completed'],
  ]) {
    const order = sanitizePublicOrder({ ...phase5ApiFixtures.publicOrderTracking, paymentStatus, publicOrderStatus })
    assert.equal(order.paymentStatus, paymentStatus)
    assert.equal(order.publicOrderStatus, publicOrderStatus)
  }
})
