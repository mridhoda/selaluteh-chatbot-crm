export const ResolutionStatus = Object.freeze({
  RESOLVED: 'RESOLVED',
  AMBIGUOUS: 'AMBIGUOUS',
  NOT_FOUND: 'NOT_FOUND',
  OUTSIDE_SUPPORTED_CITY: 'OUTSIDE_SUPPORTED_CITY',
  INVALID_INPUT: 'INVALID_INPUT',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
});

const VALID_STATUSES = new Set(Object.values(ResolutionStatus));

export function isValidResolutionStatus(status) {
  if (typeof status !== 'string') return false;
  return VALID_STATUSES.has(status);
}

export function isStableResolutionStatus(status) {
  return isValidResolutionStatus(status);
}
