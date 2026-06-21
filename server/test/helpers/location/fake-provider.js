const DEFAULT_GEOCODE_RESULTS = {
  'Jalan Biawan, Samarinda, Kalimantan Timur, Indonesia': {
    candidates: [
      {
        candidateId: 'cand-geo-1',
        provider: 'fake',
        providerPlaceId: 'place_geo_1',
        label: 'Jalan Biawan, Samarinda',
        formattedAddress: 'Jalan Biawan, Samarinda, Kalimantan Timur, Indonesia',
        city: 'Samarinda',
        province: 'Kalimantan Timur',
        countryCode: 'ID',
        latitude: -0.502106,
        longitude: 117.153709,
        confidence: 'high',
        precision: 'street',
      },
    ],
    status: 'RESOLVED',
  },
};

const DEFAULT_PLACE_SEARCH_RESULTS = {
  'Big Mall Samarinda': {
    candidates: [
      {
        candidateId: 'cand-pl-1',
        provider: 'fake',
        providerPlaceId: 'place_pl_1',
        label: 'Big Mall Samarinda',
        formattedAddress: 'Big Mall, Jalan Biawan, Samarinda, Kalimantan Timur, Indonesia',
        city: 'Samarinda',
        province: 'Kalimantan Timur',
        countryCode: 'ID',
        latitude: -0.493793,
        longitude: 117.147362,
        confidence: 'high',
        precision: 'landmark',
      },
    ],
    status: 'RESOLVED',
  },
  'Air Putih Samarinda': {
    candidates: [
      {
        candidateId: 'cand-ap-1',
        provider: 'fake',
        providerPlaceId: 'place_ap_1',
        label: 'Air Putih, Samarinda',
        formattedAddress: 'Air Putih, Samarinda, Kalimantan Timur, Indonesia',
        city: 'Samarinda',
        province: 'Kalimantan Timur',
        countryCode: 'ID',
        latitude: -0.488888,
        longitude: 117.144444,
        confidence: 'high',
        precision: 'area',
      },
    ],
    status: 'RESOLVED',
  },
};

const DEFAULT_URL_RESOLVE_RESULTS = {
  'https://maps.google.com/?q=-0.502106,117.153709': {
    candidate: {
      candidateId: 'cand-url-1',
      provider: 'fake',
      providerPlaceId: 'place_url_1',
      label: 'Resolved Location',
      formattedAddress: 'Samarinda, Kalimantan Timur, Indonesia',
      city: 'Samarinda',
      province: 'Kalimantan Timur',
      countryCode: 'ID',
      latitude: -0.502106,
      longitude: 117.153709,
      confidence: 'high',
      precision: 'street',
    },
    sourceUrl: 'https://maps.google.com/?q=-0.502106,117.153709',
    status: 'RESOLVED',
  },
};

const DEFAULT_DIRECTIONS_RESULTS = {
  drive: {
    estimatedDistanceMeters: 1500,
    estimatedDurationSeconds: 300,
    googleMapsDirectionsUrl: 'https://maps.google.com/dir/?api=1&origin=-0.502106,117.153709&destination=-0.493793,117.147362&travelmode=driving',
    estimateAvailable: true,
  },
  walk: {
    estimatedDistanceMeters: 1200,
    estimatedDurationSeconds: 900,
    googleMapsDirectionsUrl: 'https://maps.google.com/dir/?api=1&origin=-0.502106,117.153709&destination=-0.493793,117.147362&travelmode=walking',
    estimateAvailable: true,
  },
};

export function createFakeLocationProvider(scenario = 'default') {
  let callCount = 0;
  const calls = [];

  const scenarios = {
    default: {
      geocodeText: async (input, context) => {
        callCount++;
        calls.push({ method: 'geocodeText', input, context });
        const key = Object.keys(DEFAULT_GEOCODE_RESULTS).find(k => input.query?.includes(k.split(',')[0]));
        if (key) return { ...DEFAULT_GEOCODE_RESULTS[key] };
        const fallback = Object.values(DEFAULT_GEOCODE_RESULTS)[0];
        return { ...fallback };
      },
      searchPlaces: async (input, context) => {
        callCount++;
        calls.push({ method: 'searchPlaces', input, context });
        const match = Object.entries(DEFAULT_PLACE_SEARCH_RESULTS).find(([k]) =>
          input.query?.toLowerCase().replace(/[,.]/g, '').includes(
            k.toLowerCase().slice(0, 12).replace(/[,.]/g, '')
          )
        );
        if (match) return { ...match[1] };
        return { candidates: [], status: 'NOT_FOUND' };
      },
      getPlaceDetails: async (input, context) => {
        callCount++;
        calls.push({ method: 'getPlaceDetails', input, context });
        return { ...DEFAULT_GEOCODE_RESULTS[Object.keys(DEFAULT_GEOCODE_RESULTS)[0]]?.candidates[0] };
      },
      resolveMapsUrl: async (input, context) => {
        callCount++;
        calls.push({ method: 'resolveMapsUrl', input, context });
        const match = Object.entries(DEFAULT_URL_RESOLVE_RESULTS).find(([k]) => input.url?.includes(k.slice(0, 30)));
        if (match) return { ...match[1] };
        return { status: 'NOT_FOUND' };
      },
      getDirections: async (input, context) => {
        callCount++;
        calls.push({ method: 'getDirections', input, context });
        const mode = input.mode || 'drive';
        return { ...DEFAULT_DIRECTIONS_RESULTS[mode] || DEFAULT_DIRECTIONS_RESULTS.drive };
      },
      health: async () => ({ status: 'healthy', provider: 'fake', latencyMs: 5 }),
    },
    timeout: {
      geocodeText: async () => { throw new Error('PROVIDER_TIMEOUT'); },
      searchPlaces: async () => { throw new Error('PROVIDER_TIMEOUT'); },
      getPlaceDetails: async () => { throw new Error('PROVIDER_TIMEOUT'); },
      resolveMapsUrl: async () => { throw new Error('PROVIDER_TIMEOUT'); },
      getDirections: async () => { throw new Error('PROVIDER_TIMEOUT'); },
      health: async () => ({ status: 'unhealthy', provider: 'fake', error: 'timeout' }),
    },
    quota_error: {
      geocodeText: async () => { throw new Error('PROVIDER_RATE_LIMITED'); },
      searchPlaces: async () => { throw new Error('PROVIDER_RATE_LIMITED'); },
      getPlaceDetails: async () => { throw new Error('PROVIDER_RATE_LIMITED'); },
      resolveMapsUrl: async () => { throw new Error('PROVIDER_RATE_LIMITED'); },
      getDirections: async () => { throw new Error('PROVIDER_RATE_LIMITED'); },
      health: async () => ({ status: 'degraded', provider: 'fake', error: 'quota_exceeded' }),
    },
    malformed: {
      geocodeText: async () => ({ candidates: null, status: 'INVALID_RESPONSE' }),
      searchPlaces: async () => ({ candidates: null, status: 'INVALID_RESPONSE' }),
      getPlaceDetails: async () => null,
      resolveMapsUrl: async () => ({ status: 'INVALID_RESPONSE' }),
      getDirections: async () => null,
      health: async () => ({ status: 'degraded', provider: 'fake', error: 'malformed' }),
    },
    ambiguous: {
      geocodeText: async () => ({
        candidates: [
          { candidateId: 'cand-amb-1', provider: 'fake', label: 'Lokasi A', city: 'Samarinda', latitude: -0.5, longitude: 117.15, confidence: 'low', precision: 'area' },
          { candidateId: 'cand-amb-2', provider: 'fake', label: 'Lokasi B', city: 'Samarinda', latitude: -0.51, longitude: 117.14, confidence: 'low', precision: 'area' },
        ],
        status: 'AMBIGUOUS',
      }),
      searchPlaces: async () => ({
        candidates: [
          { candidateId: 'cand-amb-p1', provider: 'fake', label: 'Tempat A', city: 'Samarinda', latitude: -0.5, longitude: 117.15, confidence: 'low', precision: 'landmark' },
          { candidateId: 'cand-amb-p2', provider: 'fake', label: 'Tempat B', city: 'Samarinda', latitude: -0.51, longitude: 117.14, confidence: 'low', precision: 'landmark' },
        ],
        status: 'AMBIGUOUS',
      }),
      getPlaceDetails: async () => ({ status: 'AMBIGUOUS' }),
      resolveMapsUrl: async () => ({ status: 'AMBIGUOUS' }),
      getDirections: async () => ({ status: 'AMBIGUOUS' }),
      health: async () => ({ status: 'healthy', provider: 'fake' }),
    },
    not_found: {
      geocodeText: async () => ({ candidates: [], status: 'NOT_FOUND' }),
      searchPlaces: async () => ({ candidates: [], status: 'NOT_FOUND' }),
      getPlaceDetails: async () => ({ status: 'NOT_FOUND' }),
      resolveMapsUrl: async () => ({ status: 'NOT_FOUND' }),
      getDirections: async () => ({ status: 'NOT_FOUND' }),
      health: async () => ({ status: 'healthy', provider: 'fake' }),
    },
  };

  const provider = scenarios[scenario] || scenarios.default;

  return {
    geocodeText: provider.geocodeText,
    searchPlaces: provider.searchPlaces,
    getPlaceDetails: provider.getPlaceDetails,
    resolveMapsUrl: provider.resolveMapsUrl,
    getDirections: provider.getDirections,
    health: provider.health,
    getCallCount: () => callCount,
    getCalls: () => [...calls],
    reset: () => { callCount = 0; calls.length = 0; },
  };
}

export function createScriptedFakeProvider(script = []) {
  let step = 0;
  const callCount = () => step;
  return {
    ...createFakeLocationProvider('default'),
    geocodeText: async (input, context) => {
      const result = script[step] || { candidates: [], status: 'NOT_FOUND' };
      step++;
      return result;
    },
    getCallCount: callCount,
    reset: () => { step = 0; },
  };
}
