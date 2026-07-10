import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission, requireScopedOutletSelection } from '../middleware/authorization.js';
import { hasEffectivePermission } from '../services/access-control.service.js';
import {
  approveOrder,
  completeOrder,
  getWorkspaceOrderForUser,
  listWorkspaceOrdersForUser,
  markReady,
  startPreparing,
  transitionOrderStatus,
} from '../services/order.service.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

function requestedOutletId(req) {
  return req.body?.outletId || req.body?.outlet_id || req.query?.outletId || req.query?.outlet_id;
}

async function getScopedLifecycleOrder(req) {
  return getWorkspaceOrderForUser({ user: req.me, orderId: req.params.orderId });
}

function lifecycleOutletId(req, order) {
  return requestedOutletId(req) || order?.outletId;
}

export function allowedActions(order = {}, user = null) {
  if (!user || !hasEffectivePermission(user, 'orders', 'manage_status')) return [];
  const capabilities = order.capabilities || {};
  const actions = [];
  if (capabilities.canMarkReady) actions.push('ready');
  if (capabilities.canComplete) actions.push('complete');
  if (capabilities.canCancel) actions.push('cancel');
  return actions;
}

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') ?? null;
}

function isWhatsappChannel(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'whatsapp' || normalized === 'wa';
}

function isPhoneLikeIdentifier(value) {
  const normalized = String(value || '').replace(/[^\d]/g, '');
  return /^(?:62|0)\d{8,15}$/.test(normalized) ? normalized : null;
}

function readContactPhone(contact = {}) {
  const safeContact = contact || {};
  return firstPresent(
    safeContact.phone,
    safeContact.phoneNumber,
    safeContact.phone_number,
    safeContact.phoneMasked,
    safeContact.phone_masked,
    safeContact.whatsapp,
    safeContact.whatsappNumber,
    safeContact.whatsapp_number,
    safeContact.waNumber,
    safeContact.wa_number,
    safeContact.msisdn,
  );
}

function getContact(order = {}) {
  if (order.contactId && typeof order.contactId === 'object') return order.contactId;
  if (order.contact && typeof order.contact === 'object') return order.contact;
  return null;
}

function mapSafeContact(order = {}) {
  const contact = getContact(order);
  if (!contact) return null;
  return {
    id: contact.id || null,
    name: contact.name || contact.displayName || null,
    phone: readContactPhone(contact),
    handle: firstPresent(contact.handle, contact.username, contact.displayHandle, contact.display_handle),
    telegram_id: firstPresent(contact.telegramId, contact.telegram_id, contact.telegramUserId, contact.telegram_user_id),
    external_id: firstPresent(contact.externalId, contact.external_id, contact.providerUserId, contact.provider_user_id),
  };
}

export function mapAdminOrder(order = {}, user = null) {
  const contact = getContact(order);
  const channel = order.channel || order.source || 'online_store';
  const contactExternalId = firstPresent(contact?.externalId, contact?.external_id, contact?.providerUserId, contact?.provider_user_id);
  const phoneLikeExternalId = isPhoneLikeIdentifier(contactExternalId);
  const whatsappExternalId = isWhatsappChannel(channel) ? contactExternalId : null;
  const customerPhone = firstPresent(
    order.customerSnapshot?.phone,
    order.customerSnapshot?.phoneNumber,
    order.customerSnapshot?.phone_number,
    readContactPhone(contact),
    order.customerPhoneSnapshot,
    order.customer_phone_snapshot,
    order.customerSnapshot?.whatsapp,
    order.customerSnapshot?.whatsappNumber,
    order.customerSnapshot?.whatsapp_number,
    order.customerSnapshot?.waNumber,
    order.customerSnapshot?.wa_number,
    order.customerSnapshot?.phoneMasked,
    order.customerSnapshot?.phone_masked,
    order.customerPhoneMaskedSnapshot,
    order.customer_phone_masked_snapshot,
    phoneLikeExternalId,
    whatsappExternalId,
  );

  return {
    id: order.id,
    order_number: order.orderNumber,
    channel,
    outlet: {
      id: order.outletId,
      name: order.outlet?.name || order.outletNameSnapshot || null,
      address: order.outlet?.address || null,
    },
    qr_context: {
      qr_session_id: order.qrSessionId || null,
      location_label: order.qrLocationLabel || null,
      table_id: order.tableId || null,
      qr_scope: firstPresent(order.metadata?.qrScope, order.metadata?.qr_scope),
      qr_type: firstPresent(order.metadata?.qrType, order.metadata?.qr_type),
    },
    customer: {
      name: order.customerSnapshot?.name || order.customerSnapshot?.contactName || order.customerNameSnapshot || null,
      phone: customerPhone,
    },
    customer_phone_snapshot: firstPresent(order.customerPhoneSnapshot, order.customer_phone_snapshot),
    contact: mapSafeContact(order),
    payment_status: order.paymentStatus,
    fulfillment_status: order.fulfillmentStatus,
    fulfillment_type: order.fulfillmentType || 'pickup',
    public_order_status: order.publicOrderStatus,
    total_amount: Number(order.totalAmount || order.totals?.total || 0),
    currency: order.currency || order.totals?.currency || 'IDR',
    items: (order.items || []).map((item) => ({
      id: item.id,
      product_id: item.productId,
      productId: item.productId,
      name: item.productNameSnapshot || item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      unitPrice: item.unitPrice,
      image_url: item.imageUrl || item.image_url || item.metadata?.imageUrl || item.metadata?.image_url || null,
      imageUrl: item.imageUrl || item.image_url || item.metadata?.imageUrl || item.metadata?.image_url || null,
      modifiers: item.metadata?.modifiers || [],
      note: item.metadata?.note || null,
      line_total: item.subtotalAmount || item.subtotal || 0,
    })),
    customer_note: order.fulfillmentSnapshot?.customerNote || order.notes || null,
    status_history: order.timeline || [],
    allowed_actions: allowedActions(order, user),
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

router.get('/', authorizePermission('orders', 'read'), requireScopedOutletSelection((req) => req.query.outletId || req.query.outlet_id, 'outletId is required for outlet-scoped order access'), async (req, res, next) => {
  try {
    const { status, outlet_id, outletId, payment_status, paymentStatus, search, page, limit, chat_id, chatId, contact_id, contactId } = req.query;
    const result = await listWorkspaceOrdersForUser({
      user: req.me,
      outletId: outletId || outlet_id,
      status,
      paymentStatus: paymentStatus || payment_status,
      search,
      page,
      limit,
      chatId: chatId || chat_id,
      contactId: contactId || contact_id,
    });
    const currentPage = parseInt(page, 10) || 1;
    const currentLimit = parseInt(limit, 10) || 20;
    res.json({
      data: result.data.map((order) => mapAdminOrder(order, req.me)),
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total: result.meta.total,
        total_pages: Math.ceil(result.meta.total / currentLimit) || 1,
      },
    });
  } catch (err) { next(err); }
});

router.get('/:orderId', authorizePermission('orders', 'read'), async (req, res, next) => {
  try {
    const order = await getWorkspaceOrderForUser({ user: req.me, orderId: req.params.orderId });
    res.json({ order: mapAdminOrder(order, req.me) });
  } catch (err) { next(err); }
});

router.post('/:orderId/accept', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await approveOrder({ workspaceId: req.me.workspaceId, orderId: req.params.orderId, outletId: lifecycleOutletId(req, scopedOrder), userId: req.me.id });
    res.json({ order: mapAdminOrder(order, req.me) });
  } catch (err) { next(err); }
});

router.post('/:orderId/prepare', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await startPreparing({ workspaceId: req.me.workspaceId, orderId: req.params.orderId, outletId: lifecycleOutletId(req, scopedOrder), userId: req.me.id });
    res.json({ order: mapAdminOrder(order, req.me) });
  } catch (err) { next(err); }
});

router.post('/:orderId/ready', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await markReady({ workspaceId: req.me.workspaceId, orderId: req.params.orderId, outletId: lifecycleOutletId(req, scopedOrder), userId: req.me.id });
    res.json({ order: mapAdminOrder(order, req.me) });
  } catch (err) { next(err); }
});

router.post('/:orderId/complete', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await completeOrder({ workspaceId: req.me.workspaceId, orderId: req.params.orderId, outletId: lifecycleOutletId(req, scopedOrder), userId: req.me.id });
    res.json({ order: mapAdminOrder(order, req.me) });
  } catch (err) { next(err); }
});

router.post('/:orderId/cancel', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await transitionOrderStatus({ workspaceId: req.me.workspaceId, orderId: req.params.orderId, newStatus: 'cancelled', actor: req.me, reason: req.body?.reason, outletId: lifecycleOutletId(req, scopedOrder) });
    res.json({ order: mapAdminOrder(order, req.me) });
  } catch (err) { next(err); }
});

export default router;
