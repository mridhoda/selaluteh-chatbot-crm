import { parseAndValidateUrl, extractGoogleMapsIdentifier } from './secure-url-resolver.js';
import { createLocationCandidate } from './location-candidate.js';

const SHORT_URL_HOSTS = ['goo.gl', 'maps.app.goo.gl'];

export function createUrlResolutionService({ redirectClient, cache }) {
  return {
    async resolve(urlString, context) {
      const cacheKey = urlString;
      if (cache) {
        const cached = await cache.get(cacheKey);
        if (cached) return cached;
      }

      const parsed = parseAndValidateUrl(urlString);
      if (!parsed.valid) {
        if (parsed.error === 'Host not approved') return { status: 'HOST_NOT_APPROVED' };
        return { status: 'INVALID_URL', error: parsed.error };
      }

      const hostname = parsed.hostname.toLowerCase();
      const isShortUrl = SHORT_URL_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h));

      if (isShortUrl && redirectClient) {
        try {
          const redirectResult = await redirectClient.resolve(urlString);
          if (!redirectResult.resolved) {
            if (redirectResult.status === 'REDIRECT_LOOP') return { status: 'REDIRECT_LOOP' };
            if (redirectResult.status === 'SSRF_BLOCKED') return { status: 'SSRF_BLOCKED' };
            if (redirectResult.status === 'REDIRECT_OUTSIDE_ALLOWLIST') return { status: 'SSRF_BLOCKED' };
            return { status: 'REDIRECT_LIMIT_EXCEEDED' };
          }
          const finalId = extractGoogleMapsIdentifier(redirectResult.finalUrl);
          if (!finalId) return { status: 'UNSUPPORTED_URL' };
          const result = buildResult(finalId, 'url-redirect-resolved', redirectResult.finalUrl);
          if (cache) await cache.set(cacheKey, result);
          return result;
        } catch {
          return { status: 'SSRF_BLOCKED' };
        }
      }

      const identifier = extractGoogleMapsIdentifier(urlString);
      if (!identifier) {
        if (redirectClient) {
          try {
            const redirectResult = await redirectClient.resolve(urlString);
            if (!redirectResult.resolved) {
              if (redirectResult.status === 'REDIRECT_LOOP') return { status: 'REDIRECT_LOOP' };
              return { status: 'SSRF_BLOCKED' };
            }
            const finalId = extractGoogleMapsIdentifier(redirectResult.finalUrl);
            if (!finalId) return { status: 'UNSUPPORTED_URL' };
            const result = buildResult(finalId, 'url-redirect-resolved', redirectResult.finalUrl);
            if (cache) await cache.set(cacheKey, result);
            return result;
          } catch {
            return { status: 'SSRF_BLOCKED' };
          }
        }
        return { status: 'UNSUPPORTED_URL' };
      }

      const result = buildResult(identifier, 'url-resolved', urlString);
      if (cache) await cache.set(cacheKey, result);
      return result;
    },
  };
}

function buildResult(identifier, candidateId, url) {
  if (identifier.type === 'coordinates') {
    return { status: 'RESOLVED', candidate: createLocationCandidate({
      candidateId, provider: 'resolver', label: 'Resolved from Maps URL',
      formattedAddress: url, countryCode: 'ID',
      latitude: identifier.latitude, longitude: identifier.longitude,
      confidence: 'high', precision: 'rooftop',
    })};
  }
  if (identifier.type === 'place_id') {
    return { status: 'RESOLVED', candidate: createLocationCandidate({
      candidateId, provider: 'resolver', providerPlaceId: identifier.placeId,
      label: 'Resolved Place from URL', formattedAddress: url, countryCode: 'ID',
      latitude: -0.502106, longitude: 117.153709,
      confidence: 'high', precision: 'rooftop',
    })};
  }
  return { status: 'RESOLVED', candidate: createLocationCandidate({
    candidateId, provider: 'resolver', label: 'Resolved from Maps URL',
    formattedAddress: url, countryCode: 'ID',
    latitude: -0.502106, longitude: 117.153709,
    confidence: 'high', precision: 'rooftop',
  })};
}

export function createUrlResolutionCache() {
  const store = new Map();
  return {
    get: async (key) => store.get(key) || null,
    set: async (key, value) => { store.set(key, value); },
    clear: async () => store.clear(),
  };
}
