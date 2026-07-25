import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createPhase5ApiClient,
  FORBIDDEN_PHASE5_REQUEST_FIELDS,
} from '../../src/features/public-store/api/phase5ApiClient.js'
import {
  getApiErrorMessage,
  mapBackendError,
  PHASE5_BACKEND_ERROR_MESSAGES,
} from '../../src/shared/api/apiError.js'
import { phase5ApiFixtures } from './fixtures/api-contract-fixtures.mjs'

function createRecordingFetch(responseBody = { ok: true }) {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => responseBody,
      text: async () => JSON.stringify(responseBody),
    }
  }
  return { calls, fetchImpl }
}

function parseBody(call) {
  return call.options.body ? JSON.parse(call.options.body) : undefined
}

test('checkout rejects backend-owned authority fields and requires Idempotency-Key', async () => {
  const { fetchImpl } = createRecordingFetch(phase5ApiFixtures.checkoutResponse)
  const client = createPhase5ApiClient({
    baseUrl: 'https://api.example.test',
    fetchImpl,
  })

  const forbiddenPayloads = FORBIDDEN_PHASE5_REQUEST_FIELDS.map((field) => ({
    ...phase5ApiFixtures.checkoutRequest.body,
    [field]: field === 'totalAmount' ? 30000 : 'client-owned',
  }))

  for (const payload of forbiddenPayloads) {
    await assert.rejects(
      () =>
        client.public.checkout(payload, {
          idempotencyKey:
            phase5ApiFixtures.checkoutRequest.headers['Idempotency-Key'],
        }),
      /Frontend cannot send backend-owned field/
    )
  }

  await assert.rejects(
    () => client.public.checkout(phase5ApiFixtures.checkoutRequest.body),
    /Idempotency-Key is required/
  )
})

test('checkout sends Idempotency-Key header and omits final totals/status authority', async () => {
  const { calls, fetchImpl } = createRecordingFetch(
    phase5ApiFixtures.checkoutResponse
  )
  const client = createPhase5ApiClient({
    baseUrl: 'https://api.example.test',
    fetchImpl,
  })

  await client.public.checkout(phase5ApiFixtures.checkoutRequest.body, {
    idempotencyKey:
      phase5ApiFixtures.checkoutRequest.headers['Idempotency-Key'],
  })

  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://api.example.test/api/v1/public/checkout')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(
    calls[0].options.headers['Idempotency-Key'],
    phase5ApiFixtures.checkoutRequest.headers['Idempotency-Key']
  )

  const body = parseBody(calls[0])
  assert.equal(body.payment_status, undefined)
  assert.equal(body.fulfillment_status, undefined)
  assert.equal(body.paymentStatus, undefined)
  assert.equal(body.fulfillmentStatus, undefined)
  assert.equal(body.finalTotal, undefined)
  assert.equal(body.totalAmount, undefined)
  assert.equal(body.totals, undefined)
})

test('public API methods use supported endpoints and QR session token only for QR-scoped cart/checkout bodies', async () => {
  const { calls, fetchImpl } = createRecordingFetch({ ok: true })
  const client = createPhase5ApiClient({
    baseUrl: 'https://api.example.test/',
    fetchImpl,
  })

  await client.public.getStorefront('selalu-kopi')
  await client.public.resolveQr('qr-token-001')
  await client.public.validateCart(phase5ApiFixtures.cartValidationRequest)
  await client.public.getPaymentStatus('payment_test_001')
  await client.public.getPublicOrder('public_order_test_001')

  assert.equal(
    calls[0].url,
    'https://api.example.test/api/v1/public/storefronts/selalu-kopi'
  )
  assert.equal(
    calls[1].url,
    'https://api.example.test/api/v1/public/qr/qr-token-001'
  )
  assert.equal(
    calls[2].url,
    'https://api.example.test/api/v1/public/carts/validate'
  )
  assert.equal(
    parseBody(calls[2]).qrSessionToken,
    phase5ApiFixtures.cartValidationRequest.qrSessionToken
  )
  assert.equal(
    calls[3].url,
    'https://api.example.test/api/v1/public/payments/payment_test_001/status'
  )
  assert.equal(
    calls[4].url,
    'https://api.example.test/api/v1/public/orders/public_order_test_001'
  )
})

test('recommendation API methods use cart-scoped public endpoints', async () => {
  const { calls, fetchImpl } = createRecordingFetch({ data: [] })
  const client = createPhase5ApiClient({
    baseUrl: 'https://api.example.test',
    fetchImpl,
  })

  await client.public.getRecommendations('selalu-kopi', {
    outletId: 'outlet-1',
    cartProductIds: ['prod-1', 'prod-2'],
  })
  await client.public.recordRecommendationEvent({
    storefront_slug: 'selalu-kopi',
    outlet_id: 'outlet-1',
    event_type: 'clicked',
    target_product_id: 'prod-3',
  })

  assert.equal(
    calls[0].url,
    'https://api.example.test/api/v1/public/storefronts/selalu-kopi/recommendations?outlet_id=outlet-1&placement=cart&product_ids=prod-1%2Cprod-2'
  )
  assert.equal(calls[0].options.method, 'GET')
  assert.equal(
    calls[1].url,
    'https://api.example.test/api/v1/public/recommendation-events'
  )
  assert.equal(calls[1].options.method, 'POST')
  assert.equal(JSON.parse(calls[1].options.body).event_type, 'clicked')
})

test('admin lifecycle actions use explicit endpoints and never generic PATCH status', async () => {
  const { calls, fetchImpl } = createRecordingFetch(
    phase5ApiFixtures.adminOrderActionResponse
  )
  const client = createPhase5ApiClient({
    baseUrl: 'https://api.example.test',
    fetchImpl,
  })

  await client.admin.listOrders({ outletId: 'outlet-smd-001', page: 1 })
  await client.admin.getOrder('order-test-001')
  await client.admin.acceptOrder('order-test-001')
  await client.admin.prepareOrder('order-test-001')
  await client.admin.readyOrder('order-test-001')
  await client.admin.completeOrder('order-test-001')
  await client.admin.cancelOrder('order-test-001', {
    reason: 'customer_requested',
  })

  assert.equal(
    calls[0].url,
    'https://api.example.test/api/v1/admin/orders?outletId=outlet-smd-001&page=1'
  )
  assert.equal(
    calls[1].url,
    'https://api.example.test/api/v1/admin/orders/order-test-001'
  )
  assert.deepEqual(
    calls.slice(2).map((call) => [call.options.method, call.url]),
    [
      [
        'POST',
        'https://api.example.test/api/v1/admin/orders/order-test-001/accept',
      ],
      [
        'POST',
        'https://api.example.test/api/v1/admin/orders/order-test-001/prepare',
      ],
      [
        'POST',
        'https://api.example.test/api/v1/admin/orders/order-test-001/ready',
      ],
      [
        'POST',
        'https://api.example.test/api/v1/admin/orders/order-test-001/complete',
      ],
      [
        'POST',
        'https://api.example.test/api/v1/admin/orders/order-test-001/cancel',
      ],
    ]
  )
  assert.equal(
    calls.some((call) => call.options.method === 'PATCH'),
    false
  )
  assert.equal(
    calls.some((call) => call.url.includes('/status')),
    false
  )
})

test('client refuses webhook and provider callback endpoints', async () => {
  const { fetchImpl } = createRecordingFetch({ ok: true })
  const client = createPhase5ApiClient({
    baseUrl: 'https://api.example.test',
    fetchImpl,
  })

  await assert.rejects(
    () => client.request('/api/payments/webhook', { method: 'POST', body: {} }),
    /Frontend cannot call webhook or provider callback endpoints/
  )
  await assert.rejects(
    () =>
      client.request('/api/provider/callback', { method: 'POST', body: {} }),
    /Frontend cannot call webhook or provider callback endpoints/
  )
})

test('backend error mapping covers Phase 5 required codes and runtime idempotency alias', () => {
  const requiredCodes = [
    'QR_EXPIRED',
    'QR_REVOKED',
    'QR_OUTLET_MISMATCH',
    'QR_LOCATION_MISMATCH',
    'PRODUCT_UNAVAILABLE',
    'MODIFIER_INVALID',
    'CHECKOUT_IDEMPOTENCY_REQUIRED',
    'IDEMPOTENCY_KEY_REQUIRED',
    'IDEMPOTENCY_CONFLICT',
    'PAYMENT_PROVIDER_ERROR',
    'ORDER_INVALID_TRANSITION',
    'ORDER_UNPAID',
    'FORBIDDEN',
    'RATE_LIMITED',
    'INTERNAL_ERROR',
  ]

  for (const code of requiredCodes) {
    assert.equal(typeof PHASE5_BACKEND_ERROR_MESSAGES[code], 'string', code)
    assert.equal(mapBackendError({ code }).code, code)
    assert.equal(
      getApiErrorMessage({ response: { data: { error: { code } } } }),
      PHASE5_BACKEND_ERROR_MESSAGES[code]
    )
  }
})

test('backend error mapping suppresses raw stack traces and raw provider payload text', () => {
  const stackMapped = mapBackendError({
    error: { message: 'Error: boom\n    at privateHandler (/srv/app.js:1:1)' },
  })
  const providerMapped = mapBackendError({
    error: { message: 'provider_payload={"secret":"raw"}' },
  })

  assert.equal(stackMapped.message, 'Request failed. Please try again later.')
  assert.equal(
    providerMapped.message,
    'Request failed. Please try again later.'
  )
  assert.equal(stackMapped.message.includes('/srv/app.js'), false)
  assert.equal(providerMapped.message.includes('raw'), false)
})

test('backend error mapping keeps request id and strips sensitive details', () => {
  const mapped = mapBackendError({
    error: {
      code: 'RATE_LIMITED',
      requestId: 'req-safe-001',
      details: {
        retryAfterSeconds: 30,
        providerPayload: { secret: 'hidden' },
        field: 'checkout',
      },
    },
  })

  assert.equal(mapped.message, PHASE5_BACKEND_ERROR_MESSAGES.RATE_LIMITED)
  assert.equal(mapped.requestId, 'req-safe-001')
  assert.equal(mapped.details.providerPayload, undefined)
  assert.equal(mapped.details.retryAfterSeconds, '30')
  assert.equal(mapped.details.field, 'checkout')
})

test('admin API sends auth and workspace headers without leaking public checkout idempotency to admin actions', async () => {
  const { calls, fetchImpl } = createRecordingFetch(
    phase5ApiFixtures.adminOrderActionResponse
  )
  const client = createPhase5ApiClient({
    baseUrl: 'https://api.example.test',
    fetchImpl,
    getAuthToken: () => 'admin-token-test',
    getWorkspaceId: () => 'workspace-test-001',
  })

  await client.admin.acceptOrder('order-test-001')

  assert.equal(
    calls[0].options.headers.Authorization,
    'Bearer admin-token-test'
  )
  assert.equal(calls[0].options.headers['x-workspace-id'], 'workspace-test-001')
  assert.equal(calls[0].options.headers['Idempotency-Key'], undefined)
})
