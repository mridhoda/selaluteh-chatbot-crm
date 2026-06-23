import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { listAuditLogs } from '../services/audit.service.js';

const router = express.Router();
router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/logs', async (req, res, next) => {
  try {
    const result = await listAuditLogs({
      workspaceId: req.me.workspaceId,
      action: req.query.action,
      resourceType: req.query.resourceType,
      resourceId: req.query.resourceId,
      outletId: req.query.outletId,
      actorId: req.query.actorId,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
