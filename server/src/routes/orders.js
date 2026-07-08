import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission, requireOutletAccessFrom, requireScopedOutletSelection } from '../middleware/authorization.js';
import {
  resolveOutletName, sendOrderStatusMessage, updateOrderForUser,
  listWorkspaceOrdersForUser, getWorkspaceOrderForUser, transitionOrderStatus,
  createOrderFromCheckout, approveOrder, rejectOrder, startPreparing, markReady, completeOrder,
} from '../services/order.service.js';
import { checkoutsRepository } from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';
import { createPaymentSessionForOrder, createXenditPaymentSessionForOrder } from '../services/payment.service.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

function requestedOutletId(req) {
  return req.body?.outletId || req.body?.outlet_id || req.query?.outletId || req.query?.outlet_id;
}

async function getScopedLifecycleOrder(req) {
  return getWorkspaceOrderForUser({ user: req.me, orderId: req.params.id });
}

function lifecycleOutletId(req, order) {
  return requestedOutletId(req) || order?.outletId;
}

router.get('/', authorizePermission('orders', 'read'), requireScopedOutletSelection((req) => req.query.outletId || req.query.outlet_id, 'outletId is required for outlet-scoped order access'), async (req, res, next) => {
  try {
    const { status, outlet_id, outletId, paymentStatus, search, page, limit, sort, chat_id, chatId, contact_id, contactId } = req.query;
    const oid = outletId || outlet_id;
    const cid = chatId || chat_id;
    const contId = contactId || contact_id;
    const result = await listWorkspaceOrdersForUser({
      user: req.me, outletId: oid, status, paymentStatus, search, page, limit, sort, chatId: cid, contactId: contId,
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id', authorizePermission('orders', 'read'), async (req, res, next) => {
  try {
    const order = await getWorkspaceOrderForUser({ user: req.me, orderId: req.params.id });
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.post('/:id/payments/xendit/session', authorizePermission('orders', 'write'), async (req, res, next) => {
  try {
    const payment = await createXenditPaymentSessionForOrder({
      user: req.me,
      workspaceId: req.me.workspaceId,
      orderId: req.params.id,
      customer: req.body?.customer || {},
      idempotencyKey: req.get('Idempotency-Key') || req.body?.idempotencyKey,
    });
    res.status(201).json({ data: payment });
  } catch (err) { next(err); }
});

router.post('/:id/payments/session', authorizePermission('orders', 'write'), async (req, res, next) => {
  try {
    const payment = await createPaymentSessionForOrder({
      user: req.me,
      workspaceId: req.me.workspaceId,
      orderId: req.params.id,
      provider: req.body?.provider,
      customer: req.body?.customer || {},
      idempotencyKey: req.get('Idempotency-Key') || req.body?.idempotencyKey,
    });
    res.status(201).json({ data: payment });
  } catch (err) { next(err); }
});

router.post('/', authorizePermission('orders', 'write'), async (req, res, next) => {
  try {
    const { checkoutId } = req.body;
    if (!checkoutId) throw new AppError('VALIDATION', 'checkoutId is required', 400);
    const checkout = await checkoutsRepository.findById({ workspaceId: req.me.workspaceId, checkoutId });
    if (!checkout) throw new AppError('NOT_FOUND', 'Checkout not found', 404);
    if (checkout.status !== 'confirmed') throw new AppError('INVALID_STATE', 'Checkout must be confirmed first', 409);
    const order = await createOrderFromCheckout({ workspaceId: req.me.workspaceId, checkout, user: req.me });
    await checkoutsRepository.updateStatus({ workspaceId: req.me.workspaceId, checkoutId, status: 'converted' });
    res.status(201).json({ data: order });
  } catch (err) { next(err); }
});

router.patch('/:id/status', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) throw new AppError('VALIDATION', 'status is required', 400);
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await transitionOrderStatus({
      workspaceId: req.me.workspaceId, orderId: req.params.id, newStatus: status, actor: req.me, outletId: lifecycleOutletId(req, scopedOrder),
    });
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.put('/:id/cancel', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) throw new AppError('VALIDATION', 'Alasan pembatalan harus diisi', 400);
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await transitionOrderStatus({
      workspaceId: req.me.workspaceId, orderId: req.params.id, newStatus: 'cancelled', actor: req.me, reason, outletId: lifecycleOutletId(req, scopedOrder),
    });
    try {
      const msg = `Maaf, pesanan Anda dibatalkan.\nAlasan: ${reason}\n\nSilakan hubungi kami jika ada pertanyaan.`;
      await sendOrderStatusMessage({ order, messageText: msg, from: 'human' });
    } catch (msgErr) {
      console.error('Failed to send cancellation message:', msgErr);
    }
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.post('/:id/cancel', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) throw new AppError('VALIDATION', 'Alasan pembatalan harus diisi', 400);
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await transitionOrderStatus({
      workspaceId: req.me.workspaceId, orderId: req.params.id, newStatus: 'cancelled', actor: req.me, reason, outletId: lifecycleOutletId(req, scopedOrder),
    });
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.post('/:id/accept', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await approveOrder({ workspaceId: req.me.workspaceId, orderId: req.params.id, outletId: lifecycleOutletId(req, scopedOrder), userId: req.me.id });
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.post('/:id/reject', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await rejectOrder({ workspaceId: req.me.workspaceId, orderId: req.params.id, outletId: lifecycleOutletId(req, scopedOrder), userId: req.me.id, reason: req.body?.reason });
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.post('/:id/start-preparing', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await startPreparing({ workspaceId: req.me.workspaceId, orderId: req.params.id, outletId: lifecycleOutletId(req, scopedOrder), userId: req.me.id });
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.post('/:id/mark-ready', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await markReady({ workspaceId: req.me.workspaceId, orderId: req.params.id, outletId: lifecycleOutletId(req, scopedOrder), userId: req.me.id });
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.post('/:id/complete', authorizePermission('orders', 'manage_status'), async (req, res, next) => {
  try {
    const scopedOrder = await getScopedLifecycleOrder(req);
    const order = await completeOrder({ workspaceId: req.me.workspaceId, orderId: req.params.id, outletId: lifecycleOutletId(req, scopedOrder), userId: req.me.id });
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.put('/:id', authorizePermission('orders', 'write'), async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const update = {};
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;
    const order = await updateOrderForUser({ user: req.me, orderId: req.params.id, update });
    if (!order) throw new AppError('NOT_FOUND', 'Order tidak ditemukan', 404);
    if (status === 'processed' && order) {
      try {
        const outletName = order.outletNameSnapshot || resolveOutletName(order.formData) || 'Kami';
        await sendOrderStatusMessage({ order, messageText: `Baik pesanan anda sudah di terima di ${outletName}`, from: 'ai' });
      } catch (msgErr) {
        console.error('Failed to send confirmation message:', msgErr);
      }
    }
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.delete('/:id', authorizePermission('orders', 'write'), async (req, res, next) => {
  try {
    res.status(405).json({ error: { code: 'ORDER_DELETE_DISABLED', message: 'Order deletion is disabled. Cancel the order with a reason instead.' } });
  } catch (err) { next(err); }
});

export default router;
