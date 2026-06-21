const CLARIFICATION_MAP = {
  'MISSING_CITY': 'ASK_CITY',
  'MISSING_DETAIL': 'ASK_STREET_AREA_OR_LANDMARK',
};

export function getClarificationCode(status) {
  return CLARIFICATION_MAP[status] || null;
}
