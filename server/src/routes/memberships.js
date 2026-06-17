import { Router } from 'express';
import { workspaceMembershipsRepository } from '../db/repositories/index.js';
import { assertRolePermission } from '../services/access-control.service.js';
import { AppError } from '../utils/errors.js';

const router = Router({ mergeParams: true });

router.get('/', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const { workspaceId } = req.params;
    await assertRolePermission({ userId: req.me._id, workspaceId, requiredRoles: ['owner', 'admin', 'outlet_manager'] });
    const members = await workspaceMembershipsRepository.listWorkspaceMembers({ workspaceId });
    res.json({ data: members });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const { workspaceId } = req.params;
    await assertRolePermission({ userId: req.me._id, workspaceId, requiredRoles: ['owner', 'admin'] });
    const { userId, role } = req.body;
    if (!userId) throw new AppError('VALIDATION', 'userId is required', 400);
    const membership = await workspaceMembershipsRepository.createMembership({
      workspaceId, userId, role: role || 'human_agent', status: 'active',
    });
    res.status(201).json({ data: membership });
  } catch (err) { next(err); }
});

router.patch('/:userId', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const { workspaceId, userId } = req.params;
    await assertRolePermission({ userId: req.me._id, workspaceId, requiredRoles: ['owner', 'admin'] });
    const { role } = req.body;
    if (!role) throw new AppError('VALIDATION', 'role is required', 400);
    const membership = await workspaceMembershipsRepository.updateRole({ userId, workspaceId, role });
    if (!membership) throw new AppError('NOT_FOUND', 'Membership not found', 404);
    res.json({ data: membership });
  } catch (err) { next(err); }
});

router.delete('/:userId', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const { workspaceId, userId } = req.params;
    await assertRolePermission({ userId: req.me._id, workspaceId, requiredRoles: ['owner', 'admin'] });
    const membership = await workspaceMembershipsRepository.findActiveMembership({ userId, workspaceId });
    if (!membership) throw new AppError('NOT_FOUND', 'Membership not found', 404);
    if (membership.role === 'owner') {
      const ownerCount = await workspaceMembershipsRepository.countWorkspaceOwners(workspaceId);
      if (ownerCount <= 1) throw new AppError('FINAL_OWNER', 'Cannot remove the final workspace owner', 403);
    }
    const disabled = await workspaceMembershipsRepository.disableMembership({ userId, workspaceId });
    res.json({ data: disabled });
  } catch (err) { next(err); }
});

export default router;
