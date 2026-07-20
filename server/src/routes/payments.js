import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission } from '../middleware/authorization.js';
import { providerSyncRateLimit } from '../middleware/rate-limit.js';
import { createPayment, createPaymentSessionForOrder, createXenditPaymentSessionForOrder, getPaymentDetailForUser, listPaymentsForUser, refreshPaymentSession, syncPaymentWithProvider } from '../services/payment.service.js';
import { detectMissingWebhooks, reconcileMissingWebhook, reconcilePayment, batchReconcileByStatus, getNeedsAttentionPayments } from '../services/payment-reconciliation.service.js';
import { AppError } from '../utils/errors.js';
import { ordersRepository, paymentEventsRepository, paymentsRepository } from '../db/repositories/index.js';
import { env } from '../config/env.js';
import { getPaymentRuntimeConfig } from '../services/settings.service.js';

const router = express.Router();

function getPublicWebBaseUrl() {
  const value = env.publicWebBaseUrl || '';
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) return '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

router.all('/return/:kind', async (req, res, next) => {
  const kind = req.params.kind === 'cancel' ? 'cancel' : 'success';
  const isSuccess = kind === 'success';
  try {
    const query = req.query || {};
    const providerInvoice = query.invoice_id || query.invoice || query.payment_id || null;
    const payment = query.merchantReference
      ? await paymentsRepository.findByMerchantReferenceGlobal(String(query.merchantReference))
      : providerInvoice ? await paymentsRepository.findByProviderTransactionId(String(providerInvoice)) : null;
    const order = payment?.orderId
      ? await ordersRepository.workspaceFindById({ workspaceId: payment.workspaceId, orderId: payment.orderId })
      : null;
    const storefrontSlug = query.storefrontSlug || order?.metadata?.publicStorefrontSlug || '';
    const publicOrderToken = query.publicOrderToken || order?.publicOrderToken || '';
    if (payment?.id && publicOrderToken) {
      const webBase = getPublicWebBaseUrl();
      if (webBase) {
        const returnTo = storefrontSlug ? `/store/${encodeURIComponent(storefrontSlug)}` : '/';
        const target = new URL(`${webBase.replace(/\/$/, '')}/store/payment/pending/${encodeURIComponent(payment.id)}`);
        target.searchParams.set('publicOrderToken', publicOrderToken);
        if (storefrontSlug) target.searchParams.set('storefrontSlug', storefrontSlug);
        target.searchParams.set('returnTo', returnTo);
        return res.redirect(303, target.toString());
      }
    }
  } catch (error) {
    return next(error);
  }
  res
    .status(isSuccess ? 200 : 200)
    .type('html')
    .send(`<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${isSuccess ? 'Pembayaran Berhasil' : 'Pembayaran Dibatalkan'}</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; }
      main { width: min(92vw, 420px); padding: 32px; border-radius: 24px; background: white; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12); text-align: center; }
      .mark { width: 64px; height: 64px; margin: 0 auto 18px; display: grid; place-items: center; border-radius: 999px; background: ${isSuccess ? '#dcfce7' : '#fee2e2'}; color: ${isSuccess ? '#15803d' : '#b91c1c'}; font-size: 34px; font-weight: 800; }
      h1 { margin: 0 0 10px; font-size: 24px; }
      p { margin: 0; line-height: 1.6; color: #475569; }
    </style>
  </head>
  <body>
    <main>
      <div class="mark">${isSuccess ? '✓' : '!'}</div>
      <h1>${isSuccess ? 'Pembayaran berhasil' : 'Pembayaran dibatalkan'}</h1>
      <p>${isSuccess ? 'Terima kasih. Pembayaran kamu sedang kami verifikasi dan status pesanan akan diperbarui otomatis.' : 'Pembayaran belum selesai. Silakan kembali ke link pembayaran jika ingin mencoba lagi.'}</p>
    </main>
  </body>
</html>`);
});

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/gateway/config', authorizePermission('payments', 'read'), async (req, res, next) => {
  try {
    const runtime = await getPaymentRuntimeConfig({ workspaceId: req.me.workspaceId });
    const provider = runtime.provider;
    const environment = runtime.environment;
    const configured = runtime.configured;
    const webhookPath = provider === 'doku'
      ? '/webhook/doku'
      : provider === 'bayargg'
        ? '/webhook/bayargg'
        : '/webhook/xendit/payment-sessions';
    res.json({
      data: {
        provider,
        environment,
        configured,
        publicBaseUrl: env.publicBaseUrl || '',
        webhookUrl: env.publicBaseUrl ? `${env.publicBaseUrl}${webhookPath}` : webhookPath,
      },
    });
  } catch (err) { next(err); }
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

router.post('/orders/:orderId/session', authorizePermission('payments', 'write'), async (req, res, next) => {
  try {
    const payment = await createPaymentSessionForOrder({
      user: req.me,
      workspaceId: req.me.workspaceId,
      orderId: req.params.orderId,
      provider: req.body?.provider,
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
