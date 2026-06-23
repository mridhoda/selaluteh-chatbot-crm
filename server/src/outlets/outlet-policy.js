import { OutletOperationalStatus, canAcceptOrders, isValidTransition, OUTLET_ERRORS } from './outlet-status.js';

export function evaluateOrderAcceptance({ outlet, regularHours, specialHours, healthStatus, currentOpenState, referenceDate }) {
  const reasons = [];

  if (!canAcceptOrders(outlet.operational_status)) {
    reasons.push({ code: 'OUTLET_NOT_ACTIVE', severity: 'blocking' });
  }

  if (!outlet.accepts_orders) {
    reasons.push({ code: 'ORDERS_DISABLED', severity: 'blocking' });
  }

  if (!outlet.pickup_enabled) {
    reasons.push({ code: 'PICKUP_DISABLED', severity: 'blocking' });
  }

  if (currentOpenState) {
    if (currentOpenState.state !== 'OPEN' && currentOpenState.state !== 'OPENING_SOON') {
      reasons.push({ code: 'OUTSIDE_OPERATING_HOURS', severity: 'blocking' });
    }
  } else {
    reasons.push({ code: 'LOCATION_NOT_READY', severity: 'warning' });
  }

  if (healthStatus === 'OFFLINE' || healthStatus === 'DEGRADED') {
    reasons.push({ code: 'BLOCKING_HEALTH_ISSUE', severity: 'blocking' });
  }

  const allowed = reasons.filter(r => r.severity !== 'blocking').length === reasons.length;
  return {
    allowed,
    reasonCode: allowed ? 'ALLOWED' : reasons[0].code,
    reasons,
    evaluatedAt: new Date().toISOString(),
  };
}

export function buildActivationChecklist(outlet) {
  const missing = [];

  if (!outlet.name || !outlet.name.trim()) missing.push('profile_name');
  if (!outlet.timezone) missing.push('timezone');
  if (!outlet.address && !outlet.city) missing.push('address_or_city');
  if (!outlet.pickup_enabled && !outlet.delivery_enabled) missing.push('service_capability');
  if (outlet.operational_status === 'ARCHIVED') missing.push('not_archived');

  const eligible = missing.length === 0;
  return {
    eligible,
    missing,
    status: outlet.operational_status,
    outletId: outlet.id,
    evaluatedAt: new Date().toISOString(),
  };
}

export function normalizeOutletCode(name) {
  if (!name) return '';
  return name.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '').slice(0, 20);
}
