import { createCheckoutIdempotencyKeyFixture, createQrTokenFixture } from '../helpers/ids.mjs'

export const backendErrorFixtures = Object.freeze({
  qrExpired: { ok: false, error: { code: 'QR_EXPIRED', message: 'QR code has expired.' } },
  qrRevoked: { ok: false, error: { code: 'QR_REVOKED', message: 'QR code is no longer active.' } },
  qrOutletMismatch: { ok: false, error: { code: 'QR_OUTLET_MISMATCH', message: 'Selected outlet is not allowed for this QR session.' } },
  qrLocationMismatch: { ok: false, error: { code: 'QR_LOCATION_MISMATCH', message: 'Selected location is not allowed for this QR session.' } },
  productUnavailable: { ok: false, error: { code: 'PRODUCT_UNAVAILABLE', message: 'A product is unavailable.' } },
  modifierInvalid: { ok: false, error: { code: 'MODIFIER_INVALID', message: 'A selected modifier is invalid.' } },
  checkoutIdempotencyRequired: { ok: false, error: { code: 'CHECKOUT_IDEMPOTENCY_REQUIRED', message: 'Idempotency-Key header is required.' } },
  idempotencyConflict: { ok: false, error: { code: 'IDEMPOTENCY_CONFLICT', message: 'Idempotency key was already used for a different checkout request.' } },
  paymentProviderError: { ok: false, error: { code: 'PAYMENT_PROVIDER_ERROR', message: 'Payment provider could not create a payment session.' } },
  orderInvalidTransition: { ok: false, error: { code: 'ORDER_INVALID_TRANSITION', message: 'Order cannot move to the requested state.' } },
  orderUnpaid: { ok: false, error: { code: 'ORDER_UNPAID', message: 'Order is not paid yet.' } },
  forbidden: { ok: false, error: { code: 'FORBIDDEN', message: 'You are not allowed to perform this action.' } },
  rateLimited: { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
  internalError: { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error.' } },
})

export const publicStorefrontFixture = Object.freeze({
  storefront: {
    id: 'storefront-selkop-test',
    slug: 'selalu-kopi',
    name: 'Selkop Online Store',
    brandName: 'Selkop',
    orderingEnabled: true,
  },
  outlets: [
    {
      id: 'outlet-smd-001',
      name: 'SELKOP Samarinda',
      address: 'Jl. Mayor Jendral Sutoyo No.9, Samarinda',
      isAvailable: true,
      isLockedFromQr: false,
    },
  ],
  menu: {
    categories: [{ id: 'cat-signature', name: 'Signature', sortOrder: 1 }],
    products: [
      {
        id: 'prod-aren-creamy',
        categoryId: 'cat-signature',
        name: 'Selkop Aren Creamy',
        description: 'Creamy coffee with palm sugar.',
        basePriceMinor: 15000,
        availability: 'available',
        modifierGroups: [],
      },
    ],
  },
})

export const qrResolveFixture = Object.freeze({
  qrSessionToken: createQrTokenFixture(),
  qrSession: {
    id: null,
    qrCodeId: 'qr-code-outlet-smd-001',
    outletLocked: true,
    locationLocked: true,
    expiresAt: '2026-07-08T02:00:00.000Z',
  },
  outlet: {
    id: 'outlet-smd-001',
    name: 'SELKOP Samarinda',
  },
  qrContext: {
    qrLocationId: 'qr-location-table-07',
    locationType: 'table',
    locationLabel: 'Table 7',
  },
  storefront: publicStorefrontFixture.storefront,
  menu: publicStorefrontFixture.menu,
})

export const cartValidationRequestFixture = Object.freeze({
  storefrontSlug: 'selalu-kopi',
  outletId: 'outlet-smd-001',
  qrSessionToken: createQrTokenFixture(),
  items: [
    {
      productId: 'prod-aren-creamy',
      quantity: 2,
      selectedModifierOptionIds: [],
      clientLineId: 'line-001',
    },
  ],
})

export const cartValidationResponseFixture = Object.freeze({
  valid: true,
  cart: {
    items: [
      {
        productId: 'prod-aren-creamy',
        productName: 'Selkop Aren Creamy',
        quantity: 2,
        unitPriceMinor: 15000,
        lineTotalMinor: 30000,
      },
    ],
    totals: {
      subtotalMinor: 30000,
      discountMinor: 0,
      serviceFeeMinor: 0,
      taxMinor: 0,
      totalMinor: 30000,
    },
  },
  validationErrors: [],
})

export const checkoutRequestFixture = Object.freeze({
  headers: {
    'Idempotency-Key': createCheckoutIdempotencyKeyFixture(),
  },
  body: {
    storefrontSlug: 'selalu-kopi',
    outletId: 'outlet-smd-001',
    qrSessionToken: createQrTokenFixture(),
    customer: {
      name: 'Tamu Selkop',
      phone: '6281234567890',
    },
    items: cartValidationRequestFixture.items,
  },
})

export const checkoutResponseFixture = Object.freeze({
  checkoutToken: 'checkout_public_test_001',
  publicOrderToken: 'public_order_test_001',
  paymentId: 'payment_test_001',
  paymentUrl: 'https://payments.example.test/pay/payment_test_001',
  paymentStatus: 'pending',
  publicOrderStatus: 'payment_pending',
  totals: cartValidationResponseFixture.cart.totals,
})

export const paymentStatusFixture = Object.freeze({
  paymentId: 'payment_test_001',
  status: 'pending',
  paymentUrl: 'https://payments.example.test/pay/payment_test_001',
  publicOrderToken: 'public_order_test_001',
  publicOrderStatus: 'payment_pending',
  expiresAt: '2026-07-08T02:15:00.000Z',
})

export const publicOrderTrackingFixture = Object.freeze({
  publicOrderToken: 'public_order_test_001',
  orderNumberPublic: 'STH-TEST-001',
  queueNumber: 'A07',
  publicOrderStatus: 'preparing',
  paymentStatus: 'paid',
  customer: { name: 'Tamu Selkop', phoneMasked: '6281****890' },
  outlet: { id: 'outlet-smd-001', name: 'SELKOP Samarinda' },
  qrContext: { locationLabel: 'Table 7' },
  items: cartValidationResponseFixture.cart.items,
  totals: cartValidationResponseFixture.cart.totals,
})

export const adminOrderListFixture = Object.freeze({
  data: [
    {
      id: 'order-test-001',
      orderNumber: 'STH-TEST-001',
      publicOrderToken: 'public_order_test_001',
      customerName: 'Tamu Selkop',
      paymentStatus: 'paid',
      fulfillmentStatus: 'awaiting_acceptance',
      publicOrderStatus: 'preparing',
      allowed_actions: ['accept_order', 'cancel_order'],
    },
  ],
  pagination: { page: 1, pageSize: 20, total: 1 },
})

export const adminOrderDetailFixture = Object.freeze({
  ...adminOrderListFixture.data[0],
  outlet: { id: 'outlet-smd-001', name: 'SELKOP Samarinda' },
  qrContext: { qrLocationId: 'qr-location-table-07', locationLabel: 'Table 7' },
  items: publicOrderTrackingFixture.items,
  totals: publicOrderTrackingFixture.totals,
  timeline: [{ at: '2026-07-08T01:30:00.000Z', label: 'Order paid' }],
})

export const adminOrderActionRequestFixture = Object.freeze({
  action: 'accept',
  body: { reason: null },
})

export const adminOrderActionResponseFixture = Object.freeze({
  order: {
    ...adminOrderDetailFixture,
    fulfillmentStatus: 'accepted',
    allowed_actions: ['mark_preparing', 'cancel_order'],
  },
})

export const adminQrSettingsFixture = Object.freeze({
  qrCodes: [
    {
      id: 'qr-code-outlet-smd-001',
      outletId: 'outlet-smd-001',
      outletLocked: true,
      status: 'active',
      locationLabel: 'Table 7',
    },
  ],
})

export const adminPaymentSettingsFixture = Object.freeze({
  provider: 'bayargg',
  enabled: true,
  sandboxMode: true,
  publicDisplayName: 'Online Payment',
})

export const phase5ApiFixtures = Object.freeze({
  publicStorefront: publicStorefrontFixture,
  qrResolve: qrResolveFixture,
  cartValidationRequest: cartValidationRequestFixture,
  cartValidationResponse: cartValidationResponseFixture,
  checkoutRequest: checkoutRequestFixture,
  checkoutResponse: checkoutResponseFixture,
  paymentStatus: paymentStatusFixture,
  publicOrderTracking: publicOrderTrackingFixture,
  adminOrderList: adminOrderListFixture,
  adminOrderDetail: adminOrderDetailFixture,
  adminOrderActionRequest: adminOrderActionRequestFixture,
  adminOrderActionResponse: adminOrderActionResponseFixture,
  adminQrSettings: adminQrSettingsFixture,
  adminPaymentSettings: adminPaymentSettingsFixture,
  backendErrors: backendErrorFixtures,
})

export function createFakeApiResponse(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, data }
}

export function createFakeApiError(errorFixture, status = 400) {
  return { ok: false, status, ...errorFixture }
}
