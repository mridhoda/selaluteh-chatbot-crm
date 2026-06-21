import { evaluateCompleteness } from './completeness-evaluator.js';
import { normalizeQuery } from './query-normalizer.js';
import { selectResolutionStrategy } from './strategy-selector.js';
import { getClarificationCode } from './clarification-mapper.js';
import { LocationError, LocationErrorCode } from './errors.js';

const SUPPORTED_CITIES_DEFAULT = ['Samarinda', 'Balikpapan', 'Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar', 'Yogyakarta', 'Semarang', 'Palembang', 'Tangerang', 'Bekasi', 'Depok', 'Bogor', 'Malang', 'Tenggarong', 'Bontang'];

export function createResolutionService({ provider, cache, supportedCities = SUPPORTED_CITIES_DEFAULT }) {
  return {
    async resolve(fields, context) {
      const completeness = evaluateCompleteness(fields);

      if (completeness === 'MISSING_CITY' || completeness === 'MISSING_DETAIL') {
        return { status: completeness, clarificationCode: getClarificationCode(completeness), candidates: [] };
      }

      if (completeness === 'READY_TO_CALCULATE') {
        return { status: 'RESOLVED', directCoordinates: true, latitude: fields.protectedLatitude, longitude: fields.protectedLongitude, candidates: [] };
      }

      if (!supportedCities.some(c => c.toLowerCase() === (fields.city || '').toLowerCase())) {
        return { status: 'OUTSIDE_SUPPORTED_CITY', candidates: [], supportedCities };
      }

      const cacheKey = `${fields.city}:${fields.street || ''}:${fields.area || ''}`;
      if (cache) {
        const cached = await cache.get(cacheKey);
        if (cached) return cached;
      }

      const fieldType = fields.landmark ? 'landmark' : (fields.street ? 'street' : 'structured_address');
      const strategy = selectResolutionStrategy(fieldType, !fields.city);

      if (strategy === 'incomplete') {
        return { status: 'MISSING_CITY', candidates: [] };
      }

      let result;
      try {
        const query = normalizeQuery(fields);
        if (strategy === 'place_search') {
          result = await provider.searchPlaces({ query }, context);
        } else {
          result = await provider.geocodeText({ query }, context);
        }
      } catch (err) {
        const mapped = err.message?.includes('TIMEOUT') || err.message?.includes('RATE_LIMITED')
          ? err.message
          : 'PROVIDER_UNAVAILABLE';
        return { status: mapped === 'PROVIDER_TIMEOUT' ? 'PROVIDER_UNAVAILABLE' : 'PROVIDER_UNAVAILABLE', candidates: [] };
      }

      if (!result.candidates || result.candidates.length === 0) {
        return { status: 'NOT_FOUND', candidates: [] };
      }

      if (result.status === 'AMBIGUOUS') {
        return { status: 'AMBIGUOUS', candidates: result.candidates };
      }

      const validCandidates = result.candidates.filter(c => {
        const cityMatch = !fields.city || (c.city && c.city.toLowerCase() === fields.city.toLowerCase());
        return cityMatch;
      });

      if (validCandidates.length === 0) {
        if (result.candidates.length > 0) {
          return { status: 'AMBIGUOUS', candidates: result.candidates };
        }
        return { status: 'NOT_FOUND', candidates: [] };
      }

      const output = { status: 'RESOLVED', candidates: validCandidates };
      if (cache) await cache.set(cacheKey, output);
      return output;
    },
  };
}

export function createResolutionCache() {
  const store = new Map();
  return {
    get: async (key) => store.get(key) || null,
    set: async (key, value) => { store.set(key, value); },
    clear: async () => store.clear(),
  };
}
