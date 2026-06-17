import express from 'express';
import UserOutletAccess from '../models/UserOutletAccess.js';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { canManageWorkspace } from '../services/access-control.service.js';
import { setUserOutletAccess } from '../services/outlet.service.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/me/outlet-access', async (req, res, next) => {
  try {
    const access = await UserOutletAccess.find({ workspaceId: req.me.workspaceId, userId: req.me._id, status: 'active' })
      .populate('outletId', 'name code city status')
      .sort({ createdAt: -1 });
    res.json({ allOutlets: canManageWorkspace(req.me), outlets: access });
  } catch (err) {
    next(err);
  }
});

router.get('/users/:userId/outlet-access', async (req, res, next) => {
  try {
    if (!canManageWorkspace(req.me)) return res.status(403).json({ error: 'Forbidden' });
    const access = await UserOutletAccess.find({ workspaceId: req.me.workspaceId, userId: req.params.userId })
      .populate('outletId', 'name code city status')
      .sort({ createdAt: -1 });
    res.json(access);
  } catch (err) {
    next(err);
  }
});

router.put('/users/:userId/outlet-access', async (req, res, next) => {
  try {
    const rows = await setUserOutletAccess({
      user: req.me,
      targetUserId: req.params.userId,
      outlets: req.body.outlets,
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
