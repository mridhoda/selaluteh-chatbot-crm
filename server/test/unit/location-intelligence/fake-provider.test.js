import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeLocationProvider, createScriptedFakeProvider } from '../../helpers/location/fake-provider.js';

describe('Fake Location Provider', () => {
  it('returns deterministic geocode result', async () => {
    const provider = createFakeLocationProvider('default');
    const result = await provider.geocodeText({ query: 'Jalan Biawan Samarinda' }, { workspaceId: 'ws-1' });
    assert(result.candidates);
    assert(result.candidates.length > 0);
    assert.equal(result.candidates[0].city, 'Samarinda');
  });

  it('increments call count', async () => {
    const provider = createFakeLocationProvider('default');
    assert.equal(provider.getCallCount(), 0);
    await provider.geocodeText({ query: 'test' }, { workspaceId: 'ws-1' });
    assert.equal(provider.getCallCount(), 1);
    await provider.searchPlaces({ query: 'test' }, { workspaceId: 'ws-1' });
    assert.equal(provider.getCallCount(), 2);
  });

  it('tracks method calls', async () => {
    const provider = createFakeLocationProvider('default');
    await provider.geocodeText({ query: 'test' }, { workspaceId: 'ws-1' });
    const calls = provider.getCalls();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, 'geocodeText');
  });

  it('reset clears state', async () => {
    const provider = createFakeLocationProvider('default');
    await provider.geocodeText({ query: 'test' }, { workspaceId: 'ws-1' });
    provider.reset();
    assert.equal(provider.getCallCount(), 0);
    assert.equal(provider.getCalls().length, 0);
  });

  it('timeout scenario throws PROVIDER_TIMEOUT', async () => {
    const provider = createFakeLocationProvider('timeout');
    await assert.rejects(
      () => provider.geocodeText({ query: 'test' }, { workspaceId: 'ws-1' }),
      /PROVIDER_TIMEOUT/
    );
  });

  it('quota_error scenario throws PROVIDER_RATE_LIMITED', async () => {
    const provider = createFakeLocationProvider('quota_error');
    await assert.rejects(
      () => provider.geocodeText({ query: 'test' }, { workspaceId: 'ws-1' }),
      /PROVIDER_RATE_LIMITED/
    );
  });

  it('ambiguous scenario returns multiple candidates', async () => {
    const provider = createFakeLocationProvider('ambiguous');
    const result = await provider.geocodeText({ query: 'test' }, { workspaceId: 'ws-1' });
    assert.equal(result.status, 'AMBIGUOUS');
    assert(result.candidates.length >= 2);
  });

  it('not_found scenario returns empty candidates', async () => {
    const provider = createFakeLocationProvider('not_found');
    const result = await provider.geocodeText({ query: 'test' }, { workspaceId: 'ws-1' });
    assert.equal(result.status, 'NOT_FOUND');
    assert.equal(result.candidates.length, 0);
  });

  it('malformed scenario returns null/empty response', async () => {
    const provider = createFakeLocationProvider('malformed');
    const result = await provider.geocodeText({ query: 'test' }, { workspaceId: 'ws-1' });
    assert.equal(result.candidates, null);
  });

  it('health returns provider status', async () => {
    const provider = createFakeLocationProvider('default');
    const health = await provider.health();
    assert.equal(health.status, 'healthy');
    assert.equal(health.provider, 'fake');
  });

  it('place search detects landmark', async () => {
    const provider = createFakeLocationProvider('default');
    const result = await provider.searchPlaces({ query: 'Big Mall Samarinda' }, { workspaceId: 'ws-1' });
    assert(result.candidates.length > 0);
    assert.equal(result.candidates[0].precision, 'landmark');
  });

  it('directions returns both modes', async () => {
    const provider = createFakeLocationProvider('default');
    const drive = await provider.getDirections({ mode: 'drive' }, { workspaceId: 'ws-1' });
    assert(drive.estimatedDurationSeconds);
    assert(drive.googleMapsDirectionsUrl);

    const walk = await provider.getDirections({ mode: 'walk' }, { workspaceId: 'ws-1' });
    assert(walk.estimatedDurationSeconds);
    assert(walk.googleMapsDirectionsUrl);
  });

  it('scripted provider follows script', async () => {
    const provider = createScriptedFakeProvider([
      { candidates: [], status: 'NOT_FOUND' },
      { candidates: [{ candidateId: 'c-1', label: 'Found', latitude: 0, longitude: 0, confidence: 'high', precision: 'street' }], status: 'RESOLVED' },
    ]);
    const r1 = await provider.geocodeText({ query: 'a' }, { workspaceId: 'ws-1' });
    assert.equal(r1.status, 'NOT_FOUND');
    const r2 = await provider.geocodeText({ query: 'b' }, { workspaceId: 'ws-1' });
    assert.equal(r2.status, 'RESOLVED');
  });

  it('default scenario returns results for all methods', async () => {
    const provider = createFakeLocationProvider('default');
    const pd = await provider.getPlaceDetails({ placeId: 'test' }, { workspaceId: 'ws-1' });
    assert(pd);
    const url = await provider.resolveMapsUrl({ url: 'https://maps.google.com/?q=-0.502106,117.153709' }, { workspaceId: 'ws-1' });
    assert(url.candidate);
    assert.equal(url.status, 'RESOLVED');
  });
});
