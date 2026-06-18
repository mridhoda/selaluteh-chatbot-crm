import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { createCheckout, confirmCheckout, getCheckoutDetail } from '../services/checkout.service.js';
import { AppError } from '../utils/errors.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.post('/', async (req, res, next) => {
  try {
    const { outletId, contactId, chatId, idempotencyKey, customerSnapshot, fulfillmentSnapshot } = req.body;
    if (!outletId) throw new AppError('VALIDATION', 'outletId is required', 400);
    const checkout = await createCheckout({
      workspaceId: req.me.workspaceId, outletId, contactId, chatId, idempotencyKey, customerSnapshot, fulfillmentSnapshot,
    });
    res.status(201).json({ data: checkout });
  } catch (err) { next(err); }
});

router.get('/:checkoutId', async (req, res, next) => {
  try {
    const checkout = await getCheckoutDetail({ workspaceId: req.me.workspaceId, checkoutId: req.params.checkoutId });
    res.json({ data: checkout });
  } catch (err) { next(err); }
});

router.post('/:checkoutId/confirm', async (req, res, next) => {
  try {
    const checkout = await confirmCheckout({ workspaceId: req.me.workspaceId, checkoutId: req.params.checkoutId });
    res.json({ data: checkout });
  } catch (err) { next(err); }
});

export default router;
