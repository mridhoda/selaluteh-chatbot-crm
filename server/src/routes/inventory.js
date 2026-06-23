import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission, requireManyOutletAccessFrom, requireOutletAccessFrom, requireScopedOutletSelection } from '../middleware/authorization.js';
import {
  listInventoryForUser, getStockForUser, adjustStock, reserveStock, releaseStock, consumeStock, returnStock, transferStock, getMovementsForUser, assertInventoryOutletAccess,
} from '../services/inventory.service.js';
import { AppError } from '../utils/errors.js';

const router = express.Router();
router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/', authorizePermission('inventory', 'read'), requireScopedOutletSelection((req) => req.query.outletId, 'outletId is required for outlet-scoped inventory access'), async (req, res, next) => {
  try {
    const result = await listInventoryForUser({
      user: req.me,
      outletId: req.query.outletId,
      status: req.query.status,
      lowStockOnly: req.query.lowStockOnly === 'true',
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:productId', authorizePermission('inventory', 'read'), requireScopedOutletSelection((req) => req.query.outletId, 'outletId is required for outlet-scoped inventory access'), async (req, res, next) => {
  try {
    const item = await getStockForUser({ user: req.me, outletId: req.query.outletId, productId: req.params.productId });
    res.json({ data: item });
  } catch (err) { next(err); }
});

router.post('/:productId/adjust', authorizePermission('inventory', 'write'), requireOutletAccessFrom((req) => req.body.outletId, 'body.outletId'), async (req, res, next) => {
  try {
    const result = await adjustStock({
      workspaceId: req.me.workspaceId,
      outletId: req.body.outletId,
      productId: req.params.productId,
      variant: req.body.variant,
      delta: req.body.delta,
      reason: req.body.reason,
      notes: req.body.notes,
      userId: req.me.id,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/:productId/reserve', authorizePermission('inventory', 'write'), requireOutletAccessFrom((req) => req.body.outletId, 'body.outletId'), async (req, res, next) => {
  try {
    const result = await reserveStock({
      workspaceId: req.me.workspaceId,
      outletId: req.body.outletId,
      productId: req.params.productId,
      variant: req.body.variant,
      quantity: req.body.quantity,
      orderId: req.body.orderId,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/:productId/release', authorizePermission('inventory', 'write'), requireOutletAccessFrom((req) => req.body.outletId, 'body.outletId'), async (req, res, next) => {
  try {
    const result = await releaseStock({
      workspaceId: req.me.workspaceId,
      outletId: req.body.outletId,
      productId: req.params.productId,
      variant: req.body.variant,
      quantity: req.body.quantity,
      orderId: req.body.orderId,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/:productId/consume', authorizePermission('inventory', 'write'), requireOutletAccessFrom((req) => req.body.outletId, 'body.outletId'), async (req, res, next) => {
  try {
    const result = await consumeStock({
      workspaceId: req.me.workspaceId,
      outletId: req.body.outletId,
      productId: req.params.productId,
      variant: req.body.variant,
      quantity: req.body.quantity,
      orderId: req.body.orderId,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/:productId/return', authorizePermission('inventory', 'write'), requireOutletAccessFrom((req) => req.body.outletId, 'body.outletId'), async (req, res, next) => {
  try {
    const result = await returnStock({
      workspaceId: req.me.workspaceId,
      outletId: req.body.outletId,
      productId: req.params.productId,
      variant: req.body.variant,
      quantity: req.body.quantity,
      orderId: req.body.orderId,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/transfer', authorizePermission('inventory', 'transfer'), requireManyOutletAccessFrom((req) => [req.body.fromOutletId, req.body.toOutletId], 'body.transferOutletIds'), async (req, res, next) => {
  try {
    const result = await transferStock({
      workspaceId: req.me.workspaceId,
      fromOutletId: req.body.fromOutletId,
      toOutletId: req.body.toOutletId,
      productId: req.body.productId,
      variant: req.body.variant,
      quantity: req.body.quantity,
      userId: req.me.id,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get('/:productId/movements', authorizePermission('inventory', 'read'), requireScopedOutletSelection((req) => req.query.outletId, 'outletId is required for outlet-scoped inventory access'), async (req, res, next) => {
  try {
    const result = await getMovementsForUser({
      user: req.me,
      outletId: req.query.outletId,
      productId: req.params.productId,
      reason: req.query.reason,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
