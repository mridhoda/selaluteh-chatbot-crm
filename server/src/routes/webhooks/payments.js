import express from 'express';
import { processBayarGgWebhook, processDokuCheckoutWebhook, processPaymentWebhook, processXenditPaymentSessionWebhook } from '../../services/payment-webhook.service.js';
import { assertWebhookPayloadSafe } from '../../security/webhook-security.js';

const router = express.Router();

async function handleDokuWebhook(req, res, next) {
  try {
    if (req.path === '/' && !String(req.baseUrl || '').endsWith('/doku')) return next('route');
    assertWebhookPayloadSafe(req.body);
    const result = await processDokuCheckoutWebhook({
      rawBody: req.rawBody || req.body,
      headers: req.headers,
      requestTarget: '/webhook/doku',
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function handleBayarGgWebhook(req, res, next) {
  try {
    if (req.path === '/' && !String(req.baseUrl || '').endsWith('/bayargg')) return next('route');
    assertWebhookPayloadSafe(req.body);
    const result = await processBayarGgWebhook({
      rawBody: req.rawBody || req.body,
      headers: req.headers,
    });
    res.json(result);
  } catch (err) { next(err); }
}

router.post('/', handleDokuWebhook);
router.post('/doku', handleDokuWebhook);
router.post('/', handleBayarGgWebhook);
router.post('/bayargg', handleBayarGgWebhook);

router.post('/xendit', async (req, res, next) => {
  try {
    assertWebhookPayloadSafe(req.body);
    const result = await processPaymentWebhook({
      workspaceId: req.query.workspace_id || req.body?.workspace_id,
      provider: 'xendit',
      rawBody: req.body,
      headers: req.headers,
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/xendit/payment-sessions', async (req, res, next) => {
  try {
    assertWebhookPayloadSafe(req.body);
    const result = await processXenditPaymentSessionWebhook({
      rawBody: req.body,
      headers: req.headers,
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/payment-sessions', async (req, res, next) => {
  try {
    assertWebhookPayloadSafe(req.body);
    const result = await processXenditPaymentSessionWebhook({
      rawBody: req.body,
      headers: req.headers,
    });
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
