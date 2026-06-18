/**
 * routes/workspaces.js — Supabase-backed (task 24.7)
 *
 * Workspace CRUD API using workspace.service.js (Supabase-backed).
 * Uses req.me.id (UUID).
 */

import { Router } from 'express';
import {
  getCurrentWorkspace,
  listUserWorkspaces,
  getWorkspaceDetail,
  updateWorkspace,
} from '../services/workspace.service.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';

const router = Router();

/**
 * GET /workspaces/current
 *
 * Get the active workspace from context (requires membership).
 */
router.get('/current', attachWorkspaceContext, async (req, res, next) => {
  try {
    const workspace = await getCurrentWorkspace({ workspaceId: req.workspace.id });
    res.json({ data: workspace });
  } catch (err) { next(err); }
});

/**
 * GET /workspaces
 *
 * List all workspaces the authenticated user is a member of.
 */
router.get('/', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const workspaces = await listUserWorkspaces({ userId: req.me.id });
    res.json({ data: workspaces });
  } catch (err) { next(err); }
});

/**
 * GET /workspaces/:workspaceId
 *
 * Get a specific workspace if user is a member.
 */
router.get('/:workspaceId', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const workspace = await getWorkspaceDetail({
      workspaceId: req.params.workspaceId,
      userId: req.me.id,
    });
    res.json({ data: workspace });
  } catch (err) { next(err); }
});

/**
 * PATCH /workspaces/:workspaceId
 *
 * Update workspace name/metadata (owner or admin only).
 */
router.patch('/:workspaceId', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const workspace = await updateWorkspace({
      workspaceId: req.params.workspaceId,
      userId: req.me.id,
      updates: req.body,
    });
    res.json({ data: workspace });
  } catch (err) { next(err); }
});

export default router;
