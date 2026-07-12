import { getApiBase } from '../../../shared/api/apiBase.js'
import { mapBackendError } from '../../../shared/api/apiError.js'

const PUBLIC_PREFIX = '/api/v1/public'
const ADMIN_ORDERS_PREFIX = '/api/v1/admin/orders'
const ADMIN_PAYMENTS_PREFIX = '/payments'
const WEBHOOK_PATH_PATTERN = /(?:^|\/)(?:webhooks?|provider\/callback|payments?\/callback)(?:\/|$)/i

export const FORBIDDEN_PHASE5_REQUEST_FIELDS = Object.freeze([
  'payment_status',
  'paymentStatus',
  'fulfillment_status',
  'fulfillmentStatus',
  'public_order_status',
  'publicOrderStatus',
  'final_total',
  'finalTotal',
  'total_amount',
  'totalAmount',
  'total',
  'totals',
  'allowed_actions',
  'allowedActions',
  'status',
])

function joinUrl(baseUrl, path) {
  return `${String(baseUrl || '').replace(/\/+$/, '')}/${String(path || '').replace(/^\/+/, '')}`
}

function encodePath(value, name) {
  if (!value) throw new Error(`${name} is required`)
  return encodeURIComponent(String(value))
}

function buildQuery(params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    query.set(key, String(value))
  }
  const text = query.toString()
  return text ? `?${text}` : ''
}

function assertNoWebhookPath(path) {
  if (WEBHOOK_PATH_PATTERN.test(String(path))) {
    throw new Error('Frontend cannot call webhook or provider callback endpoints')
  }
}

function assertNoForbiddenFields(payload, fields = FORBIDDEN_PHASE5_REQUEST_FIELDS, path = '') {
  if (!payload || typeof payload !== 'object') return
  if (Array.isArray(payload)) {
    payload.forEach((item, index) => assertNoForbiddenFields(item, fields, `${path}[${index}]`))
    return
  }
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      throw new Error(`Frontend cannot send backend-owned field: ${path}${field}`)
    }
  }
  for (const [key, value] of Object.entries(payload)) {
    assertNoForbiddenFields(value, fields, `${path}${key}.`)
  }
}

function normalizeHeaders(headers = {}) {
  return Object.fromEntries(Object.entries(headers).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

async function parseResponse(response) {
  const contentType = response.headers?.get?.('content-type') || ''
  if (contentType.includes('application/json')) return response.json()
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export function createPhase5ApiClient({
  baseUrl = getApiBase(),
  fetchImpl = globalThis.fetch,
  getAuthToken,
  getWorkspaceId,
  getRequestId,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required')

  async function request(path, { method = 'GET', headers, body, auth = 'public', requestId } = {}) {
    assertNoWebhookPath(path)
    const token = auth === 'admin' && typeof getAuthToken === 'function' ? getAuthToken() : null
    const workspaceId = auth === 'admin' && typeof getWorkspaceId === 'function' ? getWorkspaceId() : null
    const resolvedRequestId = requestId || (typeof getRequestId === 'function' ? getRequestId() : null)
    const requestHeaders = normalizeHeaders({
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
      ...(resolvedRequestId ? { 'X-Request-ID': resolvedRequestId } : {}),
      ...headers,
    })

    const response = await fetchImpl(joinUrl(baseUrl, path), {
      method,
      headers: requestHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
    const data = await parseResponse(response)
    if (!response.ok) {
      const mapped = mapBackendError({ status: response.status, data })
      const error = new Error(mapped.message)
      error.code = mapped.code
      error.status = mapped.status
      error.details = mapped.details
      throw error
    }
    return data
  }

  const publicApi = {
    getStorefront(storefrontSlug, params = {}) {
      return request(`${PUBLIC_PREFIX}/storefronts/${encodePath(storefrontSlug, 'storefrontSlug')}${buildQuery(params)}`)
    },
    getStorefrontBootstrap(storefrontSlug, params = {}) {
      return request(`${PUBLIC_PREFIX}/storefronts/${encodePath(storefrontSlug, 'storefrontSlug')}/bootstrap${buildQuery(params)}`)
    },
    getStoreMenu(storefrontSlug, params = {}) {
      return request(`${PUBLIC_PREFIX}/storefronts/${encodePath(storefrontSlug, 'storefrontSlug')}/menu${buildQuery(params)}`)
    },
    resolveQr(qrToken, params = {}) {
      return request(`${PUBLIC_PREFIX}/qr/${encodePath(qrToken, 'qrToken')}${buildQuery(params)}`)
    },
    validateCart(payload) {
      assertNoForbiddenFields(payload)
      return request(`${PUBLIC_PREFIX}/carts/validate`, { method: 'POST', body: payload })
    },
    checkout(payload, { idempotencyKey } = {}) {
      if (!idempotencyKey) throw new Error('Idempotency-Key is required for checkout')
      assertNoForbiddenFields(payload)
      return request(`${PUBLIC_PREFIX}/checkout`, {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: payload,
      })
    },
    getPaymentStatus(paymentId, publicOrderToken) {
      if (!publicOrderToken) throw new Error('publicOrderToken is required for payment status')
      return request(`${PUBLIC_PREFIX}/payments/${encodePath(paymentId, 'paymentId')}/status?publicOrderToken=${encodeURIComponent(publicOrderToken)}`)
    },
    getPublicOrder(publicOrderToken) {
      return request(`${PUBLIC_PREFIX}/orders/${encodePath(publicOrderToken, 'publicOrderToken')}`)
    },
    customerRegister(payload) {
      return request(`${PUBLIC_PREFIX}/customer/register`, { method: 'POST', body: payload })
    },
    customerLogin(payload) {
      return request(`${PUBLIC_PREFIX}/customer/login`, { method: 'POST', body: payload })
    },
    getCustomerOrders(token) {
      return request(`${PUBLIC_PREFIX}/customer/orders`, { headers: { Authorization: `Bearer ${token}` } })
    },
  }

  function adminOrderAction(orderId, action, body) {
    assertNoForbiddenFields(body, ['status', 'payment_status', 'paymentStatus', 'fulfillment_status', 'fulfillmentStatus', 'allowed_actions', 'allowedActions'])
    return request(`${ADMIN_ORDERS_PREFIX}/${encodePath(orderId, 'orderId')}/${action}`, {
      method: 'POST',
      auth: 'admin',
      ...(body !== undefined ? { body } : {}),
    })
  }

  const adminApi = {
    listOrders(params = {}) {
      return request(`${ADMIN_ORDERS_PREFIX}${buildQuery(params)}`, { auth: 'admin' })
    },
    getOrder(orderId) {
      return request(`${ADMIN_ORDERS_PREFIX}/${encodePath(orderId, 'orderId')}`, { auth: 'admin' })
    },
    acceptOrder(orderId, body) {
      return adminOrderAction(orderId, 'accept', body)
    },
    prepareOrder(orderId, body) {
      return adminOrderAction(orderId, 'prepare', body)
    },
    readyOrder(orderId, body) {
      return adminOrderAction(orderId, 'ready', body)
    },
    completeOrder(orderId, body) {
      return adminOrderAction(orderId, 'complete', body)
    },
    cancelOrder(orderId, body = {}) {
      if (!String(body.reason || '').trim()) throw new Error('Cancel reason is required')
      return adminOrderAction(orderId, 'cancel', body)
    },
    getPaymentGatewayConfig() {
      return request(`${ADMIN_PAYMENTS_PREFIX}/gateway/config`, { auth: 'admin' })
    },
  }

  return Object.freeze({ public: publicApi, admin: adminApi, request })
}

export const phase5ApiClient = createPhase5ApiClient()
