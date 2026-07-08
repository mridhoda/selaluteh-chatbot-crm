const ACTION_LABELS = Object.freeze({
  accept_order: 'Accept Order',
  mark_preparing: 'Mark Preparing',
  mark_ready: 'Mark Ready',
  mark_completed: 'Complete Order',
  cancel_order: 'Cancel Order',
})

const ACTION_METHODS = Object.freeze({
  accept_order: 'acceptOrder',
  mark_preparing: 'prepareOrder',
  mark_ready: 'readyOrder',
  mark_completed: 'completeOrder',
  cancel_order: 'cancelOrder',
})

const SECRET_OR_RAW_KEYS = /secret|api[_-]?key|token|signature|provider_payload|providerPayload|raw_provider|rawProvider|webhook|admin[_-]?notes?|adminNotes?|admin[_-]?user|adminUser/i

function stripSensitive(value) {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(stripSensitive)

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SECRET_OR_RAW_KEYS.test(key))
      .map(([key, item]) => [key, stripSensitive(item)]),
  )
}

function readListPayload(payload) {
  if (Array.isArray(payload)) return { orders: payload, pagination: null }
  if (Array.isArray(payload?.data)) return { orders: payload.data, pagination: payload.pagination || null }
  if (Array.isArray(payload?.orders)) return { orders: payload.orders, pagination: payload.pagination || null }
  return { orders: [], pagination: payload?.pagination || null }
}

function readDetailPayload(payload) {
  return payload?.order || payload?.data || payload || null
}

function normalizeStatus(value) {
  return value == null || value === '' ? '-' : String(value)
}

export function normalizeAdminOrder(rawOrder = {}) {
  const order = stripSensitive(rawOrder) || {}
  const id = order.id || order._id || order.order_id || order.orderId || ''
  const outlet = order.outlet && typeof order.outlet === 'object'
    ? order.outlet
    : { id: order.outlet_id || order.outletId || null, name: order.outlet || order.outletName || order.outlet_name || null }
  const customer = order.customer && typeof order.customer === 'object'
    ? order.customer
    : {
        name: order.customer_name || order.customerName || order.customerNameSnapshot || null,
        phone: order.customer_phone || order.customerPhone || order.customerPhoneSnapshot || null,
      }
  const qrContext = order.qr_context || order.qrContext || {}
  const allowedActions = Array.isArray(order.allowed_actions)
    ? order.allowed_actions
    : Array.isArray(order.allowedActions)
      ? order.allowedActions
      : []

  return {
    id,
    orderNumber: order.order_number || order.orderNumber || id,
    channel: normalizeStatus(order.channel || order.channelSnapshot || order.source || 'unknown'),
    outlet: {
      id: outlet.id || outlet.outletId || outlet.outlet_id || null,
      name: outlet.name || outlet.label || outlet.code || '-',
      address: outlet.address || null,
    },
    qrContext: {
      qrSessionId: qrContext.qr_session_id || qrContext.qrSessionId || null,
      locationLabel: qrContext.location_label || qrContext.locationLabel || qrContext.table_label || null,
      tableId: qrContext.table_id || qrContext.tableId || null,
    },
    customer: {
      name: customer.name || customer.contactName || '-',
      phone: customer.phone || customer.phoneMasked || null,
    },
    paymentStatus: normalizeStatus(order.payment_status || order.paymentStatus),
    fulfillmentStatus: normalizeStatus(order.fulfillment_status || order.fulfillmentStatus || order.status),
    publicOrderStatus: normalizeStatus(order.public_order_status || order.publicOrderStatus),
    fulfillmentType: normalizeStatus(order.fulfillment_type || order.fulfillmentType || 'pickup'),
    totalAmount: Number(order.total_amount ?? order.totalAmount ?? order.total ?? order.totals?.total ?? 0),
    currency: order.currency || order.totals?.currency || 'IDR',
    items: Array.isArray(order.items) ? order.items.map(stripSensitive) : [],
    customerNote: order.customer_note || order.customerNote || null,
    statusHistory: Array.isArray(order.status_history)
      ? order.status_history.map(stripSensitive)
      : Array.isArray(order.statusHistory)
        ? order.statusHistory.map(stripSensitive)
        : [],
    allowedActions: allowedActions.filter((action) => Object.hasOwn(ACTION_LABELS, action)),
    createdAt: order.created_at || order.createdAt || null,
    updatedAt: order.updated_at || order.updatedAt || null,
  }
}

export function normalizeAdminOrderList(payload) {
  const { orders, pagination } = readListPayload(payload)
  return {
    orders: orders.map(normalizeAdminOrder),
    pagination,
  }
}

export function normalizeAdminOrderDetail(payload) {
  const order = readDetailPayload(payload)
  return order ? normalizeAdminOrder(order) : null
}

export function getRenderableAdminActions(order) {
  return (order?.allowedActions || []).map((action) => ({
    action,
    label: ACTION_LABELS[action],
    method: ACTION_METHODS[action],
    destructive: action === 'cancel_order',
  }))
}

export function getActionMethod(action) {
  return ACTION_METHODS[action] || null
}

export function validateAdminAction({ action, reason, inFlightAction }) {
  if (inFlightAction) return { ok: false, message: 'Another order action is already in progress.' }
  if (!getActionMethod(action)) return { ok: false, message: 'Action is not available for this order.' }
  if (action === 'cancel_order' && !String(reason || '').trim()) {
    return { ok: false, message: 'Cancel reason is required.' }
  }
  return { ok: true, message: null }
}

export function mapAdminOrderError(error) {
  const code = error?.code || error?.response?.data?.error?.code
  if (code === 'ORDER_INVALID_TRANSITION') return 'This order cannot move to the requested status.'
  if (code === 'ORDER_UNPAID') return 'This order is not paid yet.'
  if (code === 'FORBIDDEN') return 'You are not allowed to perform this action.'
  return error?.message || error?.response?.data?.error?.message || 'Order request failed.'
}

export const adminOrderModelInternals = Object.freeze({
  ACTION_LABELS,
  ACTION_METHODS,
  stripSensitive,
})
