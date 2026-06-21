import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createOutletLocationRecord, isValidOutletLocationRecord, isEligibleForNearestSearch } from '../../../src/services/location-intelligence/outlet-location-record.js';
import { LocationErrorCode } from '../../../src/services/location-intelligence/errors.js';

describe('OutletLocationRecord — Section 9', () => {
  it('creates record with required fields', () => {
    const r = createOutletLocationRecord({
      outletId: 'outlet-1', workspaceId: 'ws-1', provider: 'google',
      formattedAddress: 'Jalan Biawan', latitude: -0.5, longitude: 117,
      googleMapsUri: 'https://maps.google.com/',
    });
    assert.equal(r.outletId, 'outlet-1');
    assert.equal(r.status, 'UNRESOLVED');
  });

  it('validates coordinates before persistence', () => {
    assert.throws(() => createOutletLocationRecord({
      outletId: 'outlet-1', workspaceId: 'ws-1', provider: 'google',
      formattedAddress: 'Test', latitude: 200, longitude: 117,
      googleMapsUri: 'https://maps.google.com/',
    }), { code: LocationErrorCode.INVALID_COORDINATES });
  });

  it('VERIFIED status eligible for nearest search', () => {
    const r = createOutletLocationRecord({
      outletId: 'outlet-1', workspaceId: 'ws-1', provider: 'google',
      formattedAddress: 'Test', latitude: -0.5, longitude: 117,
      googleMapsUri: 'https://maps.google.com/', status: 'VERIFIED',
    });
    assert.ok(isEligibleForNearestSearch(r));
  });

  it('UNRESOLVED not eligible', () => {
    const r = createOutletLocationRecord({
      outletId: 'outlet-1', workspaceId: 'ws-1', provider: 'google',
      formattedAddress: 'Test', latitude: -0.5, longitude: 117,
      googleMapsUri: 'https://maps.google.com/', status: 'UNRESOLVED',
    });
    assert.equal(isEligibleForNearestSearch(r), false);
  });

  it('workspace/outlet scoped', () => {
    const r = createOutletLocationRecord({
      outletId: 'outlet-1', workspaceId: 'ws-1', provider: 'google',
      formattedAddress: 'Test', latitude: -0.5, longitude: 117,
      googleMapsUri: 'https://maps.google.com/',
    });
    assert.equal(r.workspaceId, 'ws-1');
    assert.equal(r.outletId, 'outlet-1');
  });

  it('location source defaults to provider_resolved', () => {
    const r = createOutletLocationRecord({
      outletId: 'outlet-1', workspaceId: 'ws-1', provider: 'google',
      formattedAddress: 'Test', latitude: -0.5, longitude: 117,
      googleMapsUri: 'https://maps.google.com/',
    });
    assert.equal(r.locationSource, 'provider_resolved');
  });

  it('manual adjustment preserves provider metadata', () => {
    const r = createOutletLocationRecord({
      outletId: 'outlet-1', workspaceId: 'ws-1', provider: 'google',
      providerPlaceId: 'ChIJ123', formattedAddress: 'Test',
      latitude: -0.5, longitude: 117, googleMapsUri: 'https://maps.google.com/',
      locationSource: 'manual_adjustment',
    });
    assert.equal(r.providerPlaceId, 'ChIJ123');
    assert.equal(r.locationSource, 'manual_adjustment');
  });
});
