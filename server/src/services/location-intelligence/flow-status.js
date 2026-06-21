export const LocationFlowStatus = Object.freeze({
  EMPTY: 'EMPTY',
  MISSING_CITY: 'MISSING_CITY',
  MISSING_DETAIL: 'MISSING_DETAIL',
  READY_TO_RESOLVE: 'READY_TO_RESOLVE',
  RESOLVING: 'RESOLVING',
  AMBIGUOUS: 'AMBIGUOUS',
  READY_TO_CALCULATE: 'READY_TO_CALCULATE',
  RESULTS_READY: 'RESULTS_READY',
  CONFIRMING_OUTLET: 'CONFIRMING_OUTLET',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
});

const TRANSITIONS = {
  [LocationFlowStatus.EMPTY]: [
    LocationFlowStatus.MISSING_CITY,
    LocationFlowStatus.MISSING_DETAIL,
    LocationFlowStatus.READY_TO_RESOLVE,
    LocationFlowStatus.READY_TO_CALCULATE,
  ],
  [LocationFlowStatus.MISSING_CITY]: [
    LocationFlowStatus.READY_TO_RESOLVE,
    LocationFlowStatus.CANCELLED,
    LocationFlowStatus.EXPIRED,
  ],
  [LocationFlowStatus.MISSING_DETAIL]: [
    LocationFlowStatus.READY_TO_RESOLVE,
    LocationFlowStatus.CANCELLED,
    LocationFlowStatus.EXPIRED,
  ],
  [LocationFlowStatus.READY_TO_RESOLVE]: [
    LocationFlowStatus.RESOLVING,
  ],
  [LocationFlowStatus.RESOLVING]: [
    LocationFlowStatus.AMBIGUOUS,
    LocationFlowStatus.READY_TO_CALCULATE,
    LocationFlowStatus.NOT_FOUND,
    LocationFlowStatus.OUTSIDE_SUPPORTED_CITY,
  ],
  [LocationFlowStatus.AMBIGUOUS]: [
    LocationFlowStatus.READY_TO_CALCULATE,
    LocationFlowStatus.READY_TO_RESOLVE,
    LocationFlowStatus.CANCELLED,
    LocationFlowStatus.EXPIRED,
  ],
  [LocationFlowStatus.READY_TO_CALCULATE]: [
    LocationFlowStatus.RESULTS_READY,
  ],
  [LocationFlowStatus.RESULTS_READY]: [
    LocationFlowStatus.CONFIRMING_OUTLET,
  ],
  [LocationFlowStatus.CONFIRMING_OUTLET]: [
    LocationFlowStatus.CONFIRMED,
    LocationFlowStatus.READY_TO_RESOLVE,
    LocationFlowStatus.CANCELLED,
    LocationFlowStatus.EXPIRED,
  ],
  [LocationFlowStatus.CONFIRMED]: [],
  [LocationFlowStatus.CANCELLED]: [],
  [LocationFlowStatus.EXPIRED]: [],
};

export function isValidFlowTransition(from, to) {
  const allowed = TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function getNextFlowStatuses(status) {
  return [...(TRANSITIONS[status] || [])];
}

export function isFlowTerminal(status) {
  return [LocationFlowStatus.CONFIRMED, LocationFlowStatus.CANCELLED, LocationFlowStatus.EXPIRED].includes(status);
}
