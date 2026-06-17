import express from 'express';
import mongoose from 'mongoose';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { canManageWorkspace } from '../services/access-control.service.js';
import { platformsRepository } from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/', async (req, res, next) => {
  try {
    const platforms = await platformsRepository.list({ workspaceId: req.me.workspaceId });
    res.json({ data: platforms });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new AppError('VALIDATION', 'Invalid platform id', 400);
    const platform = await platformsRepository.findById({ workspaceId: req.me.workspaceId, platformId: req.params.id });
    if (!platform) throw new AppError('NOT_FOUND', 'Platform not found', 404);
    res.json({ data: platform });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body.type || !req.body.label) throw new AppError('VALIDATION', 'Missing type or label', 400);
    if (!canManageWorkspace(req.me)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    const platform = await platformsRepository.create({
      workspaceId: req.me.workspaceId,
      userId: req.me._id,
      payload: req.body,
    });
    res.status(201).json({ data: platform });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new AppError('VALIDATION', 'Invalid platform id', 400);
    if (!canManageWorkspace(req.me)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    const platform = await platformsRepository.update({
      workspaceId: req.me.workspaceId,
      platformId: req.params.id,
      updates: req.body,
    });
    if (!platform) throw new AppError('NOT_FOUND', 'Platform not found', 404);
    res.json({ data: platform });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new AppError('VALIDATION', 'Invalid platform id', 400);
    if (!canManageWorkspace(req.me)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    const deleted = await platformsRepository.remove({ workspaceId: req.me.workspaceId, platformId: req.params.id });
    if (!deleted) throw new AppError('NOT_FOUND', 'Platform not found', 404);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
