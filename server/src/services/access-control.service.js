/**
 * access-control.service.js — Supabase-backed (task 24.7)
 *
 * Workspace/outlet access control helpers.
 * Switched from Mongoose-based workspaceMembershipsRepository to
 * membershipsSupabaseRepository (Supabase-backed).
 *
 * NOTE: req.me.id is now a UUID string (not Mongoose ObjectId).
 * All references use user.id.
 */

import { outletsSupabaseRepository, membershipsSupabaseRepository } from '../db/repositories/index.js';
import { getRoleScope, normalizeRole, hasPermission, listPermissions } from '../security/permission-matrix.js';


const ALL_OUTLET_WORKSPACE_ROLES = new Set(['owner', 'super', 'admin']);
const WRITE_WORKSPACE_ROLES = new Set(['owner', 'super', 'admin']);
const WORKSPACE_WIDE_ROLES = new Set(['owner', 'super', 'admin']);

/**
 * Resolve the active workspace context for a user.
 * If a workspace is explicitly selected, it must match an active membership.
 * Otherwise, the first active membership is used as the single-workspace MVP
 * default.
 *
 * @param {import('../db/repositories/users.repository.js').UserRecord} user - camelCase UserRecord
 * @param {string|null|undefined} selectedWorkspaceId
 * @returns {Promise<{ workspaceId: string, role: string, membershipId: string }|null>}
 */
export async function resolveWorkspaceContext(user, selectedWorkspaceId = null) {
  const memberships = await membershipsSupabaseRepository.listUserMemberships({ userId: user.id });
  const activeMemberships = memberships.filter((m) => m.status === 'active');

  if (selectedWorkspaceId) {
    const selected = activeMemberships.find((m) => String(m.workspaceId) === String(selectedWorkspaceId));
    if (!selected) {
      const err = new Error('Active workspace membership required');
      err.status = 403;
      err.code = 'MEMBERSHIP_REQUIRED';
      throw err;
    }
    return {
      workspaceId: selected.workspaceId,
      role: selected.role,
      membershipId: selected.id,
    };
  }

  const active = activeMemberships[0];
  if (!active) return null;
  return {
    workspaceId: active.workspaceId,
    role: active.role,
    membershipId: active.id,
  };
}

/**
 * Get the workspace ID directly from the user record.
  * Requires Supabase user shape with `workspaceId`.
 *
 * @param {object} user
 * @returns {string|null}
 */
export function getWorkspaceIdForUser(user) {
  return user?.workspaceId?.toString() || null;
}

/**
 * Resolve user ID from Supabase user shape.
 *
 * @param {object} user
 * @returns {string}
 */
function resolveUserId(user) {
  return user?.id?.toString() ?? null;
}

export function canManageWorkspace(user) {
  const role = getEffectiveWorkspaceRole(user);
  return WRITE_WORKSPACE_ROLES.has(role) || hasPermission(role, 'settings', 'write');
}

export function canAccessAllOutlets(user) {
  return ALL_OUTLET_WORKSPACE_ROLES.has(getEffectiveWorkspaceRole(user));
}

export function isWorkspaceWideRole(role) {
  return getRoleScope(role) === 'workspace' || WORKSPACE_WIDE_ROLES.has(role);
}

export function getEffectiveWorkspaceRole(user) {
  return normalizeRole(user?.workspaceRole || user?.role);
}

export function getPermissionMatrixForUser(user) {
  return listPermissions(getEffectiveWorkspaceRole(user));
}


/**
 * Assert that user has an active membership in the workspace.
 * Throws 403 if not found.
 *
 * @param {{ workspaceId: string, userId: string }} param
 * @returns {Promise<MembershipRecord>}
 */
export async function assertActiveMembership({ workspaceId, userId }) {
  const uid = userId?.toString() ?? null;
  const membership = await membershipsSupabaseRepository.findActiveMembership({ userId: uid, workspaceId: workspaceId?.toString() });
  if (!membership) {
    const err = new Error('Active workspace membership required');
    err.status = 403;
    err.code = 'MEMBERSHIP_REQUIRED';
    throw err;
  }
  return membership;
}

/**
 * Assert that user has an active membership with one of the required roles.
 * Throws 403 if role is insufficient.
 *
 * @param {{ userId: string, workspaceId: string, requiredRoles: string[] }} param
 * @returns {Promise<MembershipRecord>}
 */
export async function assertRolePermission({ userId, workspaceId, requiredRoles }) {
  const membership = await assertActiveMembership({ userId, workspaceId });
  if (!requiredRoles.includes(membership.role)) {
    const err = new Error(`Requires one of roles: ${requiredRoles.join(', ')}`);
    err.status = 403;
    err.code = 'INSUFFICIENT_ROLE';
    throw err;
  }
  return membership;
}

/**
 * Get all outlet IDs accessible to a user.
 * Workspace-wide roles (owner/super/admin) get all active outlets.
 * Outlet-scoped roles get only their assigned outlets.
 *
 * @param {object} user
 * @returns {Promise<string[]>} array of outlet IDs
 */
export async function getAllowedOutletIds(user) {
  const workspaceId = getWorkspaceIdForUser(user);
  if (!workspaceId) return [];

  const userId = resolveUserId(user);

  if (canAccessAllOutlets(user) || isWorkspaceWideRole(getEffectiveWorkspaceRole(user))) {
    const outlets = await outletsSupabaseRepository.findActiveIdsByWorkspace(workspaceId);
    return outlets.map((o) => o.id);
  }

  const rows = await outletsSupabaseRepository.findUserAccess({ workspaceId, userId });
  return rows.map((row) => row.outletId);
}


/**
 * Assert a user has access to a specific outlet.
 * Returns the outlet record if access is granted.
 *
 * @param {object} user
 * @param {string} outletId
 * @returns {Promise<object>} outlet record
 */
export async function assertOutletAccess(user, outletId) {
  const workspaceId = getWorkspaceIdForUser(user);
  if (!workspaceId) {
    const err = new Error('Workspace membership required');
    err.status = 403;
    err.code = 'MEMBERSHIP_REQUIRED';
    throw err;
  }

  const outlet = await outletsSupabaseRepository.findById({ workspaceId, outletId });
  if (!outlet) {
    const err = new Error('Outlet not found');
    err.status = 404;
    err.code = 'OUTLET_NOT_FOUND';
    throw err;
  }

  if (canAccessAllOutlets(user) || isWorkspaceWideRole(getEffectiveWorkspaceRole(user))) return outlet;

  const userId = resolveUserId(user);
  const access = await outletsSupabaseRepository.findOneUserAccess({
    workspaceId,
    outletId: outlet.id,
    userId,
  });

  if (!access) {
    const err = new Error('Forbidden outlet access');
    err.status = 403;
    err.code = 'OUTLET_ACCESS_DENIED';
    throw err;
  }

  return outlet;
}


/**
 * Build a query scope object with workspaceId and optional outletId constraint.
 *
 * @param {import('../db/repositories/users.repository.js').UserRecord} user
 * @param {string|undefined} requestedOutletId
 * @returns {Promise<{ workspaceId: string, outletId?: string|{ $in: string[] } }>}
 */
export async function buildOutletScopedQuery(user, requestedOutletId) {
  const workspaceId = getWorkspaceIdForUser(user);
  if (!workspaceId) {
    const err = new Error('Workspace membership required');
    err.status = 403;
    err.code = 'MEMBERSHIP_REQUIRED';
    throw err;
  }

  const query = { workspaceId };
  if (requestedOutletId) {
    await assertOutletAccess(user, requestedOutletId);
    query.outletId = requestedOutletId;
    return query;
  }

  // For non-admin roles, filter to allowed outlet IDs (array of UUIDs)
  if (!canAccessAllOutlets(user) && !isWorkspaceWideRole(getEffectiveWorkspaceRole(user))) {
    query.outletIds = await getAllowedOutletIds(user);
  }

  return query;
}
