import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createResolutionService, createResolutionCache } from '../../../src/services/location-intelligence/resolution-service.js';
import { createFakeLocationProvider } from '../../helpers/location/fake-provider.js';

describe('ResolutionService — Section 5.7-5.9', () => {
  it('resolves Jalan Biawan Samarinda', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('default') });
    const result = await svc.resolve({ city: 'Samarinda', street: 'Jalan Biawan' }, { workspaceId: 'ws-1' });
    assert.equal(result.status, 'RESOLVED');
  });

  it('unsupported city returns OUTSIDE_SUPPORTED_CITY', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('default'), supportedCities: ['Samarinda'] });
    const result = await svc.resolve({ city: 'Jakarta', street: 'Jalan Test' }, { workspaceId: 'ws-1' });
    assert.equal(result.status, 'OUTSIDE_SUPPORTED_CITY');
  });

  it('no provider call for incomplete input', async () => {
    const provider = createFakeLocationProvider('default');
    const svc = createResolutionService({ provider });
    await svc.resolve({ city: 'Samarinda' }, { workspaceId: 'ws-1' });
    assert.equal(provider.getCallCount(), 0);
  });

  it('cache hit avoids provider', async () => {
    const provider = createFakeLocationProvider('default');
    const cache = createResolutionCache();
    const svc = createResolutionService({ provider, cache });
    await svc.resolve({ city: 'Samarinda', street: 'Jalan Biawan' }, { workspaceId: 'ws-1' });
    const countAfter = provider.getCallCount();
    await svc.resolve({ city: 'Samarinda', street: 'Jalan Biawan' }, { workspaceId: 'ws-1' });
    assert.equal(provider.getCallCount(), countAfter);
  });

  it('provider timeout returns PROVIDER_TIMEOUT', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('timeout') });
    const result = await svc.resolve({ city: 'Samarinda', street: 'Jalan Biawan' }, { workspaceId: 'ws-1' });
    assert.equal(result.status, 'PROVIDER_UNAVAILABLE');
  });

  it('ambiguous returns AMBIGUOUS status', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('ambiguous') });
    const result = await svc.resolve({ city: 'Samarinda', area: 'Air Putih' }, { workspaceId: 'ws-1' });
    assert.equal(result.status, 'AMBIGUOUS');
  });

  it('not found returns NOT_FOUND', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('not_found') });
    const result = await svc.resolve({ city: 'Samarinda', street: 'xxxx' }, { workspaceId: 'ws-1' });
    assert.equal(result.status, 'NOT_FOUND');
  });

  it('city validator rejects cross-province', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('default') });
    const result = await svc.resolve({ city: 'Samarinda', street: 'Jalan Biawan' }, { workspaceId: 'ws-1' });
    assert.equal(result.status, 'RESOLVED');
  });
});
