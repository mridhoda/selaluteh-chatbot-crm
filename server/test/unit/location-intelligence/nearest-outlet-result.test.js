import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createNearestOutletResult,
  isValidNearestOutletResult,
} from '../../../src/services/location-intelligence/nearest-outlet-result.js';

describe('NearestOutletResult — Task 1.7', () => {
  it('creates valid result with required fields', () => {
    const r = createNearestOutletResult({
      outletId: 'outlet-1',
      name: 'SelaluTeh Samarinda',
      formattedAddress: 'Jalan Biawan No. 10',
      approximateDistanceMeters: 1200,
      googleMapsUrl: 'https://maps.google.com/?q=-0.5,117',
    });
    assert.ok(isValidNearestOutletResult(r));
    assert.equal(r.outletId, 'outlet-1');
  });

  describe('Negative distance rejected', () => {
    it('throws on negative distance', () => {
      assert.throws(() => {
        createNearestOutletResult({
          outletId: 'outlet-1',
          name: 'Test',
          formattedAddress: 'Addr',
          approximateDistanceMeters: -100,
          googleMapsUrl: 'https://maps.google.com/',
        });
      }, /negative/i);
    });
  });

  describe('Missing outlet ID rejected', () => {
    it('fails validation without outletId', () => {
      const r = createNearestOutletResult({
        name: 'Test',
        formattedAddress: 'Addr',
        approximateDistanceMeters: 100,
        googleMapsUrl: 'https://maps.google.com/',
      });
      assert.equal(isValidNearestOutletResult(r), false);
    });
  });

  describe('Haversine result cannot include travel duration', () => {
    it('accepted without travelDuration', () => {
      const r = createNearestOutletResult({
        outletId: 'outlet-1',
        name: 'Test',
        formattedAddress: 'Addr',
        approximateDistanceMeters: 100,
        googleMapsUrl: 'https://maps.google.com/',
      });
      assert.equal(r.travelDurationSeconds, undefined);
    });

    it('throws if travelDurationSeconds provided with haversine source', () => {
      assert.throws(() => {
        createNearestOutletResult({
          outletId: 'outlet-1',
          name: 'Test',
          formattedAddress: 'Addr',
          approximateDistanceMeters: 100,
          googleMapsUrl: 'https://maps.google.com/',
          travelDurationSeconds: 300,
          calculationMethod: 'HAVERSINE',
        });
      }, /Haversine cannot include travel duration/);
    });
  });

  describe('Outside-radius status consistent', () => {
    it('withinServiceRadius defaults to true', () => {
      const r = createNearestOutletResult({
        outletId: 'outlet-1',
        name: 'Test',
        formattedAddress: 'Addr',
        approximateDistanceMeters: 100,
        googleMapsUrl: 'https://maps.google.com/',
      });
      assert.equal(r.withinServiceRadius, true);
    });

    it('explicit outside radius set correctly', () => {
      const r = createNearestOutletResult({
        outletId: 'outlet-1',
        name: 'Test',
        formattedAddress: 'Addr',
        approximateDistanceMeters: 50000,
        googleMapsUrl: 'https://maps.google.com/',
        withinServiceRadius: false,
        rankReason: 'nearest_open',
      });
      assert.equal(r.withinServiceRadius, false);
    });
  });

  describe('Default opening status', () => {
    it('defaults to unknown when not specified', () => {
      const r = createNearestOutletResult({
        outletId: 'outlet-1',
        name: 'Test',
        formattedAddress: 'Addr',
        approximateDistanceMeters: 100,
        googleMapsUrl: 'https://maps.google.com/',
      });
      assert.equal(r.openingStatus, 'unknown');
    });
  });
});
