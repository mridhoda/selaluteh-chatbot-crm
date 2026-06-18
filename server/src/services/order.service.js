import { chatsRepository, messagesRepository, ordersRepository } from '../db/repositories/index.js';
import { tgSend, waSend, igSend } from './sender.js';
import { buildOutletScopedQuery } from './access-control.service.js';
import { AppError } from '../utils/errors.js';

const VALID_TRANSITIONS = {
  new: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function isValidTransition(current, next) {
  return (VALID_TRANSITIONS[current] || []).includes(next);
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
  return `ORD-${dateStr}-${String(seq).padStart(4, '0')}`;
}

export async function createOrderFromCheckout({ workspaceId, checkout, user }) {
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
    fulfillmentSnapshot: checkout.fulfillmentSnapshot || { method: 'pickup' },
    totals: { subtotal: checkout.subtotal, total: checkout.total, currency: checkout.currency },
    status: 'new',
    paymentStatus: 'unpaid',
    fulfillmentStatus: 'unfulfilled',
    timeline: [{ type: 'order:created', actor: user?.name || 'system', note: `Order created from checkout`, timestamp: new Date() }],
  });
  return order;
}

export async function createOrderFromAI({ chat, agent, orderData, paymentProofUrl }) {
  const outletId = chat.currentOutletId || orderData.outletId || orderData.outlet_id || null;
  const workspaceId = chat.workspaceId || agent.workspaceId;
  const orderNumber = await generateOrderNumber(workspaceId);

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
    status: 'new',
    paymentStatus: paymentProofUrl ? 'pending' : 'unpaid',
    paymentProofUrl,
    totals: { subtotal: 0, total: 0, currency: 'IDR' },
    timeline: [{ type: 'order:created', actor: 'ai', note: 'Legacy order from AI', timestamp: new Date() }],
  });
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

export async function transitionOrderStatus({ workspaceId, orderId, newStatus, actor }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  if (!isValidTransition(order.status, newStatus)) {
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

export async function workspaceGetOrder({ workspaceId, orderId }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  return order;
}

export async function sendOrderStatusMessage({ order, messageText, from = 'human' }) {
  const chatId = order.chatId?.id || order.chatId;
  const chat = await chatsRepository.findByIdWithPlatformAndContact(chatId);
  if (!chat?.platformId || !chat?.contactId) return null;

  const platform = chat.platformId;
  const contact = chat.contactId;
  let sentMessageId = null;

  if (platform.type === 'telegram') {
    const result = await tgSend(platform.token, contact.platformAccountId, messageText);
    sentMessageId = result.result?.message_id?.toString();
  } else if (platform.type === 'whatsapp') {
    const result = await waSend(platform.token, platform.phoneNumberId, contact.platformAccountId, messageText);
    sentMessageId = result.messages?.[0]?.id;
  } else if (platform.type === 'instagram') {
    const result = await igSend(platform.token, contact.platformAccountId, messageText);
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

export function resolveOutletName(formData = {}) {
  const outletKey = Object.keys(formData || {}).find((key) => key.toLowerCase().includes('outlet'));
  return outletKey ? formData[outletKey] : '';
}

async function buildOrderTenantQuery(user, outletId) {
  const baseQuery = await buildOutletScopedQuery(user, outletId);
  if (outletId) return baseQuery;
  return baseQuery;
}
