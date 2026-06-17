import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { createPayment, getPaymentDetail, listPayments, syncPaymentWithProvider } from '../services/payment.service.js';
import { AppError } from '../utils/errors.js';
import { paymentEventsRepository } from '../db/repositories/index.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.post('/', async (req, res, next) => {
  try {
    const { orderId, amount, currency, customer, paymentMethod } = req.body;
    if (!orderId) throw new AppError('VALIDATION', 'orderId is required', 400);
    const payment = await createPayment({
      workspaceId: req.me.workspaceId,
      outletId: req.body.outletId,
      orderId, amount, currency, customer, paymentMethod,
    });
    res.status(201).json({ data: payment });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const result = await listPayments({
      workspaceId: req.me.workspaceId,
      orderId: req.query.orderId,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:paymentId', async (req, res, next) => {
  try {
    const payment = await getPaymentDetail({ workspaceId: req.me.workspaceId, paymentId: req.params.paymentId });
    res.json({ data: payment });
  } catch (err) { next(err); }
});

router.get('/:paymentId/events', async (req, res, next) => {
  try {
    await getPaymentDetail({ workspaceId: req.me.workspaceId, paymentId: req.params.paymentId });
    const events = await paymentEventsRepository.findByPayment({
      workspaceId: req.me.workspaceId,
      paymentId: req.params.paymentId,
    });
    res.json({ data: events });
  } catch (err) { next(err); }
});

router.post('/:paymentId/sync', async (req, res, next) => {
  try {
    const payment = await syncPaymentWithProvider({ workspaceId: req.me.workspaceId, paymentId: req.params.paymentId });
    res.json({ data: payment });
  } catch (err) { next(err); }
});

export default router;
