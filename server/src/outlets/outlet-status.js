export const OutletOperationalStatus = {
  DRAFT: 'DRAFT',
  COMING_SOON: 'COMING_SOON',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
};

export const OutletHealthStatus = {
  HEALTHY: 'HEALTHY',
  NEEDS_ATTENTION: 'NEEDS_ATTENTION',
  DEGRADED: 'DEGRADED',
  OFFLINE: 'OFFLINE',
  UNKNOWN: 'UNKNOWN',
};

export const OutletOpenState = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  OPENING_SOON: 'OPENING_SOON',
  CLOSING_SOON: 'CLOSING_SOON',
  UNKNOWN: 'UNKNOWN',
};

export const OUTLET_TRANSITIONS = {
  [OutletOperationalStatus.DRAFT]: [OutletOperationalStatus.COMING_SOON, OutletOperationalStatus.ACTIVE, OutletOperationalStatus.ARCHIVED],
  [OutletOperationalStatus.COMING_SOON]: [OutletOperationalStatus.ACTIVE, OutletOperationalStatus.PAUSED, OutletOperationalStatus.ARCHIVED],
  [OutletOperationalStatus.ACTIVE]: [OutletOperationalStatus.PAUSED, OutletOperationalStatus.ARCHIVED],
  [OutletOperationalStatus.PAUSED]: [OutletOperationalStatus.ACTIVE, OutletOperationalStatus.ARCHIVED],
  [OutletOperationalStatus.ARCHIVED]: [OutletOperationalStatus.DRAFT],
};

export function isValidTransition(from, to) {
  const allowed = OUTLET_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function canAcceptOrders(status) {
  return status === OutletOperationalStatus.ACTIVE;
}

export function isOperationallyVisible(status) {
  return [OutletOperationalStatus.ACTIVE, OutletOperationalStatus.PAUSED, OutletOperationalStatus.COMING_SOON].includes(status);
}

export const OUTLET_ERRORS = {
  NOT_FOUND: { code: 'OUTLET_NOT_FOUND', status: 404 },
  ACCESS_DENIED: { code: 'OUTLET_ACCESS_DENIED', status: 403 },
  CODE_CONFLICT: { code: 'OUTLET_CODE_CONFLICT', status: 409 },
  SLUG_CONFLICT: { code: 'OUTLET_SLUG_CONFLICT', status: 409 },
  INVALID_STATUS: { code: 'OUTLET_INVALID_STATUS', status: 400 },
  INVALID_TRANSITION: { code: 'OUTLET_INVALID_STATUS_TRANSITION', status: 400 },
  ACTIVATION_FAILED: { code: 'OUTLET_ACTIVATION_REQUIREMENTS_NOT_MET', status: 400 },
  VERSION_CONFLICT: { code: 'OUTLET_VERSION_CONFLICT', status: 409 },
  ALREADY_ARCHIVED: { code: 'OUTLET_ALREADY_ARCHIVED', status: 400 },
  TIMEZONE_INVALID: { code: 'OUTLET_TIMEZONE_INVALID', status: 400 },
  HOURS_INVALID: { code: 'OUTLET_HOURS_INVALID', status: 400 },
  SPECIAL_HOURS_CONFLICT: { code: 'OUTLET_SPECIAL_HOURS_CONFLICT', status: 409 },
  ORDERS_DISABLED: { code: 'OUTLET_ORDERS_DISABLED', status: 400 },
  OUTSIDE_HOURS: { code: 'OUTLET_OUTSIDE_OPERATING_HOURS', status: 400 },
  MANAGER_INVALID: { code: 'OUTLET_MANAGER_INVALID', status: 400 },
};
