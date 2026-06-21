export const OutletLocationStatus = Object.freeze({
  UNRESOLVED: 'UNRESOLVED',
  RESOLVED: 'RESOLVED',
  VERIFIED: 'VERIFIED',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  INVALID: 'INVALID',
});

const OUTLET_TRANSITIONS = {
  [OutletLocationStatus.UNRESOLVED]: [OutletLocationStatus.RESOLVED],
  [OutletLocationStatus.RESOLVED]: [OutletLocationStatus.VERIFIED],
  [OutletLocationStatus.VERIFIED]: [OutletLocationStatus.NEEDS_REVIEW],
  [OutletLocationStatus.NEEDS_REVIEW]: [OutletLocationStatus.VERIFIED, OutletLocationStatus.INVALID],
  [OutletLocationStatus.INVALID]: [OutletLocationStatus.RESOLVED],
};

const ELIGIBLE_STATUSES = new Set([OutletLocationStatus.VERIFIED]);

export function isValidOutletLocationTransition(from, to) {
  const allowed = OUTLET_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function getNextOutletLocationStatuses(status) {
  return [...(OUTLET_TRANSITIONS[status] || [])];
}

export function isEligibleOutletStatus(status) {
  return ELIGIBLE_STATUSES.has(status);
}
