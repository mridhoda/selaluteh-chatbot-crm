/**
 * platforms.js — Supabase-backed (task 24.9 complete)
 *
 * Platform management routes.
 * Migrated from Mongoose to platformsSupabaseRepository.
 * UUID params validated with native UUID regex, not Mongoose ObjectId.
 */

import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { canManageWorkspace } from '../services/access-control.service.js';
import { platformsSupabaseRepository } from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id) => UUID_RE.test(id);

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/', async (req, res, next) => {
  try {
    const platforms = await platformsSupabaseRepository.list({ workspaceId: req.me.workspaceId });
    res.json(platforms);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) throw new AppError('VALIDATION', 'Invalid platform id', 400);
    const platform = await platformsSupabaseRepository.findById({ workspaceId: req.me.workspaceId, platformId: req.params.id });
    if (!platform) throw new AppError('NOT_FOUND', 'Platform not found', 404);
    res.json(platform);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body.type || !req.body.label) throw new AppError('VALIDATION', 'Missing type or label', 400);
    if (!canManageWorkspace(req.me)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    const platform = await platformsSupabaseRepository.create({
      workspaceId: req.me.workspaceId,
      userId: req.me.id,
      payload: req.body,
    });
    res.status(201).json(platform);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) throw new AppError('VALIDATION', 'Invalid platform id', 400);
    if (!canManageWorkspace(req.me)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    const platform = await platformsSupabaseRepository.update({
      workspaceId: req.me.workspaceId,
      platformId: req.params.id,
      updates: req.body,
    });
    if (!platform) throw new AppError('NOT_FOUND', 'Platform not found', 404);
    res.json(platform);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) throw new AppError('VALIDATION', 'Invalid platform id', 400);
    if (!canManageWorkspace(req.me)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    const deleted = await platformsSupabaseRepository.remove({ workspaceId: req.me.workspaceId, platformId: req.params.id });
    if (!deleted) throw new AppError('NOT_FOUND', 'Platform not found', 404);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
