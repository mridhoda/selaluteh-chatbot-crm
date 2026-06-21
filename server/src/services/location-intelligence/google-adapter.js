import { createLocationCandidate } from './location-candidate.js';

const MOCK_CITIES = {
  'samarinda': { lat: -0.502106, lng: 117.153709 },
  'balikpapan': { lat: -1.2379, lng: 116.8529 },
  'jakarta': { lat: -6.2088, lng: 106.8456 },
};

export function createGoogleMapsClient(config) {
  let callCount = 0;
  const calls = [];
  const hasKey = !!(config && config.apiKey);

  const mockGeocode = async (query) => {
    const q = query.toLowerCase();
    for (const [city, coord] of Object.entries(MOCK_CITIES)) {
      if (q.includes(city)) {
        return {
          candidates: [
            createLocationCandidate({
              candidateId: `gc-${callCount}`,
              provider: 'google-mock',
              providerPlaceId: `place_${city}`,
              label: query,
              formattedAddress: `${query}, Indonesia`,
              city: city.charAt(0).toUpperCase() + city.slice(1),
              countryCode: 'ID',
              latitude: coord.lat,
              longitude: coord.lng,
              confidence: 'high',
              precision: 'street',
            }),
          ],
          status: 'RESOLVED',
        };
      }
    }
    return { candidates: [], status: 'NOT_FOUND' };
  };

  return {
    geocodeText: async (input, context) => {
      callCount++;
      calls.push({ method: 'geocodeText', input, context });
      return mockGeocode(input.query || `${input.street || ''} ${input.city || ''}`.trim());
    },
    searchPlaces: async (input, context) => {
      callCount++;
      calls.push({ method: 'searchPlaces', input, context });
      const q = (input.query || '').toLowerCase();
      if (q.includes('mall') || q.includes('big')) {
        return {
          candidates: [
            createLocationCandidate({
              candidateId: `ps-${callCount}`,
              provider: 'google-mock',
              providerPlaceId: 'place_mall_1',
              label: input.query,
              formattedAddress: `${input.query}, Samarinda, Indonesia`,
              city: 'Samarinda',
              countryCode: 'ID',
              latitude: -0.493793,
              longitude: 117.147362,
              confidence: 'high',
              precision: 'landmark',
            }),
          ],
          status: 'RESOLVED',
        };
      }
      return { candidates: [], status: 'NOT_FOUND' };
    },
    getPlaceDetails: async (input, context) => {
      callCount++;
      calls.push({ method: 'getPlaceDetails', input, context });
      return createLocationCandidate({
        candidateId: 'pd-1',
        provider: 'google-mock',
        providerPlaceId: input.placeId,
        label: 'Resolved Place',
        formattedAddress: 'Samarinda, Indonesia',
        city: 'Samarinda',
        countryCode: 'ID',
        latitude: -0.502106,
        longitude: 117.153709,
        confidence: 'high',
        precision: 'rooftop',
      });
    },
    resolveMapsUrl: async (input, context) => {
      callCount++;
      calls.push({ method: 'resolveMapsUrl', input, context });
      return { candidate: createLocationCandidate({
        candidateId: 'url-1', provider: 'google-mock', label: 'URL Place',
        formattedAddress: 'Samarinda, Indonesia', city: 'Samarinda',
        countryCode: 'ID', latitude: -0.502106, longitude: 117.153709,
        confidence: 'high', precision: 'rooftop',
      }), status: 'RESOLVED' };
    },
    getDirections: async (input, context) => {
      callCount++;
      calls.push({ method: 'getDirections', input, context });
      return { estimatedDistanceMeters: 1500, estimatedDurationSeconds: 300, estimateAvailable: true };
    },
    health: async () => {
      if (!hasKey) return { status: 'unhealthy', provider: 'google-mock', error: 'missing_api_key' };
      return { status: 'mock', provider: 'google-mock', latencyMs: 5 };
    },
    getCallCount: () => callCount,
    getCalls: () => [...calls],
    reset: () => { callCount = 0; calls.length = 0; },
  };
}

export function buildGoogleGeocodeResult(overrides) {
  return createLocationCandidate({ ...overrides, provider: overrides.provider || 'google-mock' });
}

export function buildGooglePlaceResult(overrides) {
  return createLocationCandidate({ ...overrides, provider: overrides.provider || 'google-mock' });
}
