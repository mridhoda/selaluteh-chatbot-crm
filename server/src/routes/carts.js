import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { cartsRepository } from '../db/repositories/index.js';
import { getCartSummary, addItem, updateQuantity, removeItem, clearCart, getOrCreateActiveCart } from '../services/cart.service.js';
import { AppError } from '../utils/errors.js';
import { parsePagination } from '../utils/pagination.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/', async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const query = { workspaceId: req.me.workspaceId };
    if (status) query.status = status;
    const { skip } = parsePagination({ page, limit });
    const carts = await cartsRepository.list ? await cartsRepository.list({ workspaceId: req.me.workspaceId, status }) : [];
    res.json({ data: carts });
  } catch (err) { next(err); }
});

router.get('/:cartId', async (req, res, next) => {
  try {
    const cart = await cartsRepository.findById({ workspaceId: req.me.workspaceId, cartId: req.params.cartId });
    if (!cart) throw new AppError('NOT_FOUND', 'Cart not found', 404);
    res.json({ data: getCartSummary(cart) || cart });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { outletId, contactId, chatId, platformType } = req.body;
    if (!outletId || !contactId) throw new AppError('VALIDATION', 'outletId and contactId required', 400);
    const cart = await getOrCreateActiveCart({ workspaceId: req.me.workspaceId, outletId, contactId, chatId, platformType });
    res.status(201).json({ data: getCartSummary(cart) });
  } catch (err) { next(err); }
});

router.post('/:cartId/items', async (req, res, next) => {
  try {
    const { productId, quantity, variant, modifiers } = req.body;
    const cart = await cartsRepository.findById({ workspaceId: req.me.workspaceId, cartId: req.params.cartId });
    if (!cart) throw new AppError('NOT_FOUND', 'Cart not found', 404);
    const updated = await addItem({
      workspaceId: req.me.workspaceId,
      outletId: cart.outletId,
      contactId: cart.contactId,
      chatId: cart.chatId,
      platformType: cart.platformType,
      productId, quantity, variant, modifiers,
    });
    res.json({ data: getCartSummary(updated) });
  } catch (err) { next(err); }
});

router.patch('/:cartId/items/:productId', async (req, res, next) => {
  try {
    const updated = await updateQuantity({
      workspaceId: req.me.workspaceId,
      cartId: req.params.cartId,
      productId: req.params.productId,
      quantity: req.body.quantity,
    });
    res.json({ data: getCartSummary(updated) });
  } catch (err) { next(err); }
});

router.delete('/:cartId/items/:productId', async (req, res, next) => {
  try {
    const updated = await removeItem({
      workspaceId: req.me.workspaceId,
      cartId: req.params.cartId,
      productId: req.params.productId,
    });
    res.json({ data: getCartSummary(updated) });
  } catch (err) { next(err); }
});

router.delete('/:cartId', async (req, res, next) => {
  try {
    const updated = await clearCart({ workspaceId: req.me.workspaceId, cartId: req.params.cartId });
    res.json({ data: getCartSummary(updated) });
  } catch (err) { next(err); }
});

export default router;
