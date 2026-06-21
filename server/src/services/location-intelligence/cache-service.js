export const CACHE_NAMESPACES = [
  'location:resolved-text', 'location:ambiguous', 'location:not-found',
  'location:supported-cities', 'location:opening-status',
  'location:directions', 'location:url-resolution',
];

const TTL_CONFIG = {
  'location:resolved-text': 7 * 24 * 60 * 60 * 1000,
  'location:ambiguous': 60 * 60 * 1000,
  'location:not-found': 10 * 60 * 1000,
  'location:supported-cities': 5 * 60 * 1000,
  'location:opening-status': 5 * 60 * 1000,
  'location:directions': 10 * 60 * 1000,
  'location:url-resolution': 7 * 24 * 60 * 60 * 1000,
};

export function getDefaultTtlMs(namespace) {
  return TTL_CONFIG[namespace] || 60 * 1000;
}

export function createCacheEntry(namespace, key, value) {
  return { namespace, key, value, ttl: getDefaultTtlMs(namespace) };
}
