const ACTION_LABELS = Object.freeze({
  mark_ready: 'Mark as Ready',
  ready: 'Mark as Ready',
  mark_completed: 'Completed',
  complete: 'Completed',
  cancel_order: 'Cancel Order',
  cancel: 'Cancel Order',
})

const ACTION_METHODS = Object.freeze({
  mark_ready: 'readyOrder',
  ready: 'readyOrder',
  mark_completed: 'completeOrder',
  complete: 'completeOrder',
  cancel_order: 'cancelOrder',
  cancel: 'cancelOrder',
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

function formatRupiah(value, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, minimumFractionDigits: 0 }).format(Number(value || 0))
}

function normalizeStatus(value) {
  return value == null || value === '' ? '-' : String(value)
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function phoneLikeIdentifier(value) {
  const normalized = String(value || '').replace(/[^\d]/g, '')
  return /^(?:62|0)\d{8,15}$/.test(normalized) ? normalized : null
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function normalizePaymentStatus(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized || normalized === '-') return 'Unpaid'
  if (['paid', 'lunas', 'settled', 'success', 'succeeded', 'completed'].includes(normalized)) return 'Paid'
  if (['pending', 'waiting', 'awaiting_payment', 'payment_pending', 'unpaid_pending'].includes(normalized)) return 'Pending'
  if (['unpaid', 'not_paid', 'failed', 'expired', 'cancelled', 'canceled'].includes(normalized)) return 'Unpaid'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).replaceAll('_', ' ')
}

function normalizeChannel(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized || normalized === '-') return 'manual'
  if (['whatsapp', 'wa'].includes(normalized)) return 'whatsapp'
  if (normalized === 'telegram') return 'telegram'
  if (['instagram', 'facebook'].includes(normalized)) return normalized
  if (['qr_store', 'qr', 'location_qr', 'location-qr', 'table_qr', 'table-qr'].includes(normalized)) return 'qr_store'
  if (['website', 'web', 'online', 'online_store', 'public_store', 'storefront'].includes(normalized)) return 'website'
  if (['manual', 'pos', 'offline', 'admin'].includes(normalized)) return 'manual'
  return normalized
}

function isQrChannel(channel) {
  return ['qr_store', 'qr', 'location_qr', 'location-qr', 'table_qr', 'table-qr'].includes(String(channel || '').trim().toLowerCase())
}

function isOnlineStoreChannel(channel) {
  return ['website', 'web', 'online', 'online_store', 'public_store', 'storefront'].includes(String(channel || '').trim().toLowerCase())
}

function resolveQrTypeLabel(...values) {
  const raw = firstValue(...values)
  const normalized = String(raw || '').trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_')
  if (['universal', 'universal_qr', 'global', 'any_outlet'].includes(normalized)) return 'Universal QR'
  if (['outlet', 'outlet_qr', 'store', 'store_qr'].includes(normalized)) return 'Outlet QR'
  if (['location', 'location_qr', 'table', 'table_qr'].includes(normalized)) return 'Location QR'
  return null
}

function isUniversalQrLabel(value) {
  return String(value || '').trim().toLowerCase() === 'universal qr'
}

function normalizeLegacyOrderStatus(...values) {
  const raw = firstValue(...values)
  const normalized = String(raw || '').trim().toLowerCase()
  const statusMap = {
    new: 'new',
    created: 'new',
    pending: 'new',
    pending_payment: 'new',
    payment_pending: 'new',
    awaiting_payment: 'new',
    awaiting_acceptance: 'new',
    accepted: 'processed',
    accept: 'processed',
    processed: 'processed',
    confirmed: 'processed',
    in_progress: 'preparing',
    preparing: 'preparing',
    prepare: 'preparing',
    ready: 'ready',
    ready_for_pickup: 'ready',
    ready_for_delivery: 'ready',
    completed: 'completed',
    complete: 'completed',
    fulfilled: 'completed',
    delivered: 'completed',
    picked_up: 'completed',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    voided: 'cancelled',
  }
  return statusMap[normalized] || (normalized || 'new')
}

function readCustomer(order) {
  const customer = order.customer && typeof order.customer === 'object' ? order.customer : {}
  const snapshotValue = order.customer_snapshot || order.customerSnapshot || {}
  const snapshot = snapshotValue && typeof snapshotValue === 'object' ? snapshotValue : {}
  const customerSnapshot = order.customerSnapshot && typeof order.customerSnapshot === 'object' ? order.customerSnapshot : {}
  const contact = order.contactId && typeof order.contactId === 'object'
    ? order.contactId
    : order.contact && typeof order.contact === 'object'
      ? order.contact
      : {}
  const contactSnapshot = order.contact_snapshot && typeof order.contact_snapshot === 'object'
    ? order.contact_snapshot
    : order.contactSnapshot && typeof order.contactSnapshot === 'object'
      ? order.contactSnapshot
      : {}

  const readPhone = (value) => value && typeof value === 'object'
    ? firstValue(
        value.phone,
        value.phoneNumber,
        value.phone_number,
        value.phoneMasked,
        value.phone_masked,
        value.maskedPhone,
        value.masked_phone,
        value.customerPhone,
        value.customer_phone,
        value.customerPhoneSnapshot,
        value.customer_phone_snapshot,
        value.customerPhoneMasked,
        value.customer_phone_masked,
        value.customerPhoneMaskedSnapshot,
        value.customer_phone_masked_snapshot,
        value.msisdn,
        value.mobile,
        value.mobileNumber,
        value.mobile_number,
        value.whatsapp,
        value.whatsappNumber,
        value.whatsapp_number,
        value.waNumber,
        value.wa_number,
      )
    : null

  const snapshotPhone = firstValue(
    readPhone(customer),
    readPhone(snapshot),
    readPhone(customerSnapshot),
    order.customer_phone,
    order.customerPhone,
    order.customer_phone_snapshot,
    order.customerPhoneSnapshot,
    order.customer_phone_masked,
    order.customerPhoneMasked,
    order.customer_phone_masked_snapshot,
    order.customerPhoneMaskedSnapshot,
    order.phone,
    order.phone_number,
    order.phoneNumber,
    order.phone_masked,
    order.phoneMasked,
  )
  const contactPhone = firstValue(
    readPhone(contact),
    readPhone(contactSnapshot),
    order.contact_phone,
    order.contactPhone,
    order.contact_phone_number,
    order.contactPhoneNumber,
  )
  const contactExternalId = firstValue(
    contact.externalId,
    contact.external_id,
    contact.providerUserId,
    contact.provider_user_id,
    contactSnapshot.externalId,
    contactSnapshot.external_id,
    order.contact_external_id,
    order.contactExternalId,
    order.external_id,
    order.externalId,
  )

  return {
    id: firstValue(contact.id, contact._id, order.contact_id, order.contactId),
    name: firstValue(
      customer.name,
      customer.fullName,
      customer.full_name,
      snapshot.name,
      snapshot.customerName,
      contact.name,
      contact.displayName,
      order.customer_name,
      order.customerName,
      order.customerNameSnapshot,
    ),
    phone: firstValue(
      snapshotPhone,
      contactPhone,
      order.whatsapp,
      order.whatsapp_number,
      order.whatsappNumber,
      phoneLikeIdentifier(contactExternalId),
    ),
    snapshotPhone,
    handle: firstValue(
      customer.username,
      customer.handle,
      snapshot.username,
      snapshot.handle,
      customerSnapshot.username,
      customerSnapshot.handle,
      contact.username,
      contact.handle,
      contact.displayHandle,
      contact.display_handle,
      contactSnapshot.username,
      contactSnapshot.handle,
      order.customer_username,
      order.customerUsername,
      order.contact_username,
      order.contactUsername,
      order.contact_handle,
      order.contactHandle,
    ),
    telegramId: firstValue(
      customer.telegramId,
      customer.telegram_id,
      snapshot.telegramId,
      snapshot.telegram_id,
      customerSnapshot.telegramId,
      customerSnapshot.telegram_id,
      contact.telegramId,
      contact.telegram_id,
      contact.telegramUserId,
      contact.telegram_user_id,
      contactSnapshot.telegramId,
      contactSnapshot.telegram_id,
      order.telegram_id,
      order.telegramId,
      order.contact_telegram_id,
      order.contactTelegramId,
    ),
    externalId: firstValue(
      contact.externalId,
      contact.external_id,
      contact.providerUserId,
      contact.provider_user_id,
      contactSnapshot.externalId,
      contactSnapshot.external_id,
      order.contact_external_id,
      order.contactExternalId,
      order.external_id,
      order.externalId,
    ),
  }
}

function resolveCustomerIdentifier(customer, channel) {
  if (channel === 'whatsapp') {
    return firstValue(customer.phone, customer.handle, customer.externalId, '-')
  }
  if (channel === 'telegram') {
    return firstValue(customer.handle, customer.telegramId, customer.externalId, customer.id, '-')
  }
  if (isQrChannel(channel) || isOnlineStoreChannel(channel)) {
    return firstValue(customer.snapshotPhone, customer.phone, '-')
  }
  return firstValue(customer.phone, customer.handle, customer.externalId, customer.id, '-')
}

function readQrContext(order) {
  const snakeContext = order.qr_context && typeof order.qr_context === 'object' ? order.qr_context : {}
  const camelContext = order.qrContext && typeof order.qrContext === 'object' ? order.qrContext : {}
  const context = { ...camelContext, ...snakeContext }
  const location = firstValue(context.location, context.qrLocation, context.qr_location, order.location, order.qrLocation, order.qr_location)
  const locationObject = location && typeof location === 'object' ? location : {}
  const table = firstValue(context.table, context.qrTable, context.qr_table, order.table, order.qrTable, order.qr_table)
  const tableObject = table && typeof table === 'object' ? table : {}

  const readLabel = (value) => value && typeof value === 'object'
    ? firstValue(
        value.label,
        value.name,
        value.displayName,
        value.display_name,
        value.title,
        value.code,
        value.tableLabel,
        value.table_label,
        value.tableName,
        value.table_name,
        value.locationLabel,
        value.location_label,
        value.locationName,
        value.location_name,
      )
    : null

  const locationLabel = firstValue(
    context.location_label,
    context.locationLabel,
    context.location_name,
    context.locationName,
    context.qr_location_label,
    context.qrLocationLabel,
    readLabel(locationObject),
    order.location_label,
    order.locationLabel,
    order.location_name,
    order.locationName,
    order.qr_location_label,
    order.qrLocationLabel,
    readLabel(order.location),
    readLabel(order.qrLocation),
    readLabel(order.qr_location),
  )
  const tableLabel = firstValue(
    context.table_label,
    context.tableLabel,
    context.table_name,
    context.tableName,
    context.qr_table_label,
    context.qrTableLabel,
    readLabel(tableObject),
    order.table_label,
    order.tableLabel,
    order.table_name,
    order.tableName,
    order.qr_table_label,
    order.qrTableLabel,
    readLabel(order.table),
    readLabel(order.qrTable),
    readLabel(order.qr_table),
  )
  const tableId = firstValue(
    context.table_id,
    context.tableId,
    context.qrLocationId,
    context.qr_location_id,
    tableObject.id,
    tableObject._id,
    locationObject.table_id,
    locationObject.tableId,
  )
  const qrTypeLabel = resolveQrTypeLabel(
    context.qr_scope,
    context.qrScope,
    context.scope,
    context.qr_type,
    context.qrType,
    context.type,
    order.qr_scope,
    order.qrScope,
    order.qr_type,
    order.qrType,
    order.metadata?.qrScope,
    order.metadata?.qr_scope,
    order.metadata?.qrType,
    order.metadata?.qr_type,
    order.channel_snapshot,
    order.channelSnapshot,
  ) || (tableLabel || locationLabel || tableId ? 'Location QR' : null)

  return {
    qrSessionId: context.qr_session_id || context.qrSessionId || null,
    locationLabel,
    tableId,
    tableLabel: tableLabel || locationLabel || null,
    typeLabel: qrTypeLabel,
  }
}

function readOutlet(order) {
  const outlet = order.outlet && typeof order.outlet === 'object' ? order.outlet : {}
  const snapshot = order.outlet_snapshot || order.outletSnapshot || {}
  const id = firstValue(outlet.id, outlet._id, snapshot.id, snapshot._id, order.outlet_id, order.outletId)
  const name = firstValue(outlet.name, outlet.label, outlet.code, snapshot.name, snapshot.label, order.outlet_name, order.outletName, typeof order.outlet === 'string' ? order.outlet : null)
  return { id, name }
}

function normalizeCreatedAt(order) {
  const value = firstValue(
    order.created_at,
    order.createdAt,
    order.order_created_at,
    order.orderCreatedAt,
    order.placed_at,
    order.placedAt,
    order.inserted_at,
    order.timestamp,
    order.date,
    order.updated_at,
    order.updatedAt,
  )
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : value
}

function formatTimelineTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatTimelineLabel(event = {}) {
  const raw = String(firstValue(event.label, event.status, event.event_type, event.eventType, '') || '').trim()
  const normalized = raw.toLowerCase()
  if (normalized === 'preparing_auto') return 'Preparing automatically by system'
  if (normalized === 'payment_verified' || normalized === 'payment verified') return 'Payment verified'
  return raw || 'Status update'
}

function readItemSnapshot(item) {
  return item.item_snapshot || item.itemSnapshot || item.product_snapshot || item.productSnapshot || item.snapshot || {}
}

function readRawItems(order) {
  const candidates = [order.items, order.line_items, order.lineItems, order.order_items, order.orderItems]
  const arrayItems = candidates.find(Array.isArray)
  if (arrayItems) return arrayItems
  const snapshot = order.item_snapshot || order.itemSnapshot || order.items_snapshot || order.itemsSnapshot
  if (Array.isArray(snapshot)) return snapshot
  if (snapshot && typeof snapshot === 'object') return Object.values(snapshot)
  return []
}

function normalizeItems(order) {
  return readRawItems(order).map((item) => {
    const sItem = stripSensitive(item) || {}
    const snapshot = readItemSnapshot(sItem)
    const modifiers = firstValue(sItem.metadata?.modifiers, sItem.modifiers, sItem.selectedModifiers, sItem.selected_modifier_options, snapshot.modifiers)
    const variant = Array.isArray(modifiers)
      ? modifiers.map((modifier) => modifier.option_name || modifier.optionName || modifier.value || modifier.name || modifier.label).filter(Boolean).join(', ')
      : firstValue(sItem.variant, sItem.variantName, sItem.variant_name, snapshot.variant, sItem.notes, '')

    const quantity = toNumber(firstValue(sItem.quantity, sItem.qty, sItem.count), 1)
    const snapshotUnitPrice = toNumber(firstValue(sItem.unitPrice, sItem.unit_price, sItem.unitPriceMinor, sItem.unit_price_minor, sItem.price, sItem.priceMinor, sItem.price_minor, snapshot.price), 0)
    const lineTotal = toNumber(firstValue(sItem.lineTotal, sItem.line_total, sItem.lineTotalMinor, sItem.line_total_minor, sItem.subtotal, sItem.total, snapshotUnitPrice * quantity), 0)
    const unitPrice = snapshotUnitPrice || (quantity > 0 ? lineTotal / quantity : 0)

    return {
      ...sItem,
      name: firstValue(sItem.name, sItem.productName, sItem.product_name, sItem.productNameSnapshot, sItem.product_name_snapshot, sItem.menuItemName, snapshot.name, snapshot.productName, 'Item'),
      quantity,
      unitPrice,
      lineTotal,
      imageUrl: firstValue(sItem.imageUrl, sItem.image_url, sItem.thumbnailUrl, sItem.thumbnail_url, snapshot.imageUrl, snapshot.image_url, snapshot.thumbnailUrl, snapshot.thumbnail_url, sItem.metadata?.imageUrl, sItem.metadata?.image_url, null),
      variant,
    }
  })
}

export function normalizeAdminOrder(rawOrder = {}) {
  const order = stripSensitive(rawOrder) || {}
  const id = firstValue(order._id, order.id, order.order_id, order.orderId, order.order_number, order.orderNumber, '')
  const orderNumber = firstValue(order.order_number, order.orderNumber, order.orderNo, order.number, id)
  const orderIdDisplay = firstValue(order.orderIdDisplay, order.order_id_display, orderNumber, id)
  const outlet = readOutlet(order)
  const customer = readCustomer(order)
  const qrContext = readQrContext(order)
  const allowedActions = Array.isArray(order.allowed_actions)
    ? order.allowed_actions
    : Array.isArray(order.allowedActions)
      ? order.allowedActions
      : []

  const totalAmount = toNumber(firstValue(
    order.total_amount,
    order.totalAmount,
    order.total,
    order.grand_total,
    order.grandTotal,
    order.amount_total,
    order.amountTotal,
    order.totals?.total,
    order.totals?.totalMinor,
    order.total_minor,
    order.totalMinor,
  ), 0)
  const currency = order.currency || order.totals?.currency || 'IDR'
  const totalDisplay = order.total_display || order.totalDisplay || formatRupiah(totalAmount, currency)

  const items = normalizeItems(order)

  const itemsList = items.map(item => ({
    name: item.name,
    qty: item.quantity,
    variant: item.metadata?.variant || item.variant || '',
    price: item.unitPrice,
    imageUrl: item.imageUrl,
  }))

  const itemQuantityCount = items.reduce((sum, item) => sum + toNumber(item.quantity, 0), 0)
  const itemsCountNumber = toNumber(firstValue(order.items_count, order.itemsCount, order.item_count, order.itemCount, itemQuantityCount || items.length), 0)
  const itemsCount = `${itemsCountNumber} item${itemsCountNumber === 1 ? '' : 's'}`

  const timeline = Array.isArray(order.timeline)
    ? order.timeline.map(stripSensitive)
    : Array.isArray(order.status_history)
      ? order.status_history.map(h => ({
          time: formatTimelineTime(h.at || h.created_at || h.createdAt) || '-',
          label: formatTimelineLabel(h)
        }))
      : []

  const rawPaymentStatus = firstValue(order.payment_status, order.paymentStatus, order.payment?.status, order.payment_summary?.status, order.paymentSummary?.status)
  const rawOrderStatus = firstValue(order.order_status, order.orderStatus, order.status)
  const rawFulfillmentStatus = firstValue(order.fulfillment_status, order.fulfillmentStatus)
  const rawPublicOrderStatus = firstValue(order.public_order_status, order.publicOrderStatus)
  const paymentStatus = normalizePaymentStatus(rawPaymentStatus)
  const orderStatus = normalizeStatus(rawOrderStatus)
  const fulfillmentStatus = normalizeStatus(firstValue(rawFulfillmentStatus, rawOrderStatus))
  const publicOrderStatus = normalizeStatus(rawPublicOrderStatus)
  const legacyStatus = normalizeLegacyOrderStatus(rawFulfillmentStatus, rawPublicOrderStatus, rawOrderStatus)

  const paymentSummary = stripSensitive(order.payment_summary || order.paymentSummary || null)
  const receiptPrinting = stripSensitive(order.receipt_printing || order.receiptPrinting || null)

  const outletId = outlet.id || null
  const outletName = outlet.name || '-'
  const customerName = customer.name || '-'
  const customerPhone = customer.phone || null

  const locationLabel = qrContext.locationLabel || null
  const tableId = qrContext.tableId || null
  const tableLabel = qrContext.tableLabel
  const qrLabel = qrContext.typeLabel
    ? (tableLabel && !isUniversalQrLabel(qrContext.typeLabel) ? `${qrContext.typeLabel} · ${tableLabel}` : qrContext.typeLabel)
    : null

  const customerNote = String(order.customer_note || order.customerNote || '').trim() || null
  const createdAt = normalizeCreatedAt(order)
  const rawChannel = firstValue(order.channel, order.channelSnapshot, order.source, order.order_source, order.orderSource)
  const channel = normalizeChannel(rawChannel)
  const customerIdentifier = resolveCustomerIdentifier(customer, channel)

  return {
    id,
    orderNumber,
    orderIdDisplay,
    customerName,
    customerPhone,
    customerIdentifier,
    outletName,
    outletId,
    channel,
    channelSnapshot: rawChannel || channel,
    itemsCount,
    totalDisplay,
    paymentStatus,
    orderStatus,
    fulfillmentStatus,
    publicOrderStatus,
    paymentStatusRaw: rawPaymentStatus || null,
    qrContext: {
      qrSessionId: qrContext.qrSessionId,
      locationLabel,
      tableId,
    },
    tableLabel,
    qrLabel,
    createdAt,
    allowedActions: allowedActions.filter((action) => Object.hasOwn(ACTION_LABELS, action)),
    items,
    paymentSummary,
    receiptPrinting,
    timeline,
    customerNote,

    // Backward compatibility for legacy UI
    _id: id,
    status: legacyStatus,
    contactId: {
      id: customer.id || null,
      name: customerName,
      phone: customerPhone,
    },
    customerNameSnapshot: customerName,
    customerPhoneSnapshot: customerPhone,
    chatId: order.chatId || null,
    outlet: outletName,
    itemsList,
    total: totalAmount,
    paymentMethod: order.paymentMethod || order.payment_method || null,
    paymentProofUrl: order.paymentProofUrl || order.payment_proof_url || null,
    notes: customerNote || '',
    updatedAt: order.updated_at || order.updatedAt || null,
    fulfillmentType: normalizeStatus(order.fulfillment_type || order.fulfillmentType || 'pickup'),
    currency,
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
  if ((action === 'cancel_order' || action === 'cancel') && String(reason || '').trim().length < 5) {
    return { ok: false, message: 'Cancel reason must be at least 5 characters.' }
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
