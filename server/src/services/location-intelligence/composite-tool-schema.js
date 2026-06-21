export const COMPOSITE_TOOL_STATUSES = [
  'missing_information', 'ambiguous', 'resolved', 'not_found',
  'outside_supported_city', 'no_eligible_outlet', 'outside_radius',
  'provider_unavailable', 'rate_limited', 'invalid_input', 'flow_expired',
];

const VALID_STATUSES = new Set(COMPOSITE_TOOL_STATUSES);

export function isValidCompositeToolStatus(status) {
  return VALID_STATUSES.has(status);
}

export function createCompositeToolInput(fields) {
  return {
    flowId: fields.flowId,
    text: fields.text,
    coordinates: fields.coordinates,
    candidateId: fields.candidateId,
    limit: fields.limit || 3,
  };
}
