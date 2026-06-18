import express from 'express';
import { processPaymentWebhook } from '../../services/payment-webhook.service.js';

const router = express.Router();

router.post('/midtrans', async (req, res, next) => {
  try {
    const result = await processPaymentWebhook({
      workspaceId: req.query.workspace_id || req.body?.workspace_id,
      provider: 'midtrans',
      rawBody: req.body,
      headers: req.headers,
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/xendit', async (req, res, next) => {
  try {
    const result = await processPaymentWebhook({
      workspaceId: req.query.workspace_id || req.body?.workspace_id,
      provider: 'xendit',
      rawBody: req.body,
      headers: req.headers,
    });
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
