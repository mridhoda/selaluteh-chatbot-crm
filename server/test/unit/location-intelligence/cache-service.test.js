import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCacheEntry, getDefaultTtlMs, CACHE_NAMESPACES } from '../../../src/services/location-intelligence/cache-service.js';

describe('CacheService — Section 19', () => {
  it('has all required namespaces', () => {
    assert.ok(CACHE_NAMESPACES.includes('location:resolved-text'));
    assert.ok(CACHE_NAMESPACES.includes('location:ambiguous'));
    assert.ok(CACHE_NAMESPACES.includes('location:not-found'));
    assert.ok(CACHE_NAMESPACES.includes('location:supported-cities'));
    assert.ok(CACHE_NAMESPACES.includes('location:directions'));
  });

  it('resolved-text TTL is 7 days', () => {
    const ttl = getDefaultTtlMs('location:resolved-text');
    assert.equal(ttl, 7 * 24 * 60 * 60 * 1000);
  });

  it('not-found TTL is 10 minutes', () => {
    const ttl = getDefaultTtlMs('location:not-found');
    assert.equal(ttl, 10 * 60 * 1000);
  });

  it('directions TTL is 10 minutes', () => {
    const ttl = getDefaultTtlMs('location:directions');
    assert.equal(ttl, 10 * 60 * 1000);
  });

  it('creates cache entry with key', () => {
    const entry = createCacheEntry('location:resolved-text', 'query-hash', { data: 'test' });
    assert.equal(entry.namespace, 'location:resolved-text');
    assert.equal(entry.key, 'query-hash');
  });
});
