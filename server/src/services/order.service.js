import { randomBytes } from 'node:crypto';
import { chatsRepository, messagesRepository, ordersRepository, contactsRepository, outletsRepository } from '../db/repositories/index.js';
import { tgSend, waSend, igSend } from './sender.js';
import { buildOutletScopedQuery, assertOutletAccess, canAccessAllOutlets } from './access-control.service.js';
import { AppError } from '../utils/errors.js';
import { sendOrderCreatedPush } from './web-push.service.js';
import { broadcastToWorkspace } from './realtime.service.js';
import {
  OrderStatus, PaymentStatus, FulfillmentStatus, isValidOrderTransition, ORDER_ERRORS, ActorType,
} from '../orders/order-types.js';

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
    tableId: checkout.tableId || null,
    qrLocationLabel: checkout.qrLocationLabel || null,
    fulfillmentType: 'pickup',
    status: OrderStatus.PENDING_PAYMENT,
    paymentStatus: PaymentStatus.UNPAID,
    fulfillmentStatus: FulfillmentStatus.NOT_STARTED,
  });
  notifyOrderCreated({ workspaceId, outletId: order.outletId, order });
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
  return order;
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

export function notifyOrderUpdatedRealtime({ workspaceId, outletId, order }) {
  return broadcastToWorkspace({
    workspaceId,
    event: 'order.updated',
    data: {
      type: 'order.updated',
      workspaceId,
      outletId,
      orderId: order?.id,
      orderNumber: order?.orderNumber,
      order,
      updatedAt: new Date().toISOString(),
    },
  });
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
  if (order.paymentStatus !== PaymentStatus.PAID) throw new AppError(ORDER_ERRORS.ORDER_PAYMENT_NOT_PAID.code, 'Payment not yet paid', ORDER_ERRORS.ORDER_PAYMENT_NOT_PAID.status);
  if (order.fulfillmentStatus !== FulfillmentStatus.AWAITING_ACCEPTANCE) throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, 'Order is not awaiting outlet acceptance', 400);

  const updated = await ordersRepository.atomicFulfillmentStatusUpdate({
    workspaceId,
    orderId,
    expectedStatus: FulfillmentStatus.AWAITING_ACCEPTANCE,
    newStatus: FulfillmentStatus.ACCEPTED,
    updates: { status: OrderStatus.APPROVED, approved_at: new Date().toISOString() },
  });
  if (!updated) throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, 'Cannot approve in current state', 400);

  await ordersRepository.addTimelineEntry({
    orderId, workspaceId,
    eventType: 'order:approved',
    actorType: ActorType.HUMAN_AGENT,
    actorUserId: userId,
    metadata: { outletId, fromStatus: OrderStatus.AWAITING_OUTLET_APPROVAL, toStatus: OrderStatus.APPROVED },
  });

  notifyOrderUpdatedRealtime({ workspaceId, outletId: updated.outletId, order: updated });

  return updated;
}

export async function rejectOrder({ workspaceId, orderId, outletId, userId, reason }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found', ORDER_ERRORS.ORDER_NOT_FOUND.status);
  if (order.outletId !== outletId) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found for outlet', 404);
  if (!reason?.trim()) throw new AppError('VALIDATION', 'Reason is required', 400);
  if (order.fulfillmentStatus !== FulfillmentStatus.AWAITING_ACCEPTANCE) throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, 'Order is not awaiting outlet acceptance', 400);

  const updated = await ordersRepository.atomicFulfillmentStatusUpdate({
    workspaceId,
    orderId,
    expectedStatus: FulfillmentStatus.AWAITING_ACCEPTANCE,
    newStatus: FulfillmentStatus.CANCELLED,
    updates: { status: OrderStatus.REJECTED, rejected_at: new Date().toISOString(), cancel_reason: reason },
  });
  if (!updated) throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, 'Cannot reject in current state', 400);

  await ordersRepository.addTimelineEntry({
    orderId, workspaceId,
    eventType: 'order:rejected',
    actorType: ActorType.HUMAN_AGENT,
    actorUserId: userId,
    metadata: { outletId, reason, fromStatus: OrderStatus.AWAITING_OUTLET_APPROVAL, toStatus: OrderStatus.REJECTED },
  });

  notifyOrderUpdatedRealtime({ workspaceId, outletId: updated.outletId, order: updated });

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
  if (!updated) throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, `Cannot transition to ${next}`, 400);

  await ordersRepository.addTimelineEntry({
    orderId, workspaceId, eventType, actorType: ActorType.HUMAN_AGENT, actorUserId: userId,
    metadata: { outletId, fromStatus: expected, toStatus: next },
  });
  notifyOrderUpdatedRealtime({ workspaceId, outletId: updated.outletId, order: updated });
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
  const query = await buildOrderTenantQuery(user);
  query.orderId = orderId;
  return ordersRepository.deleteOne(query);
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

export async function transitionOrderStatus({ workspaceId, orderId, newStatus, actor, reason }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  const currentStatus = LEGACY_TO_NEW[order.status] || order.status;
  const targetStatus = LEGACY_TO_NEW[newStatus] || newStatus;
  if (!isValidOrderTransition(currentStatus, targetStatus)) {
    throw new AppError('INVALID_TRANSITION', `Cannot transition from ${order.status} to ${newStatus}`, 409);
  }
  const fulfillmentStatus = LEGACY_TO_FULFILLMENT[newStatus] || LEGACY_TO_FULFILLMENT[targetStatus];
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
  if (!updated) throw new AppError('CONFLICT', 'Order status changed concurrently', 409);

  notifyOrderUpdatedRealtime({ workspaceId, outletId: updated.outletId, order: updated });

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
  const data = await ordersRepository.workspaceList({ workspaceId, outletId, status, paymentStatus, search, page, limit, sort });
  const total = await ordersRepository.workspaceCount({ workspaceId, outletId, status, paymentStatus, search });
  return { data, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 20 } };
}

export async function listWorkspaceOrdersForUser({ user, outletId, status, paymentStatus, search, page, limit, chatId, contactId }) {
  const scope = await buildOrderTenantQuery(user, outletId);
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
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  return order;
}

export async function getWorkspaceOrderForUser({ user, orderId }) {
  const scope = await buildOrderTenantQuery(user);
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
