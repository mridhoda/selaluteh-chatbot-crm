export function buildPlaceLink(location) {
  if (location.googleMapsUri) return location.googleMapsUri;

  const lat = location.latitude;
  const lng = location.longitude;
  return `https://maps.google.com/?q=${lat},${lng}`;
}

export function buildDirectionsLink(origin, destination, travelMode = 'driving') {
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;
  return `https://maps.google.com/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=${travelMode}`;
}
