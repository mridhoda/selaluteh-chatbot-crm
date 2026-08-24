import { randomBytes } from 'node:crypto';
import { chatsRepository, messagesRepository, ordersRepository, contactsRepository, outletsRepository } from '../db/repositories/index.js';
import { tgSend, waSend, igSend } from './sender.js';
import { buildOutletScopedQuery, assertOutletAccess, canAccessAllOutlets } from './access-control.service.js';
import { AppError } from '../utils/errors.js';
import { sendOrderCreatedPush, sendOrderPaidPush } from './web-push.service.js';
import { broadcastToWorkspace, broadcastToPublicOrder } from './realtime.service.js';
import { buildPublicOrderEvent } from './public-order.service.js';
import { auditLogsRepository } from '../db/repositories/audit-logs.supabase.repository.js';
import { integrationOutboxRepository } from '../db/repositories/integration-outbox.supabase.repository.js';
import {
  OrderStatus, PaymentStatus, FulfillmentStatus, isValidOrderTransition, ORDER_ERRORS, ActorType,
} from '../orders/order-types.js';

// TATA-POS integration outbox (Fase 4). Only the 'online_store' channel
// syncs -- 'qr_store' (dine-in QR) never enqueues, per the plan's decision
// to avoid double-booking revenue against whatever already records those
// transactions. This repo's own outlet/workspace ids ARE the values TATA-POS
// expects for external_workspace_id/external_outlet_id (TATA-POS's
// external_outlet_links table maps them back to its own outlet) -- no
// lookup/mapping table needed on this side.
const SYNCED_CHANNEL = 'online_store';

export function isTerminalOrder(order) {
  return [OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.EXPIRED, OrderStatus.COMPLETED].includes(order?.status)
    || [FulfillmentStatus.CANCELLED, FulfillmentStatus.COMPLETED].includes(order?.fulfillmentStatus || order?.fulfillment_status);
}

function paidOrderUpdates(paidAt = new Date().toISOString()) {
  return {
    payment_status: PaymentStatus.PAID,
    fulfillment_status: FulfillmentStatus.PREPARING,
    paid_at: paidAt,
    preparing_at: paidAt,
    status: OrderStatus.PREPARING,
  };
}

// order.paid item/totals shape per TATA-POS design.md §2. Reuses the item/
// totals fields ordersRepository's own mapOrder() already produces on every
// order object (order.items[]/order.totals) rather than re-querying or
// re-deriving them from scratch.
function buildOutboxItemsPayload(items = []) {
  return items.map((item) => ({
    sku: item.sku || null,
    product_name_snapshot: item.name || item.productNameSnapshot || 'Item',
    // This schema's order_items has no variant_name_snapshot column/mapping
    // (see order create() below / orders.supabase.repository.js's mapOrder),
    // but TATA-POS's DTO requires a non-empty string here -- fall back to
    // the product name, which is always present.
    variant_name_snapshot: item.variantName || item.name || item.productNameSnapshot || 'Standard',
    qty: item.quantity,
    unit_price: item.unitPrice,
    discount_amount: 0,
    line_total: item.subtotalAmount ?? item.subtotal ?? (item.unitPrice ?? 0) * (item.quantity ?? 0),
  }));
}

function buildOutboxTotalsPayload(order) {
  const totals = order.totals || {};
  return {
    subtotal: totals.subtotal ?? order.subtotalAmount ?? 0,
    discount_total: totals.discount ?? order.discountAmount ?? 0,
    tax_total: 0,
    service_charge_total: 0,
    delivery_fee_total: totals.deliveryFee ?? order.deliveryFee ?? 0,
    grand_total: totals.total ?? order.totalAmount ?? 0,
    currency: totals.currency ?? order.currency ?? 'IDR',
  };
}

// Builds the wire payload TATA-POS's import-external-order.dto.ts actually
// requires. NOTE: that DTO requires external_order_number/items/totals/payment on
// EVERY event_type -- there's no @IsOptional() gating them by event_type --
// even though the RPC (private.import_external_sales_order) itself only
// reads them on the order.paid insert path and ignores them on the
// order.completed/order.voided/order.fulfillment_updated update paths. So
// every event type built here sends the full shape, not just the fields
// the RPC happens to use for that event, to actually pass the live DTO's
// validation as it stands today.
function buildOutboxOrderPayload({ order, items, eventType, provider, providerReference, fulfillmentStatus }) {
  const occurredAt = new Date().toISOString();
  return {
    event_type: eventType,
    source: SYNCED_CHANNEL,
    external_order_id: order.id,
    external_order_number: order.orderNumber,
    external_workspace_id: order.workspaceId,
    external_outlet_id: order.outletId,
    // This repo's online_store orders are always pickup (fulfillmentType is
    // hardcoded 'pickup' at creation) -- TATA-POS's order_type enum has no
    // 'pickup' member, 'takeaway' is the closest fit.
    order_type: 'takeaway',
    occurred_at: occurredAt,
    paid_at: order.paidAt || occurredAt,
    ...(fulfillmentStatus ? { fulfillment_status: fulfillmentStatus } : {}),
    customer: {
      name: order.customerNameSnapshot || '',
      phone: order.customerPhoneSnapshot || '',
    },
    items: buildOutboxItemsPayload(items),
    totals: buildOutboxTotalsPayload(order),
    payment: {
      // Required non-empty by the DTO regardless of event_type. Every
      // order.paid call site threads a real payment.provider through;
      // fulfillment-lifecycle events have no payment record in scope (and
      // the RPC doesn't read this field on their update path anyway), so
      // 'unknown' is a harmless required filler there.
      provider: provider || 'unknown',
      ...(providerReference ? { provider_reference: providerReference } : {}),
      amount: order.totals?.total ?? order.totalAmount ?? 0,
      paid_at: order.paidAt || occurredAt,
    },
  };
}

async function enqueueOrderPaidEvent({ order, items, provider, providerReference }) {
  if (!order) return;
  await integrationOutboxRepository.enqueue({
    workspaceId: order.workspaceId,
    orderId: order.id,
    eventType: 'order.paid',
    payload: buildOutboxOrderPayload({ order, items, eventType: 'order.paid', provider, providerReference }),
  });
}

const FULFILLMENT_OUTBOX_EVENT_TYPE = {
  [FulfillmentStatus.CANCELLED]: 'order.voided',
  [FulfillmentStatus.COMPLETED]: 'order.completed',
};

// Fulfillment-lifecycle sync: hooked once here (notifyOrderUpdatedRealtime's
// one shared call site for approveOrder/rejectOrder/transitionOrderFulfillment
// /transitionOrderStatus) rather than per-caller. paymentStatus !== PAID
// covers both "never synced yet" and transitionOrderStatus's own
// allowed-before-payment cancellation path -- no order.paid was ever sent
// for either, so nothing to update on TATA-POS's side.
//
// `order` here comes from atomicStatusUpdate()/atomicFulfillmentStatusUpdate()
// (approve/reject/prepare/ready/complete/cancel), neither of which joins
// order_items -- unlike markOrderPaidPreparing's items (reused from its own
// pre-update workspaceFindById fetch, which does join them), there's no
// already-fetched items list available here, and the DTO requires a
// non-empty items array on every event_type (see buildOutboxOrderPayload).
// One extra read is the cheapest correct option; it only runs for paid
// online_store orders on a fulfillment transition, not on every order event.
async function enqueueFulfillmentLifecycleEvent({ order }) {
  if (!order || order.channel !== SYNCED_CHANNEL || order.paymentStatus !== PaymentStatus.PAID) return;
  const fulfillmentStatus = order.fulfillmentStatus || order.fulfillment_status;
  const eventType = FULFILLMENT_OUTBOX_EVENT_TYPE[fulfillmentStatus] || 'order.fulfillment_updated';
  const withItems = await ordersRepository.workspaceFindById({ workspaceId: order.workspaceId, orderId: order.id }).catch(() => null);
  await integrationOutboxRepository.enqueue({
    workspaceId: order.workspaceId,
    orderId: order.id,
    eventType,
    payload: buildOutboxOrderPayload({ order, items: withItems?.items || [], eventType, fulfillmentStatus }),
  });
}

/**
 * Consolidated from 3 verbatim-duplicated copies (payment.service.js,
 * payment-webhook.service.js, payment-reconciliation.service.js) --
 * TATA-POS Fase 4 planning surfaced the drift risk of 3 independent copies.
 * `deps.ordersRepository` preserves payment-reconciliation.service.js's
 * existing dependency-injection-for-testing capability (its own copy took a
 * `deps` param the other two didn't); `provider`/`providerReference` are new
 * optional fields threaded in by callers that have a payment record in
 * scope, used only to build the outbound order.paid outbox payload below.
 */
export async function markOrderPaidPreparing({ workspaceId, orderId, paidAt, provider, providerReference } = {}, deps = {}) {
  const ordersRepo = deps.ordersRepository || ordersRepository;
  const order = await ordersRepo.workspaceFindById({ workspaceId, orderId });
  if (isTerminalOrder(order)) return order;
  const fulfillmentStatus = order?.fulfillmentStatus || order?.fulfillment_status;
  const wasAlreadyPaid = order?.paymentStatus === PaymentStatus.PAID;
  if (wasAlreadyPaid && ![FulfillmentStatus.NOT_STARTED, FulfillmentStatus.AWAITING_ACCEPTANCE, FulfillmentStatus.ACCEPTED, 'unfulfilled', null, undefined].includes(fulfillmentStatus)) {
    return order;
  }
  const updated = await ordersRepo.updateOne({ workspaceId, orderId, updates: paidOrderUpdates(paidAt) });
  // Only enqueue on the transition that ACTUALLY just made the order paid
  // (order.paymentStatus read above was not yet PAID) -- an already-paid
  // order reaching this updateOne again (e.g. the fulfillment-status-only
  // repair path above) already had its order.paid sent the first time.
  if (updated && !wasAlreadyPaid && updated.channel === SYNCED_CHANNEL) {
    await enqueueOrderPaidEvent({ order: updated, items: order?.items, provider, providerReference })
      .catch((err) => console.error('[IntegrationOutbox] Failed to enqueue order.paid event:', err.message));
  }
  return updated;
}

export function resolveOutletName(formData = {}) {
  if (!formData) return 'Kami';
  const outletKey = Object.keys(formData).find((key) => key.toLowerCase().includes('outlet'));
  return outletKey ? formData[outletKey] : formData.outletName || formData.outlet_name || formData.storeName || 'Kami';
}

export async function generateOrderNumber(workspaceId) {
  const last = await ordersRepository.getNextOrderNumber(workspaceId);
  let seq = 1;
  if (last?.orderNumber) {
    const parts = last.orderNumber.split('-');
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `SLTH-${dateStr}-${String(seq).padStart(4, '0')}`;
}

function generatePublicOrderToken() {
  return `po_${randomBytes(18).toString('base64url')}`;
}

export async function createOrderFromCheckout({ workspaceId, checkout, user }) {
  if (user) {
    await assertOutletAccess(user, checkout.outletId);
  }
  
  let inferredSource = 'telegram';
  if (checkout.contactId) {
    const contact = await contactsRepository.findById({ workspaceId, contactId: checkout.contactId });
    if (contact) {
      const handleStr = contact.handle || contact.phone || '';
      if (/^\d{10,15}$/.test(handleStr) && handleStr.startsWith('62')) {
        inferredSource = 'whatsapp';
      }
    }
  }

  const orderNumber = await generateOrderNumber(workspaceId);
  let outletNameSnapshot = checkout.fulfillmentSnapshot?.outletName || '';
  if (!outletNameSnapshot && checkout.outletId) {
    const outlet = await outletsRepository.findById({ workspaceId, outletId: checkout.outletId });
    outletNameSnapshot = outlet?.name || '';
  }
  const order = await ordersRepository.create({
    workspaceId,
    outletId: checkout.outletId,
    outletNameSnapshot,
    checkoutId: checkout.id,
    chatId: checkout.chatId,
    contactId: checkout.contactId,
    orderNumber,
    items: checkout.items,
    customerSnapshot: checkout.customerSnapshot || {},
    customerNameSnapshot: checkout.customerSnapshot?.contactName || checkout.customerSnapshot?.name || '',
    customerPhoneSnapshot: checkout.customerSnapshot?.phone || '',
    fulfillmentSnapshot: checkout.fulfillmentSnapshot || { method: 'pickup' },
    subtotalAmount: checkout.subtotal ?? checkout.subtotalAmount ?? 0,
    totalAmount: checkout.total ?? checkout.totalAmount ?? 0,
    currency: checkout.currency || 'IDR',
    source: inferredSource,
    channel: checkout.channel || 'online_store',
    publicOrderToken: generatePublicOrderToken(),
    qrSessionId: checkout.qrSessionId || null,
    qrLocationId: checkout.qrLocationId || checkout.metadata?.qrLocation?.id || checkout.metadata?.qrLocationId || null,
    tableId: checkout.tableId || null,
    qrLocationLabel: checkout.qrLocationLabel || null,
    fulfillmentType: 'pickup',
    status: OrderStatus.AWAITING_OUTLET_APPROVAL,
    paymentStatus: PaymentStatus.UNPAID,
    fulfillmentStatus: FulfillmentStatus.AWAITING_ACCEPTANCE,
    metadata: { ...(checkout.metadata || {}), confirmationExpiresAt: new Date(Date.now() + 30_000).toISOString() },
  });
  notifyOrderCreated({ workspaceId, outletId: order.outletId, order });
  await logOrderAudit({ workspaceId, outletId: order.outletId, orderId: order.id, userId: user?.id, action: 'order.created', details: { channel: order.channel, paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus } });
  return order;
}

export async function createOrderFromAI({ chat, agent, orderData, paymentProofUrl }) {
  const outletId = chat.currentOutletId || orderData.outletId || orderData.outlet_id || null;
  const workspaceId = chat.workspaceId || agent.workspaceId;
  const orderNumber = await generateOrderNumber(workspaceId);

  let inferredSource = 'telegram';
  if (chat.contactId) {
    const contact = await contactsRepository.findById({ workspaceId, contactId: chat.contactId });
    if (contact) {
      const handleStr = contact.handle || contact.phone || '';
      if (/^\d{10,15}$/.test(handleStr) && handleStr.startsWith('62')) {
        inferredSource = 'whatsapp';
      }
    }
  }

  let outletNameSnapshot = resolveOutletName(orderData.formData);
  if (!outletNameSnapshot || outletNameSnapshot === 'Kami') {
    const outlet = outletId ? await outletsRepository.findById({ workspaceId, outletId }) : null;
    outletNameSnapshot = outlet?.name || '';
  }

  const order = await ordersRepository.create({
    workspaceId,
    outletId,
    outletNameSnapshot,
    chatId: chat.id,
    contactId: chat.contactId,
    agentId: agent.id,
    orderNumber,
    formName: orderData.formName || 'General Order',
    formData: orderData.formData || {},
    source: inferredSource,
    status: OrderStatus.PENDING_PAYMENT,
    publicOrderToken: generatePublicOrderToken(),
    fulfillmentType: 'pickup',
    paymentStatus: paymentProofUrl ? PaymentStatus.PENDING : PaymentStatus.UNPAID,
    fulfillmentStatus: FulfillmentStatus.NOT_STARTED,
    paymentProofUrl,
    totals: { subtotal: 0, total: 0, currency: 'IDR' },
    timeline: [{ type: 'order:created', actor: 'ai', note: 'Legacy order from AI', timestamp: new Date() }],
  });
  notifyOrderCreated({ workspaceId, outletId: order.outletId, order });
  await logOrderAudit({ workspaceId, outletId: order.outletId, orderId: order.id, userId: null, action: 'order.created', details: { channel: order.channel || order.source, paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus } });
  return order;
}

async function logOrderAudit({ workspaceId, outletId, orderId, userId, action, details = {} }) {
  try {
    await auditLogsRepository.log({
      workspaceId,
      outletId,
      actorId: userId || null,
      action,
      resourceType: 'order',
      resourceId: orderId,
      details,
    });
  } catch (err) {
    console.error(`[OrderAudit] Failed to record ${action}:`, err.message);
  }
}

function notifyOrderCreated({ workspaceId, outletId, order }) {
  notifyOrderUpdatedRealtime({ workspaceId, outletId, order });

  if (!isOrderPaid(order)) return;

  broadcastToWorkspace({
    workspaceId,
    event: 'order.created',
    data: buildOrderCreatedEvent({ workspaceId, outletId, order }),
  });
  sendOrderCreatedPush({ workspaceId, outletId, order }).catch((err) => {
    console.error('[OrderPushNotification] Failed to send order.created push:', err.message);
  });
}

export function notifyPaidOrderRealtime({ workspaceId, outletId, order }) {
  if (!isOrderPaid(order)) return { sent: 0, skipped: true, reason: 'payment_not_paid' };

  notifyOrderUpdatedRealtime({ workspaceId, outletId, order });
  sendOrderPaidPush({ workspaceId, outletId, order }).catch((err) => {
    console.error('[OrderPushNotification] Failed to send order.paid push:', err.message);
  });

  return broadcastToWorkspace({
    workspaceId,
    event: 'order.paid',
    data: {
      ...buildOrderCreatedEvent({ workspaceId, outletId, order }),
      type: 'order.paid',
      title: 'Pesanan sudah dibayar',
    },
  });
}

export function notifyPaymentUpdatedRealtime({ workspaceId, outletId, payment, order = null }) {
  return broadcastToWorkspace({
    workspaceId,
    event: payment?.status === 'paid' ? 'payment.paid' : 'payment.updated',
    data: {
      type: payment?.status === 'paid' ? 'payment.paid' : 'payment.updated',
      workspaceId,
      outletId: outletId || payment?.outletId || order?.outletId || null,
      paymentId: payment?.id,
      orderId: payment?.orderId || order?.id,
      payment,
      order,
      updatedAt: new Date().toISOString(),
    },
  });
}

// Lets a device tell "I just did this" (skip its own re-render/toast) from
// "someone else did this" (must react). userId is only ever null when the
// call came from the TATA-POS reverse bridge (integrations-inbound.js) --
// every staff-authenticated route always has a real userId.
function resolveActor(userId) {
  return userId ? { type: 'staff', userId } : { type: 'tata_pos_bridge' };
}

// Case-insensitive on purpose: rejectOrder stores uppercase 'REJECTED', but
// the admin-cancel path (transitionOrderStatus, called with the raw
// lowercase 'cancelled') persists that string as-is.
function isCancelledOutcome(order) {
  const status = String(order?.status || '').toUpperCase();
  return order?.fulfillmentStatus === FulfillmentStatus.CANCELLED
    || ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(status);
}

export function notifyOrderUpdatedRealtime({ workspaceId, outletId, order, actor = null }) {
  // Fire-and-forget: never awaited here so this function's sync signature/
  // return value is unchanged, and any enqueue failure can't break the
  // realtime broadcast it's attached to (the outbox's own retry/dead-letter
  // handling deals with delivery failures, not this call site).
  enqueueFulfillmentLifecycleEvent({ order }).catch((err) => console.error('[IntegrationOutbox] Failed to enqueue fulfillment event:', err.message));
  const cancelled = isCancelledOutcome(order);
  const event = cancelled ? 'order.cancelled' : 'order.updated';
  // order.updatedAt (real DB column), not broadcast time -- clients compare
  // this against what they already hold to discard stale/out-of-order events.
  const updatedAt = order?.updatedAt || new Date().toISOString();
  const result = broadcastToWorkspace({
    workspaceId,
    event,
    data: {
      type: event,
      workspaceId,
      outletId,
      orderId: order?.id,
      orderNumber: order?.orderNumber,
      order,
      actor,
      updatedAt,
    },
  });
  if (order?.publicOrderToken) {
    broadcastToPublicOrder({
      publicOrderToken: order.publicOrderToken,
      event,
      data: buildPublicOrderEvent(order),
    });
  }
  return result;
}

function isOrderPaid(order = {}) {
  return String(order.paymentStatus || order.payment_status || '').trim().toLowerCase() === 'paid';
}

function buildOrderCreatedEvent({ workspaceId, outletId, order }) {
  return {
    type: 'order.created',
    workspaceId,
    outletId,
    orderId: order?.id,
    orderNumber: order?.orderNumber,
    title: 'Pesanan baru masuk',
    body: `${order?.orderNumber || order?.id || 'Order baru'} dari ${order?.customerNameSnapshot || order?.customerSnapshot?.name || 'Customer'}`,
    order,
    createdAt: new Date().toISOString(),
  };
}

export async function approveOrder({ workspaceId, orderId, outletId, userId }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found', ORDER_ERRORS.ORDER_NOT_FOUND.status);
  if (order.outletId !== outletId) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found for outlet', 404);
  // Idempotent retry: a second tablet's "accept" tap on an order another
  // tablet already accepted is a harmless no-op, not an error.
  if (order.fulfillmentStatus === FulfillmentStatus.ACCEPTED) return order;
  if (order.fulfillmentStatus !== FulfillmentStatus.AWAITING_ACCEPTANCE) {
    throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, 'Order is not awaiting outlet acceptance', 409, { currentState: order });
  }

  const updated = await ordersRepository.atomicFulfillmentStatusUpdate({
    workspaceId,
    orderId,
    expectedStatus: FulfillmentStatus.AWAITING_ACCEPTANCE,
    newStatus: FulfillmentStatus.ACCEPTED,
    updates: { status: OrderStatus.APPROVED, approved_at: new Date().toISOString() },
  });
  if (!updated) throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, 'Cannot approve in current state', 409, { currentState: order });

  await ordersRepository.addTimelineEntry({
    orderId, workspaceId,
    eventType: 'order:approved',
    actorType: ActorType.HUMAN_AGENT,
    actorUserId: userId,
    metadata: { outletId, fromStatus: OrderStatus.AWAITING_OUTLET_APPROVAL, toStatus: OrderStatus.APPROVED },
  });

  await logOrderAudit({ workspaceId, outletId: updated.outletId, orderId, userId, action: 'order.accepted', details: { fromStatus: FulfillmentStatus.AWAITING_ACCEPTANCE, toStatus: FulfillmentStatus.ACCEPTED } });

  notifyOrderUpdatedRealtime({ workspaceId, outletId: updated.outletId, order: updated, actor: resolveActor(userId) });

  return updated;
}

export async function rejectOrder({ workspaceId, orderId, outletId, userId, reason }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found', ORDER_ERRORS.ORDER_NOT_FOUND.status);
  if (order.outletId !== outletId) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found for outlet', 404);
  if (!reason?.trim()) throw new AppError('VALIDATION', 'Reason is required', 400);
  // Idempotent retry: already rejected/cancelled by another tablet.
  if (order.fulfillmentStatus === FulfillmentStatus.CANCELLED) return order;
  if (order.fulfillmentStatus !== FulfillmentStatus.AWAITING_ACCEPTANCE) {
    throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, 'Order is not awaiting outlet acceptance', 409, { currentState: order });
  }

  const updated = await ordersRepository.atomicFulfillmentStatusUpdate({
    workspaceId,
    orderId,
    expectedStatus: FulfillmentStatus.AWAITING_ACCEPTANCE,
    newStatus: FulfillmentStatus.CANCELLED,
    updates: { status: OrderStatus.REJECTED, rejected_at: new Date().toISOString(), cancel_reason: reason },
  });
  if (!updated) throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, 'Cannot reject in current state', 409, { currentState: order });

  await ordersRepository.addTimelineEntry({
    orderId, workspaceId,
    eventType: 'order:rejected',
    actorType: ActorType.HUMAN_AGENT,
    actorUserId: userId,
    metadata: { outletId, reason, fromStatus: OrderStatus.AWAITING_OUTLET_APPROVAL, toStatus: OrderStatus.REJECTED },
  });

  await logOrderAudit({ workspaceId, outletId: updated.outletId, orderId, userId, action: 'order.cancelled', details: { reason, fromStatus: FulfillmentStatus.AWAITING_ACCEPTANCE, toStatus: FulfillmentStatus.CANCELLED } });

  notifyOrderUpdatedRealtime({ workspaceId, outletId: updated.outletId, order: updated, actor: resolveActor(userId) });

  return updated;
}

export async function startPreparing({ workspaceId, orderId, outletId, userId }) {
  return transitionOrderFulfillment({ workspaceId, orderId, outletId, userId, expected: FulfillmentStatus.ACCEPTED, next: FulfillmentStatus.PREPARING, legacyStatus: OrderStatus.PREPARING, timestampColumn: 'preparing_at', eventType: 'order:preparing' });
}

export async function markReady({ workspaceId, orderId, outletId, userId }) {
  return transitionOrderFulfillment({ workspaceId, orderId, outletId, userId, expected: FulfillmentStatus.PREPARING, next: FulfillmentStatus.READY, legacyStatus: OrderStatus.READY_FOR_PICKUP, timestampColumn: 'ready_at', eventType: 'order:ready' });
}

export async function completeOrder({ workspaceId, orderId, outletId, userId }) {
  return transitionOrderFulfillment({ workspaceId, orderId, outletId, userId, expected: FulfillmentStatus.READY, next: FulfillmentStatus.COMPLETED, legacyStatus: OrderStatus.COMPLETED, timestampColumn: 'completed_at', eventType: 'order:completed' });
}

async function transitionOrderFulfillment({ workspaceId, orderId, outletId, userId, expected, next, legacyStatus, timestampColumn, eventType }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found', ORDER_ERRORS.ORDER_NOT_FOUND.status);
  if (outletId && order.outletId !== outletId) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found for outlet', 404);
  if (order.paymentStatus !== PaymentStatus.PAID) throw new AppError(ORDER_ERRORS.ORDER_PAYMENT_NOT_PAID.code, 'Payment not yet paid', ORDER_ERRORS.ORDER_PAYMENT_NOT_PAID.status);

  const updated = await ordersRepository.atomicFulfillmentStatusUpdate({
    workspaceId,
    orderId,
    expectedStatus: expected,
    newStatus: next,
    updates: { status: legacyStatus, [timestampColumn]: new Date().toISOString() },
  });
  if (!updated) {
    // Idempotent retry: another tablet already made this exact transition.
    if (order.fulfillmentStatus === next) return order;
    throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, `Cannot transition to ${next}`, 409, { currentState: order });
  }

  await ordersRepository.addTimelineEntry({
    orderId, workspaceId, eventType, actorType: ActorType.HUMAN_AGENT, actorUserId: userId,
    metadata: { outletId, fromStatus: expected, toStatus: next },
  });
  const auditActionByStatus = {
    [FulfillmentStatus.PREPARING]: 'order.preparing',
    [FulfillmentStatus.READY]: 'order.ready',
    [FulfillmentStatus.COMPLETED]: 'order.completed',
  };
  await logOrderAudit({ workspaceId, outletId: updated.outletId, orderId, userId, action: auditActionByStatus[next] || eventType.replace(':', '.'), details: { fromStatus: expected, toStatus: next } });
  notifyOrderUpdatedRealtime({ workspaceId, outletId: updated.outletId, order: updated, actor: resolveActor(userId) });
  return updated;
}

export async function listOrdersForUser({ user, status, outletId }) {
  const query = await buildOrderTenantQuery(user, outletId);
  if (status) query.status = status;
  return ordersRepository.findList(query);
}

export async function findOrderForUser({ user, orderId }) {
  const query = await buildOrderTenantQuery(user);
  query.orderId = orderId;
  return ordersRepository.findOne(query);
}

export async function updateOrderForUser({ user, orderId, update }) {
  const query = await buildOrderTenantQuery(user);
  query.orderId = orderId;
  return ordersRepository.updateOne({ ...query, updates: update?.$set || update });
}

export async function deleteOrderForUser({ user, orderId }) {
  throw new AppError('ORDER_DELETE_DISABLED', 'Order deletion is disabled. Cancel the order with a reason instead.', 405);
}

const STATUS_MESSAGES = {
  accepted: 'Pesanan Anda telah diterima ✅ dan sedang kami proses.',
  preparing: 'Pesanan Anda sedang disiapkan 👨‍🍳',
  ready: 'Pesanan Anda sudah siap diambil 🎉 Silakan ambil di outlet.',
  completed: 'Pesanan Anda sudah selesai. Terima kasih telah berbelanja! 🙏',
  cancelled: 'Pesanan Anda telah dibatalkan.',
};

const LEGACY_TO_NEW = {
  new: OrderStatus.PENDING_PAYMENT,
  accepted: OrderStatus.APPROVED,
  preparing: OrderStatus.PREPARING,
  ready: OrderStatus.READY_FOR_PICKUP,
  completed: OrderStatus.COMPLETED,
  cancelled: OrderStatus.CANCELLED,
  rejected: OrderStatus.REJECTED,
};

const LEGACY_TO_FULFILLMENT = {
  accepted: FulfillmentStatus.ACCEPTED,
  preparing: FulfillmentStatus.PREPARING,
  ready: FulfillmentStatus.READY,
  completed: FulfillmentStatus.COMPLETED,
  cancelled: FulfillmentStatus.CANCELLED,
  rejected: FulfillmentStatus.CANCELLED,
};

export async function transitionOrderStatus({ workspaceId, orderId, newStatus, actor, reason, outletId }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  if (outletId && order.outletId !== outletId) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found for outlet', 404);
  const currentStatus = LEGACY_TO_NEW[order.status] || order.status;
  const targetStatus = LEGACY_TO_NEW[newStatus] || newStatus;
  // Idempotent retry: already at the requested status.
  if (currentStatus === targetStatus) return order;
  if (!isValidOrderTransition(currentStatus, targetStatus)) {
    throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, `Cannot transition from ${order.status} to ${newStatus}`, 409, { currentState: order });
  }
  const fulfillmentStatus = LEGACY_TO_FULFILLMENT[newStatus] || LEGACY_TO_FULFILLMENT[targetStatus];
  if (fulfillmentStatus === FulfillmentStatus.CANCELLED && !reason?.trim()) {
    throw new AppError('VALIDATION', 'Reason is required for order cancellation', 400);
  }
  if (fulfillmentStatus && fulfillmentStatus !== FulfillmentStatus.CANCELLED && order.paymentStatus !== PaymentStatus.PAID) {
    throw new AppError(ORDER_ERRORS.ORDER_PAYMENT_NOT_PAID.code, 'Payment not yet paid', ORDER_ERRORS.ORDER_PAYMENT_NOT_PAID.status);
  }
  const updated = await ordersRepository.atomicStatusUpdate({
    workspaceId,
    orderId,
    expectedStatus: order.status,
    newStatus,
    updates: {
      ...(fulfillmentStatus ? { fulfillment_status: fulfillmentStatus } : {}),
      ...(['cancelled', OrderStatus.CANCELLED].includes(newStatus) ? { cancel_reason: reason || null, cancelled_at: new Date().toISOString() } : {}),
    },
  });
  if (!updated) throw new AppError(ORDER_ERRORS.VERSION_CONFLICT.code, 'Order status changed concurrently', 409, { currentState: order });

  await logOrderAudit({
    workspaceId,
    outletId: updated.outletId,
    orderId,
    userId: actor?.id || null,
    action: ['cancelled', OrderStatus.CANCELLED].includes(newStatus) ? 'order.cancelled' : `order.${String(newStatus).replace(/_/g, '.')}`,
    details: { fromStatus: order.status, toStatus: newStatus, reason: reason || null },
  });

  notifyOrderUpdatedRealtime({ workspaceId, outletId: updated.outletId, order: updated, actor: resolveActor(actor?.id) });

  // Send notification after persisted transition
  const message = STATUS_MESSAGES[newStatus];
  if (message && isOrderPaid(updated)) {
    try {
      await sendOrderStatusMessage({ order: updated, messageText: message, from: 'ai' });
    } catch (msgErr) {
      console.error(`[OrderNotification] Failed to send ${newStatus} notification:`, msgErr.message);
    }
  }

  return updated;
}

export async function workspaceListOrders({ workspaceId, outletId, status, paymentStatus, search, page, limit, sort }) {
  await ordersRepository.syncPaidOrdersFromPayments({ workspaceId, outletId });
  const data = await ordersRepository.workspaceList({ workspaceId, outletId, status, paymentStatus, search, page, limit, sort });
  const total = await ordersRepository.workspaceCount({ workspaceId, outletId, status, paymentStatus, search });
  return { data, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 20 } };
}

export async function listWorkspaceOrdersForUser({ user, outletId, status, paymentStatus, search, page, limit, chatId, contactId }) {
  const scope = await buildOrderTenantQuery(user, outletId);
  await ordersRepository.syncPaidOrdersFromPayments({
    workspaceId: scope.workspaceId,
    outletId: scope.outletId,
    outletIds: scope.outletIds,
  });
  const data = await ordersRepository.workspaceListScoped({
    workspaceId: scope.workspaceId,
    outletId: scope.outletId,
    outletIds: scope.outletIds,
    status,
    paymentStatus,
    search,
    page,
    limit,
    chatId,
    contactId,
  });
  const total = await ordersRepository.workspaceCountScoped({
    workspaceId: scope.workspaceId,
    outletId: scope.outletId,
    outletIds: scope.outletIds,
    status,
    paymentStatus,
    search,
    chatId,
    contactId,
  });
  return { data, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 20 } };
}

export async function workspaceGetOrder({ workspaceId, orderId }) {
  await ordersRepository.syncPaidOrderFromPayment({ workspaceId, orderId });
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  return order;
}

export async function getWorkspaceOrderForUser({ user, orderId }) {
  const scope = await buildOrderTenantQuery(user);
  await ordersRepository.syncPaidOrderFromPayment({
    workspaceId: scope.workspaceId,
    orderId,
    outletIds: scope.outletIds,
  });
  const order = Array.isArray(scope.outletIds)
    ? await ordersRepository.workspaceFindByIdScoped({ workspaceId: scope.workspaceId, orderId, outletIds: scope.outletIds })
    : await ordersRepository.workspaceFindById({ workspaceId: scope.workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  if (!canAccessAllOutlets(user)) await assertOutletAccess(user, order.outletId);
  return order;
}

export async function sendOrderStatusMessage({ order, messageText, from = 'human' }) {
  const chatId = order.chatId?.id || order.chatId;
  const chat = await chatsRepository.findByIdWithPlatformAndContact(chatId);
  if (!chat?.platformId || !chat?.contactId) return null;

  const platform = chat.platforms;
  const contact = chat.contacts;
  let sentMessageId = null;

  if (platform.type === 'telegram') {
    const result = await tgSend(platform.token, chat.platformAccountId, messageText);
    sentMessageId = result.result?.message_id?.toString();
  } else if (platform.type === 'whatsapp') {
    const result = await waSend(platform.token, platform.phoneNumberId, chat.platformAccountId, messageText);
    sentMessageId = result.messages?.[0]?.id;
  } else if (platform.type === 'instagram') {
    const result = await igSend(platform.token, chat.platformAccountId, messageText);
    sentMessageId = result.message_id;
  }

  await messagesRepository.create({
    chatId: chat.id,
    workspaceId: chat.workspaceId,
    from,
    text: messageText,
    platformMessageId: sentMessageId,
  });

  return sentMessageId;
}

async function buildOrderTenantQuery(user, outletId) {
  const baseQuery = await buildOutletScopedQuery(user, outletId);
  return baseQuery;
}
