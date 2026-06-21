import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeLocationProvider } from '../../helpers/location/fake-provider.js';
import { createResolutionService } from '../../../src/services/location-intelligence/resolution-service.js';

describe('Resilience — Provider Timeout (Section 25.2)', () => {
  it('timeout not reported as not-found', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('timeout') });
    const r = await svc.resolve({ city: 'Samarinda', street: 'Jalan Biawan' }, { workspaceId: 'ws-1' });
    assert.notEqual(r.status, 'NOT_FOUND');
  });
});

describe('Resilience — Provider Quota (Section 25.3)', () => {
  it('quota error returns provider_unavailable', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('quota_error') });
    const r = await svc.resolve({ city: 'Samarinda', street: 'Jalan Biawan' }, { workspaceId: 'ws-1' });
    assert.equal(r.status, 'PROVIDER_UNAVAILABLE');
  });
});

describe('Resilience — Provider Malformed Response (Section 25.8)', () => {
  it('malformed response handled gracefully', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('malformed') });
    const r = await svc.resolve({ city: 'Samarinda', street: 'Jalan Biawan' }, { workspaceId: 'ws-1' });
    assert.notEqual(r.status, 'RESOLVED');
  });
});
