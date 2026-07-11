import { CART_QUANTITY } from '../types/cart.types.js'
import { calculateCartTotals, calculateItemPreviewTotal } from './calculateDisplayTotal.js'

const TERMINAL_PAYMENT_STATUSES = new Set(['paid', 'failed', 'expired', 'cancelled', 'canceled', 'manual_review'])
const SLOW_PAYMENT_POLLING_STATUSES = new Set(['rate_limited', 'throttled'])
const PUBLIC_ORDER_ALLOWED_KEYS = new Set([
  'publicOrderToken',
  'orderNumberPublic',
  'orderNumber',
  'order_number',
  'queueNumber',
  'queue_number',
  'publicOrderStatus',
  'public_order_status',
  'status',
  'paymentStatus',
  'payment_status',
  'fulfillmentStatus',
  'fulfillment_status',
  'customer',
  'customerNote',
  'outlet',
  'qrContext',
  'items',
  'totals',
  'amounts',
  'invoice',
  'createdAt',
  'updatedAt',
])

function arrayFrom(value) {
  return Array.isArray(value) ? value : []
}

function normalizeQuantity(quantity) {
  return Math.min(CART_QUANTITY.MAX, Math.max(CART_QUANTITY.MIN, Number(quantity || 1)))
}

export function createCartIntentItem({ productId, quantity = 1, selectedModifierOptionIds = [], modifiers = [], clientLineId } = {}) {
  if (!productId) throw new Error('productId is required')
  return {
    clientLineId: clientLineId || `line_${productId}_${Date.now()}`,
    productId,
    quantity: normalizeQuantity(quantity),
    selectedModifierOptionIds: arrayFrom(selectedModifierOptionIds).filter(Boolean),
    modifiers: arrayFrom(modifiers),
  }
}

function buildSelectedModifiers({ product, selectedModifierOptionIds = [] } = {}) {
  const optionIds = new Set(arrayFrom(selectedModifierOptionIds).map(String))
  return arrayFrom(product?.modifierGroups).flatMap((group) => {
    return arrayFrom(group.options)
      .filter((option) => optionIds.has(String(option.id)))
      .map((option) => ({
        modifier_group_id: group.id,
        option_id: option.id,
      }))
  })
}

export function createCartIntentContext({ storefrontSlug, outletId, qrSessionToken, includeOutlet = true } = {}) {
  const context = { storefrontSlug }
  if (includeOutlet && outletId) context.outletId = outletId
  if (qrSessionToken) context.qrSessionToken = qrSessionToken
  return context
}

export function buildCartValidationPayload({ context = {}, items = [], products = [] } = {}) {
  return {
    ...context,
    items: arrayFrom(items).map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId)
      const selectedModifierOptionIds = arrayFrom(item.selectedModifierOptionIds)
      const modifiers = arrayFrom(item.modifiers).length > 0 ? arrayFrom(item.modifiers) : buildSelectedModifiers({ product, selectedModifierOptionIds })
      return {
        clientLineId: item.clientLineId,
        productId: item.productId,
        quantity: item.quantity,
        selectedModifierOptionIds,
        modifiers,
      }
    }),
  }
}

export function buildCheckoutPayload({ context = {}, items = [], customer = {} } = {}) {
  return {
    ...context,
    customer: {
      name: String(customer.name || '').trim(),
      phone: String(customer.phone || '').trim(),
      ...(customer.note ? { note: String(customer.note).trim() } : {}),
    },
    items: buildCartValidationPayload({ items, products: context.products || [] }).items,
  }
}

export function createCartPreviewItem({ product, intentItem }) {
  const optionIds = arrayFrom(intentItem?.selectedModifierOptionIds)
  const quantity = normalizeQuantity(intentItem?.quantity)
  const unitPriceMinor = calculateItemPreviewTotal(product, optionIds, 1)
  return {
    ...intentItem,
    id: intentItem.clientLineId,
    productName: product?.name || 'Menu',
    imageUrl: product?.imageUrl || product?.image_url || product?.thumbnailUrl || product?.thumbnail_url || null,
    modifierSummary: arrayFrom(product?.modifierGroups)
      .flatMap((group) => arrayFrom(group.options))
      .filter((option) => optionIds.includes(option.id))
      .map((option) => option.name),
    unitPriceMinor,
    lineTotalMinor: unitPriceMinor * quantity,
    isLocalPreview: true,
  }
}

export function createCartPreview({ items = [], products = [], context = {} } = {}) {
  const previewItems = arrayFrom(items).map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId)
    return createCartPreviewItem({ product, intentItem: item })
  })
  return {
    id: `guest-cart-${context.storefrontSlug || 'default'}`,
    storefrontSlug: context.storefrontSlug,
    outletId: context.outletId,
    qrSessionToken: context.qrSessionToken,
    items: previewItems,
    totals: calculateCartTotals(previewItems),
    totalsAuthority: 'local_preview_only',
  }
}

export function normalizeValidatedCart(response = {}) {
  const cart = response.cart || response.validatedCart || response
  return {
    valid: response.valid !== false,
    items: arrayFrom(cart.items).map((item) => ({
      clientLineId: item.clientLineId,
      productId: item.productId,
      productName: item.productName || item.name,
      imageUrl: item.imageUrl || item.image_url || item.thumbnailUrl || item.thumbnail_url || null,
      quantity: item.quantity,
      selectedModifierOptionIds: arrayFrom(item.selectedModifierOptionIds),
      modifierSummary: arrayFrom(item.modifierSummary),
      unitPriceMinor: item.unitPriceMinor,
      lineTotalMinor: item.lineTotalMinor,
    })),
    totals: cart.totals || response.totals || {},
    validationErrors: arrayFrom(response.validationErrors || response.errors),
    totalsAuthority: 'backend_validated',
  }
}

export function createCheckoutAttempt({ existingAttempt, generator = defaultIdempotencyKey } = {}) {
  return existingAttempt?.idempotencyKey ? existingAttempt : { idempotencyKey: generator(), status: 'active' }
}

export function resetCheckoutAttempt(generator = defaultIdempotencyKey) {
  return { idempotencyKey: generator(), status: 'active' }
}

export function canStartCheckoutMutation({ submitting = false, hasItems = false, hasValidatedCart = false } = {}) {
  return submitting !== true && hasItems === true && hasValidatedCart === true
}

export function defaultIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `checkout_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function shouldStopPaymentPolling(status) {
  return TERMINAL_PAYMENT_STATUSES.has(String(status || '').toLowerCase())
}

export function shouldSlowPaymentPolling(status) {
  return SLOW_PAYMENT_POLLING_STATUSES.has(String(status || '').toLowerCase())
}

export function getNextPaymentPollingDelay(status, { intervalMs = 5000, rateLimitedIntervalMs = 30000 } = {}) {
  if (shouldStopPaymentPolling(status)) return null
  return shouldSlowPaymentPolling(status) ? rateLimitedIntervalMs : intervalMs
}

export function normalizePaymentStatus(response = {}) {
  const payment = response.payment || response
  const order = response.order || {}
  const status = payment.paymentStatus || payment.status || response.paymentStatus || response.status || response.state || 'pending'
  return {
    paymentId: payment.paymentId || payment.id || response.paymentId || response.id,
    status,
    paymentStatus: status,
    paymentUrl: payment.paymentUrl || payment.payment_url || response.paymentUrl || response.redirectUrl || null,
    publicOrderToken: order.public_order_token || response.publicOrderToken || null,
    publicOrderStatus: order.public_order_status || response.publicOrderStatus || null,
    expiresAt: payment.expiresAt || payment.expires_at || response.expiresAt || null,
    totals: response.totals || { totalMinor: payment.amount || order.total_amount || 0 },
    isTerminal: shouldStopPaymentPolling(status),
    isRateLimited: shouldSlowPaymentPolling(status),
  }
}

export function getPaymentStatusLabel(status) {
  const normalized = String(status || 'pending').toLowerCase()
  if (normalized === 'paid') return 'Dibayar'
  if (normalized === 'failed') return 'Pembayaran gagal'
  if (normalized === 'expired') return 'Pembayaran kedaluwarsa'
  if (normalized === 'manual_review') return 'Menunggu review manual'
  if (normalized === 'cancelled' || normalized === 'canceled') return 'Dibatalkan'
  if (normalized === 'rate_limited' || normalized === 'throttled') return 'Terlalu banyak pengecekan'
  return 'Menunggu pembayaran'
}

export function toTimelineStatus(publicOrderStatus) {
  const normalized = String(publicOrderStatus || '').toLowerCase()
  if (normalized === 'payment_pending') return 'PAYMENT_PENDING'
  if (normalized === 'payment_expired' || normalized === 'expired') return 'PAYMENT_EXPIRED'
  if (normalized === 'cancelled' || normalized === 'canceled') return 'CANCELLED'
  if (normalized === 'ready_for_pickup' || normalized === 'ready') return 'READY_FOR_PICKUP'
  if (normalized === 'awaiting_outlet_approval') return 'AWAITING_OUTLET_APPROVAL'
  if (normalized === 'paid') return 'PAID'
  if (normalized === 'preparing') return 'PREPARING'
  if (normalized === 'completed') return 'COMPLETED'
  return 'PAYMENT_PENDING'
}

function isSafePublicUrl(value) {
  if (!value || typeof value !== 'string') return false
  if (value.startsWith('/')) return true
  try {
    const url = new URL(value)
    return typeof window !== 'undefined' && url.origin === window.location.origin
  } catch {
    return false
  }
}

function sanitizeInvoice(invoice) {
  if (!invoice) return null
  return {
    downloadUrl: isSafePublicUrl(invoice.downloadUrl) ? invoice.downloadUrl : null,
    shareUrl: isSafePublicUrl(invoice.shareUrl) ? invoice.shareUrl : null,
  }
}

export function sanitizePublicOrder(response = {}) {
  const source = response.order || response
  const safe = {}
  for (const [key, value] of Object.entries(source)) {
    if (PUBLIC_ORDER_ALLOWED_KEYS.has(key)) safe[key] = value
  }

  const publicOrderStatus = safe.publicOrderStatus || safe.public_order_status || safe.status || 'payment_pending'
  const customer = safe.customer || {}
  const amounts = safe.amounts || {}
  const totals = safe.totals || {
    subtotalMinor: amounts.subtotal_amount || 0,
    discountMinor: amounts.discount_amount || 0,
    serviceFeeMinor: amounts.service_fee_amount || 0,
    taxMinor: amounts.tax_amount || 0,
    totalMinor: amounts.total_amount || 0,
  }
  const items = arrayFrom(safe.items).map((item) => ({
    ...item,
    productName: item.productName || item.name || item.product_name || '',
    imageUrl: item.imageUrl || item.image_url || item.thumbnailUrl || item.thumbnail_url || null,
    quantity: item.quantity || 1,
    modifierSummary: item.modifierSummary || item.modifiers || [],
    lineTotalMinor: item.lineTotalMinor ?? item.line_total ?? item.subtotal ?? 0,
  }))
  return {
    publicOrderToken: safe.publicOrderToken,
    orderNumberPublic: safe.orderNumberPublic || safe.orderNumber || safe.order_number,
    queueNumber: safe.queueNumber || safe.queue_number,
    publicOrderStatus,
    status: publicOrderStatus,
    paymentStatus: safe.paymentStatus || safe.payment_status || 'pending',
    fulfillmentStatus: safe.fulfillmentStatus || safe.fulfillment_status || publicOrderStatus,
    customer: {
      name: customer.name || 'Tamu',
      phoneMasked: customer.phoneMasked || customer.maskedPhone || '',
    },
    customerNote: safe.customerNote || safe.customer_note || '',
    outlet: safe.outlet || null,
    qrContext: safe.qrContext || null,
    items,
    totals,
    invoice: sanitizeInvoice(safe.invoice),
    createdAt: safe.createdAt,
    updatedAt: safe.updatedAt,
  }
}
