export const EARTH_RADIUS_METERS = 6371000;

export function haversineDistance(lat1, lng1, lat2, lng2) {
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1) || !Number.isFinite(lat2) || !Number.isFinite(lng2)) {
    throw new Error('INVALID_COORDINATES');
  }
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) throw new Error('INVALID_COORDINATES');
  if (lng1 < -180 || lng1 > 180 || lng2 < -180 || lng2 > 180) throw new Error('INVALID_COORDINATES');

  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}
