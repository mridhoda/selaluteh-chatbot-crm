export function evaluateCompleteness(fields) {
  const hasCoordinates = fields.protectedLatitude != null && fields.protectedLongitude != null;
  if (hasCoordinates) return 'READY_TO_CALCULATE';

  const hasCity = !!fields.city;
  const hasDetail = !!(fields.street || fields.area || fields.landmark || fields.placeName || fields.postalCode);

  if (!hasCity) return 'MISSING_CITY';
  if (hasCity && !hasDetail) return 'MISSING_DETAIL';
  if (hasCity && hasDetail) return 'READY_TO_RESOLVE';

  return 'MISSING_CITY';
}
