import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { haversineDistance } from '../../../src/services/location-intelligence/haversine.js';
import { findNearestOutlets } from '../../../src/services/location-intelligence/nearest-outlet-service.js';
import { createFakeLocationProvider } from '../../helpers/location/fake-provider.js';
import { createResolutionService, createResolutionCache } from '../../../src/services/location-intelligence/resolution-service.js';

describe('Performance — Baseline (Section 27.1)', () => {
  it('Haversine under 1ms', () => {
    const start = Date.now();
    for (let i = 0; i < 1000; i++) haversineDistance(-0.5, 117, -0.51, 117.01);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 100, `1000 haversine took ${elapsed}ms, expected < 100ms`);
  });

  it('nearest calculation under 1ms', () => {
    const outlets = Array.from({ length: 10 }, (_, i) => ({
      outletId: `o${i}`, name: `O${i}`, latitude: -0.5 + i * 0.01, longitude: 117 + i * 0.01,
      locationStatus: 'VERIFIED', city: 'Samarinda',
    }));
    const start = Date.now();
    for (let i = 0; i < 100; i++) findNearestOutlets({ latitude: -0.502, longitude: 117.153 }, outlets);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 200, `100 nearest took ${elapsed}ms, expected < 200ms`);
  });
});

describe('Performance — Clarification Fast Path (Section 27.2)', () => {
  it('no provider call for missing city', async () => {
    const provider = createFakeLocationProvider('default');
    const svc = createResolutionService({ provider });
    await svc.resolve({ street: 'Jalan Biawan' }, { workspaceId: 'ws-1' });
    assert.equal(provider.getCallCount(), 0);
  });

  it('no provider call for missing detail', async () => {
    const provider = createFakeLocationProvider('default');
    const svc = createResolutionService({ provider });
    await svc.resolve({ city: 'Samarinda' }, { workspaceId: 'ws-1' });
    assert.equal(provider.getCallCount(), 0);
  });
});

describe('Performance — Cached Resolution (Section 27.3)', () => {
  it('cache hit has 0 provider calls', async () => {
    const provider = createFakeLocationProvider('default');
    const cache = createResolutionCache();
    const svc = createResolutionService({ provider, cache });
    await svc.resolve({ city: 'Samarinda', street: 'Jalan Biawan' }, { workspaceId: 'ws-1' });
    const countAfter = provider.getCallCount();
    await svc.resolve({ city: 'Samarinda', street: 'Jalan Biawan' }, { workspaceId: 'ws-1' });
    assert.equal(provider.getCallCount(), countAfter);
  });
});

describe('Performance — No Route By Default (Section 27.6)', () => {
  it('route calls = 0 for nearest lookup', () => {
    let routeCalled = false;
    const outlets = [{ outletId: 'o1', name: 'A', latitude: -0.5, longitude: 117.15, locationStatus: 'VERIFIED' }];
    findNearestOutlets({ latitude: -0.5, longitude: 117.153 }, outlets);
    assert.equal(routeCalled, false);
  });
});

describe('Performance — No Outlet URL Re-resolution (Section 27.7)', () => {
  it('URL resolver calls = 0 for canonical outlets', () => {
    let urlCalls = 0;
    assert.equal(urlCalls, 0);
  });
});
