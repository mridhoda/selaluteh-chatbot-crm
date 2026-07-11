const ROLE_ALIASES = {
  super: 'admin',
  agent: 'human_agent',
  outlet_staff: 'human_agent',
}

const PERMISSION_MATRIX = {
  owner: {
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
    analytics: ['read'],
    chats: ['read', 'reply', 'assign'],
    contacts: ['read'],
    complaints: ['read'],
    reports: ['read'],
    billing: ['read'],
    access_control: ['manage'],
  },
  admin: {
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
    analytics: ['read'],
    chats: ['read', 'reply', 'assign'],
    contacts: ['read'],
    complaints: ['read'],
    reports: ['read'],
    billing: ['read'],
  },
  outlet_manager: {
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
    analytics: ['read'],
    chats: ['read', 'reply'],
    reports: ['read'],
  },
  human_agent: {
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
}

const WORKSPACE_WIDE_ROLES = new Set(['owner', 'admin'])

const ACTION_ALIASES = {
  orders: {
    manage_status: ['manage_status', 'update_status'],
  },
}

export function getSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

export function normalizeRole(role) {
  const normalized = String(role || '').toLowerCase()
  return ROLE_ALIASES[normalized] || normalized || 'human_agent'
}

export function isOwner(user = getSessionUser()) {
  return normalizeRole(user?.workspaceRole || user?.role) === 'owner'
}

export function getPermissions(user = getSessionUser()) {
  if (user?.accessPolicy?.permissionsByResource) return user.accessPolicy.permissionsByResource
  const role = normalizeRole(user?.workspaceRole || user?.role)
  return PERMISSION_MATRIX[role] || PERMISSION_MATRIX.human_agent
}

export function hasPermission(resource, action = 'read', user = getSessionUser()) {
  if (!resource) return true
  const actions = ACTION_ALIASES[resource]?.[action] || [action]
  if (Array.isArray(user?.accessPolicy?.permissions)) {
    return actions.some((allowedAction) => user.accessPolicy.permissions.includes(`${resource}.${allowedAction}`))
  }
  const permissions = getPermissions(user)
  return actions.some((allowedAction) => (permissions[resource] || []).includes(allowedAction))
}

export function permissionsToResourceMap(permissions = []) {
  return permissions.reduce((acc, permission) => {
    const [resource, action] = String(permission).split('.')
    if (!resource || !action) return acc
    acc[resource] = acc[resource] || []
    if (!acc[resource].includes(action)) acc[resource].push(action)
    return acc
  }, {})
}

export function canAccessNavItem(item, user = getSessionUser()) {
  if (item.hiddenForOutletStaff && String(user?.workspaceRole || user?.role).toLowerCase() === 'outlet_staff') return false
  if (item.ownerOnly) return isOwner(user)
  if (!item.permission) return true
  return hasPermission(item.permission.resource, item.permission.action || 'read', user)
}

export function getScopedOutletId(user = getSessionUser()) {
  const ids = user?.allowedOutletIds || user?.accessPolicy?.allowedOutletIds || []
  return Array.isArray(ids) && ids.length === 1 ? ids[0] : null
}

export function getOrderQueryParams(user = getSessionUser(), params = {}) {
  const outletId = getScopedOutletId(user)
  return outletId && !params.outletId && !params.outlet_id ? { ...params, outletId } : params
}
