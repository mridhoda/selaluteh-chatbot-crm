import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeLocationProvider } from '../../helpers/location/fake-provider.js';
import { createResolutionService } from '../../../src/services/location-intelligence/resolution-service.js';
import { getClarificationCode } from '../../../src/services/location-intelligence/clarification-mapper.js';
import { isOutletEligible } from '../../../src/services/location-intelligence/outlet-eligibility.js';
import { findNearestOutlets, applyServiceRadius } from '../../../src/services/location-intelligence/nearest-outlet-service.js';
import { createConfirmation } from '../../../src/services/location-intelligence/confirmation-service.js';

describe('Evaluation — Text-First Happy Paths (Section 28.1)', () => {
  it('Jalan Biawan Samarinda resolves', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('default') });
    const r = await svc.resolve({ city: 'Samarinda', street: 'Jalan Biawan' }, { workspaceId: 'ws-1' });
    assert.equal(r.status, 'RESOLVED');
  });
  it('Air Putih Samarinda resolves', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('default') });
    const r = await svc.resolve({ city: 'Samarinda', area: 'Air Putih' }, { workspaceId: 'ws-1' });
    assert.equal(r.status, 'RESOLVED');
  });
  it('Dekat Big Mall Samarinda resolves', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('default') });
    const r = await svc.resolve({ city: 'Samarinda', landmark: 'Big Mall' }, { workspaceId: 'ws-1' });
    assert.equal(r.status, 'RESOLVED');
  });
});

describe('Evaluation — Progressive Clarification (Section 28.2)', () => {
  it('street only asks for city', () => {
    assert.equal(getClarificationCode('MISSING_CITY'), 'ASK_CITY');
  });
  it('city only asks for detail', () => {
    assert.equal(getClarificationCode('MISSING_DETAIL'), 'ASK_STREET_AREA_OR_LANDMARK');
  });
});

describe('Evaluation — Ambiguity (Section 28.3)', () => {
  it('ambiguous candidates returned', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('ambiguous') });
    const r = await svc.resolve({ city: 'Samarinda', area: 'Air Putih' }, { workspaceId: 'ws-1' });
    assert.equal(r.status, 'AMBIGUOUS');
  });
});

describe('Evaluation — Unsupported City (Section 28.4)', () => {
  it('returns outside_supported_city', async () => {
    const svc = createResolutionService({ provider: createFakeLocationProvider('default'), supportedCities: ['Samarinda'] });
    const r = await svc.resolve({ city: 'Jakarta', street: 'Test' }, { workspaceId: 'ws-1' });
    assert.equal(r.status, 'OUTSIDE_SUPPORTED_CITY');
  });
});

describe('Evaluation — Eligibility (Section 28.5)', () => {
  it('active verified pickup eligible', () => {
    assert.ok(isOutletEligible({ active: true, pickupEnabled: true, deletedAt: null, locationStatus: 'VERIFIED', latitude: -0.5, longitude: 117 }));
    assert.equal(isOutletEligible({ active: false, pickupEnabled: true, deletedAt: null, locationStatus: 'VERIFIED', latitude: -0.5, longitude: 117 }), false);
    assert.equal(isOutletEligible({ active: true, pickupEnabled: true, deletedAt: '2026-01-01', locationStatus: 'VERIFIED', latitude: -0.5, longitude: 117 }), false);
  });
});

describe('Evaluation — Ranking (Section 28.6)', () => {
  it('returns recommendation + alternatives', () => {
    const outlets = [
      { outletId: 'o1', name: 'A', latitude: -0.5, longitude: 117.15, locationStatus: 'VERIFIED', city: 'Samarinda' },
      { outletId: 'o2', name: 'B', latitude: -0.51, longitude: 117.14, locationStatus: 'VERIFIED', city: 'Samarinda' },
    ];
    const r = findNearestOutlets({ latitude: -0.502, longitude: 117.153 }, outlets);
    assert(r.recommendation);
    assert.equal(r.alternatives.length, 1);
  });
});

describe('Evaluation — Radius (Section 28.7)', () => {
  it('inside radius included', () => {
    const r = applyServiceRadius({ approximateDistanceMeters: 10000 }, 25000);
    assert.equal(r.withinServiceRadius, true);
  });
  it('outside radius excluded', () => {
    const r = applyServiceRadius({ approximateDistanceMeters: 30000 }, 25000);
    assert.equal(r.withinServiceRadius, false);
  });
});

describe('Evaluation — Confirmation (Section 28.8)', () => {
  it('creates confirmation bound to flow', () => {
    const c = createConfirmation({ flowId: 'f-1', workspaceId: 'ws-1', contactId: 'c-1', recommendedOutletId: 'o-1' });
    assert(c.confirmationId);
  });
});
