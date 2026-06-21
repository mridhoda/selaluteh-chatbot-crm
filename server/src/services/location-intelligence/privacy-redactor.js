const COORDINATE_PATTERN = /(-?\d+\.?\d*)\s*[, ]\s*(-?\d+\.?\d*)/g;

export function redactCoordinates(text) {
  if (!text) return text;
  return text.replace(COORDINATE_PATTERN, '[REDACTED]');
}

export function createSafeLogEntry(fields) {
  const safe = { ...fields };
  delete safe.latitude;
  delete safe.longitude;
  delete safe.protectedLatitude;
  delete safe.protectedLongitude;
  delete safe.rawProviderPayload;
  delete safe.providerApiKey;
  delete safe.googleMapsApiKey;
  delete safe.apiKey;
  Object.keys(safe).forEach(k => { if (k.toLowerCase().includes('secret')) delete safe[k]; });
  return safe;
}
