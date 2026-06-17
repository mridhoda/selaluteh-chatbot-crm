import { outletsRepository, workspaceMembershipsRepository } from '../db/repositories/index.js';

const ALL_OUTLET_WORKSPACE_ROLES = new Set(['owner', 'super', 'admin']);
const WRITE_WORKSPACE_ROLES = new Set(['owner', 'super', 'admin']);
const WORKSPACE_WIDE_ROLES = new Set(['owner', 'admin']);

export async function resolveWorkspaceContext(user) {
  const memberships = await workspaceMembershipsRepository.listUserMemberships({ userId: user._id });
  const active = memberships.find((m) => m.status === 'active');
  if (!active) return null;
  return {
    workspaceId: active.workspaceId,
    role: active.role,
    membershipId: active._id,
  };
}

export function getWorkspaceIdForUser(user) {
  return user?.workspaceId || null;
}

export function canManageWorkspace(user) {
  return WRITE_WORKSPACE_ROLES.has(user?.role);
}

export function canAccessAllOutlets(user) {
  return ALL_OUTLET_WORKSPACE_ROLES.has(user?.role);
}

export function isWorkspaceWideRole(role) {
  return WORKSPACE_WIDE_ROLES.has(role);
}

export async function assertActiveMembership({ workspaceId, userId }) {
  const membership = await workspaceMembershipsRepository.findActiveMembership({ userId, workspaceId });
  if (!membership) {
    const err = new Error('Active workspace membership required');
    err.status = 403;
    err.code = 'MEMBERSHIP_REQUIRED';
    throw err;
  }
  return membership;
}

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

export async function getAllowedOutletIds(user) {
  const workspaceId = getWorkspaceIdForUser(user);
  if (!workspaceId) return [];

  if (canAccessAllOutlets(user)) {
    const outlets = await outletsRepository.findActiveIdsByWorkspace(workspaceId);
    return outlets.map((outlet) => outlet._id);
  }

  const rows = await outletsRepository.findUserAccess({ workspaceId, userId: user._id });

  return rows.map((row) => row.outletId);
}

export async function assertOutletAccess(user, outletId) {
  const workspaceId = getWorkspaceIdForUser(user);
  if (!workspaceId) {
    const err = new Error('Workspace membership required');
    err.status = 403;
    err.code = 'MEMBERSHIP_REQUIRED';
    throw err;
  }

  const outlet = await outletsRepository.findByWorkspaceAndId({ workspaceId, outletId });
  if (!outlet) {
    const err = new Error('Outlet not found');
    err.status = 404;
    err.code = 'OUTLET_NOT_FOUND';
    throw err;
  }

  if (canAccessAllOutlets(user)) return outlet;

  const access = await outletsRepository.findOneUserAccess({ workspaceId, outletId: outlet._id, userId: user._id });

  if (!access) {
    const err = new Error('Forbidden outlet access');
    err.status = 403;
    err.code = 'OUTLET_ACCESS_DENIED';
    throw err;
  }

  return outlet;
}

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

  if (!canAccessAllOutlets(user)) {
    query.outletId = { $in: await getAllowedOutletIds(user) };
  }

  return query;
}
