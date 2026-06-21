export function isOutletEligible(outlet) {
  if (!outlet.active) return false;
  if (!outlet.pickupEnabled) return false;
  if (outlet.deletedAt) return false;
  if (outlet.operationallyDisabled) return false;
  if (outlet.locationStatus !== 'VERIFIED') return false;

  const lat = outlet.latitude;
  const lng = outlet.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;

  return true;
}
