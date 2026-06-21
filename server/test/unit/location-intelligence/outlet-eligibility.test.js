import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isOutletEligible } from '../../../src/services/location-intelligence/outlet-eligibility.js';

describe('OutletEligibility — Section 11', () => {
  it('active, pickup, verified, valid coords → eligible', () => {
    const result = isOutletEligible({
      active: true,
      pickupEnabled: true,
      deletedAt: null,
      operationallyDisabled: false,
      locationStatus: 'VERIFIED',
      latitude: -0.5,
      longitude: 117,
    });
    assert.equal(result, true);
  });

  it('inactive → not eligible', () => {
    const result = isOutletEligible({
      active: false,
      pickupEnabled: true,
      deletedAt: null,
      locationStatus: 'VERIFIED',
      latitude: -0.5,
      longitude: 117,
    });
    assert.equal(result, false);
  });

  it('pickup disabled → not eligible', () => {
    const result = isOutletEligible({
      active: true,
      pickupEnabled: false,
      deletedAt: null,
      locationStatus: 'VERIFIED',
      latitude: -0.5,
      longitude: 117,
    });
    assert.equal(result, false);
  });

  it('deleted → not eligible', () => {
    const result = isOutletEligible({
      active: true,
      pickupEnabled: true,
      deletedAt: '2026-01-01',
      locationStatus: 'VERIFIED',
      latitude: -0.5,
      longitude: 117,
    });
    assert.equal(result, false);
  });

  it('unverified location → not eligible', () => {
    const result = isOutletEligible({
      active: true,
      pickupEnabled: true,
      deletedAt: null,
      locationStatus: 'RESOLVED',
      latitude: -0.5,
      longitude: 117,
    });
    assert.equal(result, false);
  });

  it('invalid coordinates → not eligible', () => {
    const result = isOutletEligible({
      active: true,
      pickupEnabled: true,
      deletedAt: null,
      locationStatus: 'VERIFIED',
      latitude: 200,
      longitude: 117,
    });
    assert.equal(result, false);
  });
});
