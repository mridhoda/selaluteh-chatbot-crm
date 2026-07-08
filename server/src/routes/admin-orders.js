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
  if (capabilities.canAccept) actions.push('accept_order');
  if (capabilities.canStartPreparing) actions.push('mark_preparing');
  if (capabilities.canMarkReady) actions.push('mark_ready');
  if (capabilities.canComplete) actions.push('mark_completed');
  if (capabilities.canCancel) actions.push('cancel_order');
  return actions;
}

export function mapAdminOrder(order = {}, user = null) {
  return {
    id: order.id,
    order_number: order.orderNumber,
    channel: order.channel || order.source || 'online_store',
    outlet: {
      id: order.outletId,
      name: order.outlet?.name || order.outletNameSnapshot || null,
      address: order.outlet?.address || null,
    },
    qr_context: {
      qr_session_id: order.qrSessionId || null,
      location_label: order.qrLocationLabel || null,
      table_id: order.tableId || null,
    },
    customer: {
      name: order.customerSnapshot?.name || order.customerSnapshot?.contactName || order.customerNameSnapshot || null,
      phone: order.customerSnapshot?.phone || order.customerPhoneSnapshot || null,
    },
    payment_status: order.paymentStatus,
    fulfillment_status: order.fulfillmentStatus,
    fulfillment_type: order.fulfillmentType || 'pickup',
    public_order_status: order.publicOrderStatus,
    total_amount: Number(order.totalAmount || order.totals?.total || 0),
    currency: order.currency || order.totals?.currency || 'IDR',
    items: (order.items || []).map((item) => ({
      name: item.productNameSnapshot || item.name,
      quantity: item.quantity,
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
