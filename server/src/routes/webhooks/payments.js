import express from 'express';
import { processXenditPaymentSessionWebhook } from '../../services/payment-webhook.service.js';
import { assertWebhookPayloadSafe } from '../../security/webhook-security.js';

const router = express.Router();

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
