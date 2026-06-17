import Workspace from '../models/Workspace.js';
import { workspaceMembershipsRepository } from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';

export async function getCurrentWorkspace({ workspaceId }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found', 404);
  return workspace;
}

export async function listUserWorkspaces({ userId }) {
  const memberships = await workspaceMembershipsRepository.listUserMemberships({ userId });
  const workspaceIds = memberships.map((m) => m.workspaceId);
  const workspaces = await Workspace.find({ _id: { $in: workspaceIds } }).lean();
  return workspaces.map((w) => {
    const membership = memberships.find((m) => m.workspaceId.toString() === w._id.toString());
    return { ...w, role: membership?.role, membershipStatus: membership?.status };
  });
}

export async function getWorkspaceDetail({ workspaceId, userId }) {
  const membership = await workspaceMembershipsRepository.findActiveMembership({ userId, workspaceId });
  if (!membership) throw new AppError('MEMBERSHIP_REQUIRED', 'Active membership required', 403);
  const workspace = await Workspace.findById(workspaceId).lean();
  if (!workspace) throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found', 404);
  return { ...workspace, role: membership.role };
}

export async function updateWorkspace({ workspaceId, userId, updates }) {
  const membership = await workspaceMembershipsRepository.findActiveMembership({ userId, workspaceId });
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new AppError('INSUFFICIENT_ROLE', 'Only owner or admin can update workspace', 403);
  }
  const allowed = ['name', 'timezone', 'settings', 'metadata'];
  const safe = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) safe[key] = updates[key];
  }
  return Workspace.findByIdAndUpdate(workspaceId, { $set: safe }, { new: true });
}
