export const FAILURE_BEHAVIORS = {
  invalid_input: 'targeted-clarification',
  missing_city: 'ask-city',
  missing_detail: 'ask-street-area-or-landmark',
  ambiguous: 'show-up-to-three-candidates',
  not_found: 'ask-more-detail-or-spelling',
  unsupported_city: 'show-supported-cities',
  provider_timeout: 'retry-later-or-add-detail',
  provider_quota: 'cache-fallback-and-backoff',
  no_eligible_outlet: 'no-eligible-outlet',
  outside_radius: 'outside-radius-info',
  cache_failure: 'provider-or-database-fallback',
  route_failure: 'return-directions-link',
  flow_expired: 'ask-location-again',
};

export function handleFailure(failureType, _context) {
  const behavior = FAILURE_BEHAVIORS[failureType] || 'generic-error';
  return { behavior, failureType };
}
