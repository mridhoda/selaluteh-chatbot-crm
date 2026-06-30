/**
 * routes/memberships.js — Supabase-backed (task 24.7)
 *
 * Workspace membership management API.
 * Uses membershipsSupabaseRepository (Supabase-backed).
 *
 * All user IDs are UUID strings (not Mongoose ObjectIds).
 */

import { Router } from 'express';
import { membershipsSupabaseRepository } from '../db/repositories/memberships.repository.js';
import { assertRolePermission } from '../services/access-control.service.js';
import { AppError } from '../utils/errors.js';
import { authRequired, attachUser } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(authRequired, attachUser);

/**
 * GET /api/workspaces/:workspaceId/members
 *
 * List all members of a workspace.
 * Requires: owner, admin, or outlet_manager role.
 */
router.get('/', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const { workspaceId } = req.params;
    await assertRolePermission({
      userId: req.me.id,
      workspaceId,
      requiredRoles: ['owner', 'admin', 'outlet_manager'],
    });
    const members = await membershipsSupabaseRepository.listWorkspaceMembers({ workspaceId });
    res.json({ data: members });
  } catch (err) { next(err); }
});

/**
 * POST /api/workspaces/:workspaceId/members
 *
 * Add a member to a workspace.
 * Requires: owner or admin role.
 */
router.post('/', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const { workspaceId } = req.params;
    await assertRolePermission({
      userId: req.me.id,
      workspaceId,
      requiredRoles: ['owner', 'admin'],
    });
    const { userId, role } = req.body;
    if (!userId) throw new AppError('VALIDATION', 'userId is required', 400);
    const membership = await membershipsSupabaseRepository.createMembership({
      workspaceId,
      userId,
      role: role || 'human_agent',
      status: 'active',
    });
    res.status(201).json({ data: membership });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/workspaces/:workspaceId/members/:userId
 *
 * Update a member's role.
 * Requires: owner or admin role.
 */
router.patch('/:userId', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const { workspaceId, userId } = req.params;
    await assertRolePermission({
      userId: req.me.id,
      workspaceId,
      requiredRoles: ['owner', 'admin'],
    });
    const { role } = req.body;
    if (!role) throw new AppError('VALIDATION', 'role is required', 400);
    const membership = await membershipsSupabaseRepository.updateRole({ userId, workspaceId, role });
    if (!membership) throw new AppError('NOT_FOUND', 'Membership not found', 404);
    res.json({ data: membership });
  } catch (err) { next(err); }
});

/**
 * PUT /api/workspaces/:workspaceId/members/:userId/access-policy
 *
 * Update a member's custom module permission matrix.
 * Requires: owner or admin role.
 */
router.put('/:userId/access-policy', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const { workspaceId, userId } = req.params;
    await assertRolePermission({
      userId: req.me.id,
      workspaceId,
      requiredRoles: ['owner', 'admin'],
    });

    const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
    const accessPolicy = {
      permissions,
      updatedBy: req.me.id,
      updatedAt: new Date().toISOString(),
    };
    const membership = await membershipsSupabaseRepository.updateAccessPolicy({ userId, workspaceId, accessPolicy });
    if (!membership) throw new AppError('NOT_FOUND', 'Membership not found', 404);
    res.json({ data: membership });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/workspaces/:workspaceId/members/:userId
 *
 * Remove (disable) a workspace member.
 * Cannot remove the final workspace owner.
 * Requires: owner or admin role.
 */
router.delete('/:userId', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const { workspaceId, userId } = req.params;
    await assertRolePermission({
      userId: req.me.id,
      workspaceId,
      requiredRoles: ['owner', 'admin'],
    });
    const membership = await membershipsSupabaseRepository.findActiveMembership({ userId, workspaceId });
    if (!membership) throw new AppError('NOT_FOUND', 'Membership not found', 404);
    if (membership.role === 'owner') {
      const ownerCount = await membershipsSupabaseRepository.countWorkspaceOwners(workspaceId);
      if (ownerCount <= 1) throw new AppError('FINAL_OWNER', 'Cannot remove the final workspace owner', 403);
    }
    const disabled = await membershipsSupabaseRepository.disableMembership({ userId, workspaceId });
    res.json({ data: disabled });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/workspaces/:workspaceId/members/me/notification-channels
 *
 * Self-service: update own notification channel preferences.
 * Any authenticated member can update their own setting — no admin needed.
 *
 * Body: { channels: ["telegram", "whatsapp"] }
 *   - Pass null or [] to receive on all channels (workspace default).
 *   - Valid values: "telegram" | "whatsapp" | "web_push"
 */
router.patch('/me/notification-channels', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const { workspaceId } = req.params;

    const VALID_CHANNELS = ['telegram', 'whatsapp', 'web_push'];
    let channels = req.body?.channels;

    // null / undefined / empty array = reset to all-channels
    if (channels == null || (Array.isArray(channels) && channels.length === 0)) {
      channels = null;
    } else {
      if (!Array.isArray(channels)) {
        throw new AppError('VALIDATION', 'channels must be an array', 400);
      }
      const invalid = channels.filter(c => !VALID_CHANNELS.includes(c));
      if (invalid.length > 0) {
        throw new AppError('VALIDATION', `Invalid channels: ${invalid.join(', ')}. Valid: ${VALID_CHANNELS.join(', ')}`, 400);
      }
    }

    const membership = await membershipsSupabaseRepository.updateNotificationChannels({
      userId: req.me.id,
      workspaceId,
      channels,
    });
    if (!membership) throw new AppError('NOT_FOUND', 'Membership not found', 404);

    res.json({ data: membership });
  } catch (err) { next(err); }
});

export default router;
