import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findNearestOutlets, sortByDistance, applyOpenPreference, applyServiceRadius } from '../../../src/services/location-intelligence/nearest-outlet-service.js';
import { haversineDistance } from '../../../src/services/location-intelligence/haversine.js';

describe('NearestOutletService — Section 12', () => {
  it('returns recommendation + up to 2 alternatives', () => {
    const outlets = [
      { outletId: 'o1', name: 'A', latitude: -0.5, longitude: 117.15, locationStatus: 'VERIFIED', city: 'Samarinda' },
      { outletId: 'o2', name: 'B', latitude: -0.51, longitude: 117.14, locationStatus: 'VERIFIED', city: 'Samarinda' },
      { outletId: 'o3', name: 'C', latitude: -0.49, longitude: 117.16, locationStatus: 'VERIFIED', city: 'Samarinda' },
      { outletId: 'o4', name: 'D', latitude: -0.52, longitude: 117.13, locationStatus: 'VERIFIED', city: 'Samarinda' },
    ];
    const result = findNearestOutlets({ latitude: -0.502, longitude: 117.153 }, outlets);
    assert.equal(result.recommendation.outletId, 'o1');
    assert.equal(result.alternatives.length, 2);
  });

  it('no outlets returns empty', () => {
    const result = findNearestOutlets({ latitude: -0.5, longitude: 117 }, []);
    assert.equal(result.recommendation, null);
    assert.equal(result.alternatives.length, 0);
  });

  it('one outlet returns it as recommendation', () => {
    const outlets = [{ outletId: 'o1', name: 'A', latitude: -0.5, longitude: 117.15, locationStatus: 'VERIFIED' }];
    const result = findNearestOutlets({ latitude: -0.5, longitude: 117.153 }, outlets);
    assert.equal(result.recommendation.outletId, 'o1');
    assert.equal(result.alternatives.length, 0);
  });

  it('ties broken by outlet ID', () => {
    const outlets = [
      { outletId: 'b', name: 'B', latitude: -0.5, longitude: 117.15, locationStatus: 'VERIFIED' },
      { outletId: 'a', name: 'A', latitude: -0.5, longitude: 117.15, locationStatus: 'VERIFIED' },
    ];
    const result = sortByDistance({ latitude: -0.5, longitude: 117.15 }, outlets);
    assert.equal(result[0].outletId, 'a');
  });

  it('non-negative distance', () => {
    const outlets = [{ outletId: 'o1', name: 'A', latitude: -0.5, longitude: 117.15, locationStatus: 'VERIFIED' }];
    const result = findNearestOutlets({ latitude: -0.5, longitude: 117.153 }, outlets);
    assert.ok(result.recommendation.approximateDistanceMeters >= 0);
  });
});

describe('OpenPreference — Section 13', () => {
  it('prefers open outlet within tolerance', () => {
    const outlets = [
      { outletId: 'o1', name: 'Closed Near', latitude: -0.5, longitude: 117.153, openingStatus: 'closed', approximateDistanceMeters: 10 },
      { outletId: 'o2', name: 'Open Slightly Farther', latitude: -0.502, longitude: 117.155, openingStatus: 'open', approximateDistanceMeters: 300 },
    ];
    const result = applyOpenPreference(outlets, { latitude: -0.5, longitude: 117.153 });
    assert.equal(result[0].outletId, 'o2');
  });

  it('closed nearest appears as alternative', () => {
    const outlets = [
      { outletId: 'o1', name: 'Closed Near', latitude: -0.5, longitude: 117.153, openingStatus: 'closed', approximateDistanceMeters: 10 },
      { outletId: 'o2', name: 'Open Far', latitude: -0.52, longitude: 117.2, openingStatus: 'open', approximateDistanceMeters: 8000 },
    ];
    const result = applyOpenPreference(outlets, { latitude: -0.5, longitude: 117.153 });
    assert.equal(result[0].outletId, 'o1');
    assert.equal(result[0].rankReason, 'nearest_absolute');
  });

  it('all closed shows nearest with status', () => {
    const outlets = [
      { outletId: 'o1', name: 'Closed A', latitude: -0.5, longitude: 117.153, openingStatus: 'closed' },
      { outletId: 'o2', name: 'Closed B', latitude: -0.51, longitude: 117.16, openingStatus: 'closed' },
    ];
    const result = applyOpenPreference(outlets, { latitude: -0.5, longitude: 117.153 });
    assert.equal(result[0].outletId, 'o1');
    assert.equal(result[0].openingStatus, 'closed');
  });

  it('unknown schedule defaults to distance', () => {
    const outlets = [
      { outletId: 'o1', name: 'A', latitude: -0.5, longitude: 117.153, openingStatus: 'unknown' },
      { outletId: 'o2', name: 'B', latitude: -0.51, longitude: 117.16, openingStatus: 'unknown' },
    ];
    const result = applyOpenPreference(outlets, { latitude: -0.5, longitude: 117.153 });
    assert.equal(result[0].outletId, 'o1');
  });
});

describe('ServiceRadius — Section 14', () => {
  it('inside radius withinServiceRadius=true', () => {
    const result = applyServiceRadius({ outletId: 'o1', approximateDistanceMeters: 10000 }, 25000);
    assert.equal(result.withinServiceRadius, true);
  });

  it('outside radius withinServiceRadius=false', () => {
    const result = applyServiceRadius({ outletId: 'o1', approximateDistanceMeters: 30000 }, 25000);
    assert.equal(result.withinServiceRadius, false);
  });

  it('exact boundary inside', () => {
    const result = applyServiceRadius({ outletId: 'o1', approximateDistanceMeters: 25000 }, 25000);
    assert.equal(result.withinServiceRadius, true);
  });

  it('zero radius blocks all', () => {
    const result = applyServiceRadius({ outletId: 'o1', approximateDistanceMeters: 1 }, 0);
    assert.equal(result.withinServiceRadius, false);
  });

  it('negative radius treated as zero', () => {
    const result = applyServiceRadius({ outletId: 'o1', approximateDistanceMeters: 1 }, -1);
    assert.equal(result.withinServiceRadius, false);
  });
});
