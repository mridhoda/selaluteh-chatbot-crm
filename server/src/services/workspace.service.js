/**
 * workspace.service.js — Supabase-backed (task 24.7)
 *
 * Workspace business logic using Supabase-backed repositories.
 * Switched from Mongoose Workspace model + workspaceMembershipsRepository to
 * workspacesSupabaseRepository + membershipsSupabaseRepository.
 *
 * NOTE: user.id is a UUID string (not Mongoose ObjectId).
 */

import { workspacesSupabaseRepository } from '../db/repositories/workspaces.repository.js';
import { membershipsSupabaseRepository } from '../db/repositories/memberships.repository.js';
import { usersSupabaseRepository } from '../db/repositories/users.repository.js';
import { AppError } from '../utils/errors.js';

/**
 * Get workspace by ID.
 * Throws 404 if not found.
 *
 * @param {{ workspaceId: string }} param
 * @returns {Promise<WorkspaceRecord>}
 */
export async function getCurrentWorkspace({ workspaceId }) {
  const workspace = await workspacesSupabaseRepository.findById(workspaceId);
  if (!workspace) throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found', 404);
  return workspace;
}

/**
 * List all workspaces the user is a member of.
 * Returns workspaces with membership role annotated.
 *
 * @param {{ userId: string }} param
 * @returns {Promise<Array<WorkspaceRecord & { role: string, membershipStatus: string }>>}
 */
export async function listUserWorkspaces({ userId }) {
  const memberships = await membershipsSupabaseRepository.listUserMemberships({ userId });
  const workspaceIds = memberships.map((m) => m.workspaceId);
  if (workspaceIds.length === 0) return [];

  // Fetch each workspace (Supabase doesn't have a bulk findByIds built-in but we can use .in())
  const client = (await import('../db/supabase.js')).getSupabaseServiceClient();
  const { data: workspaces, error } = await client
    .from('workspaces')
    .select('*')
    .in('id', workspaceIds);
  if (error) throw new AppError('DATABASE_ERROR', 'Failed to load workspaces', 500);

  const { mapRows } = await import('../db/supabase-mapper.js');
  return mapRows(workspaces ?? []).map((w) => {
    const membership = memberships.find((m) => m.workspaceId === w.id);
    return { ...w, role: membership?.role, membershipStatus: membership?.status };
  });
}

/**
 * Get workspace detail for a user, verifying membership.
 * Throws 403 if no active membership.
 *
 * @param {{ workspaceId: string, userId: string }} param
 * @returns {Promise<WorkspaceRecord & { role: string }>}
 */
export async function getWorkspaceDetail({ workspaceId, userId }) {
  const membership = await membershipsSupabaseRepository.findActiveMembership({ userId, workspaceId });
  if (!membership) throw new AppError('MEMBERSHIP_REQUIRED', 'Active membership required', 403);
  const workspace = await workspacesSupabaseRepository.findById(workspaceId);
  if (!workspace) throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found', 404);
  return { ...workspace, role: membership.role };
}

/**
 * Update workspace metadata/name.
 * Only owner or admin can update.
 *
 * @param {{ workspaceId: string, userId: string, updates: object }} param
 * @returns {Promise<WorkspaceRecord>}
 */
export async function updateWorkspace({ workspaceId, userId, updates }) {
  const membership = await membershipsSupabaseRepository.findActiveMembership({ userId, workspaceId });
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new AppError('INSUFFICIENT_ROLE', 'Only owner or admin can update workspace', 403);
  }
  const allowed = ['name', 'status', 'metadata'];
  const safe = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) safe[key] = updates[key];
  }
  return workspacesSupabaseRepository.update(workspaceId, safe);
}
