import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { canManageWorkspace } from '../services/access-control.service.js';
import { createOutlet, listOutlets, getOutletDetail, updateOutlet, updateOutletStatus, setUserOutletAccess } from '../services/outlet.service.js';
import { outletsSupabaseRepository } from '../db/repositories/index.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/', async (req, res, next) => {
  try {
    const result = await listOutlets({
      user: req.me,
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body?.name) return res.status(400).json({ error: { code: 'VALIDATION', message: 'Outlet name is required' } });
    const outlet = await createOutlet({ user: req.me, payload: req.body });
    res.status(201).json({ data: outlet });
  } catch (err) {
    next(err);
  }
});

router.get('/me/access', async (req, res, next) => {
  try {
    const workspaceId = req.me.workspaceId;
    const userId = req.me.id;
    const access = await outletsSupabaseRepository.listUserAccess({ workspaceId, userId });
    res.json({ allOutlets: canManageWorkspace(req.me), outlets: access });
  } catch (err) {
    next(err);
  }
});

router.get('/users/:userId/access', async (req, res, next) => {
  try {
    if (!canManageWorkspace(req.me)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    const workspaceId = req.me.workspaceId;
    const userId = req.params.userId;
    const access = await outletsSupabaseRepository.listUserAccess({ workspaceId, userId });
    res.json({ data: access });
  } catch (err) {
    next(err);
  }
});

router.put('/users/:userId/access', async (req, res, next) => {
  try {
    const result = await setUserOutletAccess({
      user: req.me,
      targetUserId: req.params.userId,
      outlets: req.body.outlets,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/:outletId', async (req, res, next) => {
  try {
    const outlet = await getOutletDetail({ workspaceId: req.me.workspaceId, outletId: req.params.outletId });
    res.json({ data: outlet });
  } catch (err) {
    next(err);
  }
});

router.put('/:outletId', async (req, res, next) => {
  try {
    const outlet = await updateOutlet({ user: req.me, outletId: req.params.outletId, updates: req.body });
    res.json({ data: outlet });
  } catch (err) {
    next(err);
  }
});

router.patch('/:outletId/status', async (req, res, next) => {
  try {
    const outlet = await updateOutletStatus({ user: req.me, outletId: req.params.outletId, status: req.body.status });
    res.json({ data: outlet });
  } catch (err) {
    next(err);
  }
});

export default router;
