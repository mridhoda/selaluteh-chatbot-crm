import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import {
  deleteOrderForUser, findOrderForUser, listOrdersForUser,
  resolveOutletName, sendOrderStatusMessage, updateOrderForUser,
  workspaceListOrders, workspaceGetOrder, transitionOrderStatus,
  createOrderFromCheckout,
} from '../services/order.service.js';
import { checkoutsRepository } from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/', async (req, res, next) => {
  try {
    const { status, outlet_id, outletId, paymentStatus, search, page, limit, sort } = req.query;
    const oid = outletId || outlet_id;
    const result = await workspaceListOrders({
      workspaceId: req.me.workspaceId, outletId: oid, status, paymentStatus, search, page, limit, sort,
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await workspaceGetOrder({ workspaceId: req.me.workspaceId, orderId: req.params.id });
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
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

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) throw new AppError('VALIDATION', 'status is required', 400);
    const order = await transitionOrderStatus({
      workspaceId: req.me.workspaceId, orderId: req.params.id, newStatus: status, actor: req.me?.name || 'admin',
    });
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.put('/:id/cancel', async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) throw new AppError('VALIDATION', 'Alasan pembatalan harus diisi', 400);
    const order = await transitionOrderStatus({
      workspaceId: req.me.workspaceId, orderId: req.params.id, newStatus: 'cancelled', actor: req.me?.name || 'admin',
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

router.put('/:id', async (req, res, next) => {
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

router.delete('/:id', async (req, res, next) => {
  try {
    const order = await findOrderForUser({ user: req.me, orderId: req.params.id });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    await deleteOrderForUser({ user: req.me, orderId: req.params.id });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
