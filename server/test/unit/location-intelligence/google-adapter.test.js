import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGoogleMapsClient, buildGoogleGeocodeResult, buildGooglePlaceResult } from '../../../src/services/location-intelligence/google-adapter.js';

describe('GoogleAdapter — Sections 4.4-4.6, 5.3-5.4', () => {
  it('geocode returns normalized candidates', async () => {
    const adapter = createGoogleMapsClient({ apiKey: 'test-key' });
    const result = await adapter.geocodeText({ query: 'Jalan Biawan, Samarinda, Indonesia' }, { workspaceId: 'ws-1' });
    assert(result.candidates.length > 0);
    assert.equal(result.candidates[0].provider, 'google-mock');
  });

  it('place search returns landmarks', async () => {
    const adapter = createGoogleMapsClient({ apiKey: 'test-key' });
    const result = await adapter.searchPlaces({ query: 'Big Mall Samarinda' }, { workspaceId: 'ws-1' });
    assert(result.candidates.length > 0);
  });

  it('place details returns single candidate', async () => {
    const adapter = createGoogleMapsClient({ apiKey: 'test-key' });
    const result = await adapter.getPlaceDetails({ placeId: 'ChIJ123' }, { workspaceId: 'ws-1' });
    assert(result);
    assert.equal(result.candidateId, 'pd-1');
  });

  it('health returns status', async () => {
    const adapter = createGoogleMapsClient({ apiKey: 'test-key' });
    const h = await adapter.health();
    assert.equal(h.status, 'mock');
  });

  it('invalid key reports unhealthy', async () => {
    const adapter = createGoogleMapsClient({});
    const h = await adapter.health();
    assert.equal(h.status, 'unhealthy');
  });

  it('buildGeocodeResult creates candidate', () => {
    const c = buildGoogleGeocodeResult({ label: 'Jalan Biawan', latitude: -0.5, longitude: 117, confidence: 'high', precision: 'street' });
    assert.equal(c.confidence, 'high');
    assert.equal(c.precision, 'street');
  });

  it('buildPlaceResult creates candidate', () => {
    const c = buildGooglePlaceResult({ label: 'Big Mall', latitude: -0.49, longitude: 117.14, confidence: 'high', precision: 'landmark' });
    assert.equal(c.precision, 'landmark');
  });
});
