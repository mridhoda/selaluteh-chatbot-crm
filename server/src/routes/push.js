import { Router } from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import {
  disableWebPushSubscription,
  getWebPushPublicConfig,
  saveWebPushSubscription,
} from '../services/web-push.service.js';

const router = Router();

router.get('/public-key', (_req, res) => {
  res.json(getWebPushPublicConfig());
});

router.post('/subscriptions', authRequired, attachUser, attachWorkspaceContext, async (req, res, next) => {
  try {
    const row = await saveWebPushSubscription({
      workspaceId: req.me.workspaceId,
      userId: req.me.id,
      subscription: req.body?.subscription || req.body,
      userAgent: req.get('user-agent'),
    });
    res.status(201).json({ data: { id: row.id, status: row.status } });
  } catch (err) {
    next(err);
  }
});

router.delete('/subscriptions', authRequired, attachUser, attachWorkspaceContext, async (req, res, next) => {
  try {
    await disableWebPushSubscription({ endpoint: req.body?.endpoint, userId: req.me.id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
