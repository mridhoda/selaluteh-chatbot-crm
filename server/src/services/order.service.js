import { chatsRepository, messagesRepository, ordersRepository, contactsRepository } from '../db/repositories/index.js';
import { tgSend, waSend, igSend } from './sender.js';
import { buildOutletScopedQuery, assertOutletAccess, canAccessAllOutlets } from './access-control.service.js';
import { AppError } from '../utils/errors.js';
import {
  OrderStatus, isValidOrderTransition, ORDER_ERRORS, ActorType,
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
  const order = await ordersRepository.create({
    workspaceId,
    outletId: checkout.outletId,
    outletNameSnapshot: checkout.fulfillmentSnapshot?.outletName || '',
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
    status: 'new',
    paymentStatus: 'unpaid',
    fulfillmentStatus: 'unfulfilled',
  });
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

  return ordersRepository.create({
    workspaceId,
    outletId,
    outletNameSnapshot: resolveOutletName(orderData.formData),
    chatId: chat.id,
    contactId: chat.contactId,
    agentId: agent.id,
    orderNumber,
    formName: orderData.formName || 'General Order',
    formData: orderData.formData || {},
    source: inferredSource,
    status: OrderStatus.PENDING_PAYMENT,
    paymentStatus: paymentProofUrl ? 'pending' : 'unpaid',
    paymentProofUrl,
    totals: { subtotal: 0, total: 0, currency: 'IDR' },
    timeline: [{ type: 'order:created', actor: 'ai', note: 'Legacy order from AI', timestamp: new Date() }],
  });
}

export async function approveOrder({ workspaceId, orderId, outletId, userId }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found', ORDER_ERRORS.ORDER_NOT_FOUND.status);
  if (order.outletId !== outletId) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found for outlet', 404);
  if (order.paymentStatus !== 'paid') throw new AppError(ORDER_ERRORS.ORDER_PAYMENT_NOT_PAID.code, 'Payment not yet paid', ORDER_ERRORS.ORDER_PAYMENT_NOT_PAID.status);

  const updated = await ordersRepository.atomicStatusUpdate({
    orderId,
    expectedStatus: OrderStatus.AWAITING_OUTLET_APPROVAL,
    newStatus: OrderStatus.APPROVED,
  });
  if (!updated) throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, 'Cannot approve in current state', 400);

  await ordersRepository.addTimelineEntry({
    orderId, workspaceId,
    eventType: 'order:approved',
    actorType: ActorType.HUMAN_AGENT,
    actorUserId: userId,
    metadata: { outletId, fromStatus: OrderStatus.AWAITING_OUTLET_APPROVAL, toStatus: OrderStatus.APPROVED },
  });

  return updated;
}

export async function rejectOrder({ workspaceId, orderId, outletId, userId, reason }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found', ORDER_ERRORS.ORDER_NOT_FOUND.status);
  if (order.outletId !== outletId) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found for outlet', 404);

  const updated = await ordersRepository.atomicStatusUpdate({
    orderId,
    expectedStatus: OrderStatus.AWAITING_OUTLET_APPROVAL,
    newStatus: OrderStatus.REJECTED,
  });
  if (!updated) throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, 'Cannot reject in current state', 400);

  await ordersRepository.addTimelineEntry({
    orderId, workspaceId,
    eventType: 'order:rejected',
    actorType: ActorType.HUMAN_AGENT,
    actorUserId: userId,
    metadata: { outletId, reason, fromStatus: OrderStatus.AWAITING_OUTLET_APPROVAL, toStatus: OrderStatus.REJECTED },
  });

  return updated;
}

export async function startPreparing({ workspaceId, orderId, outletId, userId }) {
  return transitionOrderFulfillment({ workspaceId, orderId, outletId, userId, expected: OrderStatus.APPROVED, next: OrderStatus.PREPARING, eventType: 'order:preparing' });
}

export async function markReady({ workspaceId, orderId, outletId, userId }) {
  return transitionOrderFulfillment({ workspaceId, orderId, outletId, userId, expected: OrderStatus.PREPARING, next: OrderStatus.READY_FOR_PICKUP, eventType: 'order:ready' });
}

export async function completeOrder({ workspaceId, orderId, outletId, userId }) {
  return transitionOrderFulfillment({ workspaceId, orderId, outletId, userId, expected: OrderStatus.READY_FOR_PICKUP, next: OrderStatus.COMPLETED, eventType: 'order:completed' });
}

async function transitionOrderFulfillment({ workspaceId, orderId, outletId, userId, expected, next, eventType }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found', ORDER_ERRORS.ORDER_NOT_FOUND.status);
  if (outletId && order.outletId !== outletId) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found for outlet', 404);

  const updated = await ordersRepository.atomicStatusUpdate({ orderId, expectedStatus: expected, newStatus: next });
  if (!updated) throw new AppError(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, `Cannot transition to ${next}`, 400);

  await ordersRepository.addTimelineEntry({
    orderId, workspaceId, eventType, actorType: ActorType.HUMAN_AGENT, actorUserId: userId,
    metadata: { outletId, fromStatus: expected, toStatus: next },
  });
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

export async function transitionOrderStatus({ workspaceId, orderId, newStatus, actor }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  const currentStatus = LEGACY_TO_NEW[order.status] || order.status;
  const targetStatus = LEGACY_TO_NEW[newStatus] || newStatus;
  if (!isValidOrderTransition(currentStatus, targetStatus)) {
    throw new AppError('INVALID_TRANSITION', `Cannot transition from ${order.status} to ${newStatus}`, 409);
  }
  const updated = await ordersRepository.atomicStatusUpdate({ workspaceId, orderId, expectedStatus: order.status, newStatus });
  if (!updated) throw new AppError('CONFLICT', 'Order status changed concurrently', 409);

  // Send notification after persisted transition
  const message = STATUS_MESSAGES[newStatus];
  if (message) {
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

export async function listWorkspaceOrdersForUser({ user, outletId, status, paymentStatus, search, page, limit }) {
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
  });
  const total = await ordersRepository.workspaceCountScoped({
    workspaceId: scope.workspaceId,
    outletId: scope.outletId,
    outletIds: scope.outletIds,
    status,
    paymentStatus,
    search,
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
