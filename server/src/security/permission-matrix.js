const ROLE_ALIASES = Object.freeze({
  super: 'admin',
  agent: 'human_agent',
});

function freezeRoleConfig(config) {
  return Object.freeze({
    scope: config.scope,
    permissions: Object.freeze(Object.fromEntries(
      Object.entries(config.permissions).map(([resource, actions]) => [resource, Object.freeze([...actions])]),
    )),
  });
}

export const PERMISSION_MATRIX = Object.freeze({
  owner: freezeRoleConfig({
    scope: 'workspace',
    permissions: {
      dashboard: ['read'],
      products: ['read', 'write', 'export'],
      outlets: ['read', 'write', 'manage_access'],
      orders: ['read', 'write', 'manage_status'],
      payments: ['read', 'write', 'sync', 'reconcile'],
      settings: ['read', 'write'],
      platforms: ['read', 'write', 'test'],
      inventory: ['read', 'write', 'transfer'],
      notifications: ['read', 'write'],
      files: ['read', 'write', 'delete'],
      ai: ['test', 'configure'],
    },
  }),
  admin: freezeRoleConfig({
    scope: 'workspace',
    permissions: {
      dashboard: ['read'],
      products: ['read', 'write', 'export'],
      outlets: ['read', 'write', 'manage_access'],
      orders: ['read', 'write', 'manage_status'],
      payments: ['read', 'write', 'sync', 'reconcile'],
      settings: ['read', 'write'],
      platforms: ['read', 'write', 'test'],
      inventory: ['read', 'write', 'transfer'],
      notifications: ['read', 'write'],
      files: ['read', 'write', 'delete'],
      ai: ['test', 'configure'],
    },
  }),
  outlet_manager: freezeRoleConfig({
    scope: 'outlet',
    permissions: {
      dashboard: ['read'],
      products: ['read'],
      outlets: ['read'],
      orders: ['read', 'write', 'manage_status'],
      payments: ['read', 'write', 'sync'],
      settings: ['read'],
      platforms: ['read'],
      inventory: ['read', 'write', 'transfer'],
      notifications: ['read'],
      files: ['read', 'write'],
      ai: ['test'],
    },
  }),
  human_agent: freezeRoleConfig({
    scope: 'outlet',
    permissions: {
      dashboard: ['read'],
      products: ['read'],
      outlets: ['read'],
      orders: ['read', 'manage_status'],
      payments: ['read'],
      settings: ['read'],
      platforms: ['read'],
      inventory: ['read'],
      notifications: ['read'],
      files: ['read'],
      ai: ['test'],
    },
  }),
});

export function normalizeRole(role) {
  if (!role) return 'human_agent';
  return ROLE_ALIASES[role] || role;
}

export function getRoleConfig(role) {
  return PERMISSION_MATRIX[normalizeRole(role)] || PERMISSION_MATRIX.human_agent;
}

export function getRoleScope(role) {
  return getRoleConfig(role).scope;
}

export function hasPermission(role, resource, action) {
  const actions = getRoleConfig(role).permissions[resource] || [];
  return actions.includes(action);
}

export function listPermissions(role) {
  return getRoleConfig(role).permissions;
}
