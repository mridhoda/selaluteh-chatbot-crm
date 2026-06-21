import { createLocationCandidate } from './location-candidate.js';
import { LocationError, LocationErrorCode } from './errors.js';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'SelaluTehChatbotCRM/1.0';
const RATE_LIMIT_MS = 1100;

let lastCallTime = 0;

async function rateLimitedFetch(url) {
  const now = Date.now();
  const wait = Math.max(0, RATE_LIMIT_MS - (now - lastCallTime));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCallTime = Date.now();

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'id' },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  return res.json();
}

export function createNominatimClient(_config) {
  let callCount = 0;
  const calls = [];

  return {
    async geocodeText(input, context) {
      callCount++;
      calls.push({ method: 'geocodeText', input, context });
      const q = encodeURIComponent((input.query || `${input.street || ''} ${input.city || ''}`).trim());
      const url = `${NOMINATIM_BASE}/search?q=${q}&format=json&limit=5&countrycodes=id&addressdetails=1`;
      const data = await rateLimitedFetch(url);

      if (!Array.isArray(data) || data.length === 0) {
        return { candidates: [], status: 'NOT_FOUND' };
      }

      const candidates = data.slice(0, 5).map((item, i) => {
        const addr = item.address || {};
        const precisionMap = {
          house_number: 'rooftop',
          road: 'street',
          suburb: 'area',
          neighbourhood: 'area',
          village: 'area',
          town: 'city',
          city: 'city',
          county: 'city',
          state: 'city',
        };
        const precision = precisionMap[item.type] || 'unknown';

        return createLocationCandidate({
          candidateId: `nom-${callCount}-${i}`,
          provider: 'nominatim',
          providerPlaceId: item.osm_id ? `osm-${item.osm_type}-${item.osm_id}` : undefined,
          label: item.display_name?.split(',')[0] || item.name || input.query,
          formattedAddress: item.display_name,
          city: addr.city || addr.town || addr.village || addr.municipality || addr.county,
          province: addr.state,
          countryCode: addr.country_code?.toUpperCase() || 'ID',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          confidence: i === 0 ? 'high' : 'medium',
          precision,
        });
      });

      return {
        candidates,
        status: candidates.length === 1 ? 'RESOLVED' : candidates.length > 1 ? 'AMBIGUOUS' : 'NOT_FOUND',
      };
    },

    async searchPlaces(input, context) {
      callCount++;
      calls.push({ method: 'searchPlaces', input, context });
      const q = encodeURIComponent(input.query || '');
      const url = `${NOMINATIM_BASE}/search?q=${q}&format=json&limit=5&countrycodes=id&addressdetails=1`;
      const data = await rateLimitedFetch(url);

      if (!Array.isArray(data) || data.length === 0) {
        return { candidates: [], status: 'NOT_FOUND' };
      }

      const candidates = data.slice(0, 5).map((item, i) => {
        const addr = item.address || {};
        const classification = item.type === 'tourism' || item.type === 'leisure' || item.type === 'shop'
          ? 'landmark' : 'area';

        return createLocationCandidate({
          candidateId: `nom-pl-${callCount}-${i}`,
          provider: 'nominatim',
          providerPlaceId: item.osm_id ? `osm-${item.osm_type}-${item.osm_id}` : undefined,
          label: item.display_name?.split(',')[0] || item.name || input.query,
          formattedAddress: item.display_name,
          city: addr.city || addr.town || addr.village,
          province: addr.state,
          countryCode: addr.country_code?.toUpperCase() || 'ID',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          confidence: i === 0 ? 'high' : 'medium',
          precision: classification,
        });
      });

      return {
        candidates,
        status: candidates.length === 1 ? 'RESOLVED' : 'AMBIGUOUS',
      };
    },

    async getPlaceDetails(input, context) {
      callCount++;
      calls.push({ method: 'getPlaceDetails', input, context });
      const osmMatch = input.placeId?.match(/^osm-(node|way|relation)-(\d+)$/);
      if (!osmMatch) return null;
      const url = `${NOMINATIM_BASE}/details?osmtype=${osmMatch[1][0]}&osmid=${osmMatch[2]}&format=json&addressdetails=1`;
      const data = await rateLimitedFetch(url);

      if (!data || data.error) return null;

      return createLocationCandidate({
        candidateId: `nom-dt-${callCount}`,
        provider: 'nominatim',
        providerPlaceId: input.placeId,
        label: (data.address || {}).road || input.placeId,
        formattedAddress: data.address?.display_name || data.display_name,
        city: data.address?.city || data.address?.town,
        province: data.address?.state,
        countryCode: 'ID',
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lon),
        confidence: 'high',
        precision: 'rooftop',
      });
    },

    async resolveMapsUrl(input, context) {
      return { status: 'NOT_FOUND' };
    },

    async getDirections(input, context) {
      return { estimatedDistanceMeters: 0, estimatedDurationSeconds: 0, estimateAvailable: false };
    },

    async health() {
      try {
        const url = `${NOMINATIM_BASE}/status.php?format=json`;
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        const data = await res.json();
        if (data.status === 0) return { status: 'healthy', provider: 'nominatim', latencyMs: 5 };
        return { status: 'degraded', provider: 'nominatim', message: data.message };
      } catch {
        return { status: 'unhealthy', provider: 'nominatim' };
      }
    },

    getCallCount: () => callCount,
    getCalls: () => [...calls],
    reset: () => { callCount = 0; calls.length = 0; },
  };
}
