import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission } from '../middleware/authorization.js';
import { providerSyncRateLimit } from '../middleware/rate-limit.js';
import { createPayment, createXenditPaymentSessionForOrder, getPaymentDetailForUser, listPaymentsForUser, refreshPaymentSession, syncPaymentWithProvider } from '../services/payment.service.js';
import { detectMissingWebhooks, reconcileMissingWebhook, reconcilePayment, batchReconcileByStatus, getNeedsAttentionPayments } from '../services/payment-reconciliation.service.js';
import { AppError } from '../utils/errors.js';
import { paymentEventsRepository } from '../db/repositories/index.js';
import { env } from '../config/env.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/gateway/config', authorizePermission('payments', 'read'), async (req, res) => {
  res.json({
    data: {
      provider: 'xendit',
      environment: 'test',
      configured: env.paymentProvider === 'xendit' && Boolean(env.xenditSecretApiKey),
    },
  });
});

router.post('/orders/:orderId/xendit/session', authorizePermission('payments', 'write'), async (req, res, next) => {
  try {
    const payment = await createXenditPaymentSessionForOrder({
      user: req.me,
      workspaceId: req.me.workspaceId,
      orderId: req.params.orderId,
      customer: req.body?.customer || {},
      idempotencyKey: req.get('Idempotency-Key') || req.body?.idempotencyKey,
    });
    res.status(201).json({ data: payment });
  } catch (err) { next(err); }
});

router.post('/', authorizePermission('payments', 'write'), async (req, res, next) => {
  try {
    const { orderId, amount, currency, customer, paymentMethod } = req.body;
    if (!orderId) throw new AppError('VALIDATION', 'orderId is required', 400);
    const payment = await createPayment({
      user: req.me,
      workspaceId: req.me.workspaceId,
      outletId: req.body.outletId,
      orderId, amount, currency, customer, paymentMethod,
    });
    res.status(201).json({ data: payment });
  } catch (err) { next(err); }
});

router.get('/', authorizePermission('payments', 'read'), async (req, res, next) => {
  try {
    const result = await listPaymentsForUser({
      user: req.me,
      orderId: req.query.orderId,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:paymentId', authorizePermission('payments', 'read'), async (req, res, next) => {
  try {
    const payment = await getPaymentDetailForUser({ user: req.me, paymentId: req.params.paymentId });
    res.json({ data: payment });
  } catch (err) { next(err); }
});

router.get('/:paymentId/events', authorizePermission('payments', 'read'), async (req, res, next) => {
  try {
    await getPaymentDetailForUser({ user: req.me, paymentId: req.params.paymentId });
    const events = await paymentEventsRepository.findByPayment({
      workspaceId: req.me.workspaceId,
      paymentId: req.params.paymentId,
    });
    res.json({ data: events });
  } catch (err) { next(err); }
});

router.post('/:paymentId/sync', authorizePermission('payments', 'sync'), providerSyncRateLimit, async (req, res, next) => {
  try {
    await getPaymentDetailForUser({ user: req.me, paymentId: req.params.paymentId });
    const payment = await syncPaymentWithProvider({ workspaceId: req.me.workspaceId, paymentId: req.params.paymentId });
    res.json({ data: payment });
  } catch (err) { next(err); }
});

router.post('/:paymentId/refresh', authorizePermission('payments', 'sync'), providerSyncRateLimit, async (req, res, next) => {
  try {
    const payment = await refreshPaymentSession({ user: req.me, workspaceId: req.me.workspaceId, paymentId: req.params.paymentId });
    res.json({ data: payment });
  } catch (err) { next(err); }
});

router.get('/reconciliation/missing-webhooks', authorizePermission('payments', 'reconcile'), async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await detectMissingWebhooks({ workspaceId: req.me.workspaceId, limit });
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/reconciliation/missing-webhooks/:paymentId', authorizePermission('payments', 'reconcile'), providerSyncRateLimit, async (req, res, next) => {
  try {
    const payment = await reconcileMissingWebhook({ workspaceId: req.me.workspaceId, paymentId: req.params.paymentId });
    res.json({ data: payment });
  } catch (err) { next(err); }
});

router.get('/reconciliation/needs-attention', authorizePermission('payments', 'reconcile'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await getNeedsAttentionPayments({ workspaceId: req.me.workspaceId, page, limit });
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/reconciliation/batch', authorizePermission('payments', 'reconcile'), providerSyncRateLimit, async (req, res, next) => {
  try {
    const { status, newStatus } = req.body;
    if (!status || !newStatus) {
      throw new AppError('VALIDATION', 'status and newStatus are required', 400);
    }
    const results = await batchReconcileByStatus({ workspaceId: req.me.workspaceId, status, newStatus });
    res.json({ data: results, meta: { processed: results.length } });
  } catch (err) { next(err); }
});

router.post('/reconciliation/:paymentId', authorizePermission('payments', 'reconcile'), providerSyncRateLimit, async (req, res, next) => {
  try {
    const { providerStatus } = req.body;
    if (!providerStatus) {
      throw new AppError('VALIDATION', 'providerStatus is required', 400);
    }
    const payment = await reconcilePayment({ workspaceId: req.me.workspaceId, paymentId: req.params.paymentId, providerStatus });
    res.json({ data: payment });
  } catch (err) { next(err); }
});

export default router;
