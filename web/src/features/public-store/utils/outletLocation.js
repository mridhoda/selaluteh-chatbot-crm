const EARTH_RADIUS_METERS = 6371000

function toRadians(value) {
  return (value * Math.PI) / 180
}

export function haversineDistanceMeters(origin, destination) {
  const lat1 = Number(origin?.latitude)
  const lng1 = Number(origin?.longitude)
  const lat2 = Number(destination?.latitude)
  const lng2 = Number(destination?.longitude)
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null
  if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90 || Math.abs(lng1) > 180 || Math.abs(lng2) > 180) return null

  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(meters) {
  if (!Number.isFinite(meters)) return ''
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0).replace('.', ',')} km`
}

export function findNearestOutlet(position, outlets = []) {
  const origin = { latitude: position?.latitude, longitude: position?.longitude }
  return outlets
    .map((outlet) => ({ ...outlet, distanceMeters: haversineDistanceMeters(origin, outlet) }))
    .filter((outlet) => outlet.distanceMeters !== null)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0] || null
}
