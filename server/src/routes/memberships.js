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

const router = Router({ mergeParams: true });

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

export default router;
