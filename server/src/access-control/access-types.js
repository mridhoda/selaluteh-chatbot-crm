export const RoleType = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  OUTLET_MANAGER: 'OUTLET_MANAGER',
  OUTLET_STAFF: 'OUTLET_STAFF',
  MEMBER: 'MEMBER',
};

export const ALPHA_PERMISSIONS = {
  outlets_read: { roles: [RoleType.OWNER, RoleType.ADMIN, RoleType.OUTLET_MANAGER, RoleType.OUTLET_STAFF] },
  outlets_write: { roles: [RoleType.OWNER, RoleType.ADMIN, RoleType.OUTLET_MANAGER] },
  orders_read: { roles: [RoleType.OWNER, RoleType.ADMIN, RoleType.OUTLET_MANAGER, RoleType.OUTLET_STAFF] },
  orders_approve: { roles: [RoleType.OWNER, RoleType.ADMIN, RoleType.OUTLET_MANAGER] },
  orders_update_status: { roles: [RoleType.OWNER, RoleType.ADMIN, RoleType.OUTLET_MANAGER] },
  products_read: { roles: [RoleType.OWNER, RoleType.ADMIN, RoleType.OUTLET_MANAGER, RoleType.OUTLET_STAFF] },
  products_write: { roles: [RoleType.OWNER, RoleType.ADMIN, RoleType.OUTLET_MANAGER] },
  members_read: { roles: [RoleType.OWNER, RoleType.ADMIN] },
  members_invite: { roles: [RoleType.OWNER, RoleType.ADMIN] },
  members_update_role: { roles: [RoleType.OWNER, RoleType.ADMIN] },
  members_update_outlets: { roles: [RoleType.OWNER, RoleType.ADMIN] },
  payments_read: { roles: [RoleType.OWNER, RoleType.ADMIN] },
  payments_reconcile: { roles: [RoleType.OWNER] },
};

export function hasPermission(userRole, permission) {
  const entry = ALPHA_PERMISSIONS[permission];
  if (!entry) return false;
  return entry.roles.includes(userRole);
}

export function isOwnerOrAdmin(role) {
  return role === RoleType.OWNER || role === RoleType.ADMIN;
}

export function canManageOutlet(role) {
  return [RoleType.OWNER, RoleType.ADMIN, RoleType.OUTLET_MANAGER].includes(role);
}

export const ROLE_HIERARCHY = [
  RoleType.OWNER,
  RoleType.ADMIN,
  RoleType.OUTLET_MANAGER,
  RoleType.OUTLET_STAFF,
  RoleType.MEMBER,
];
