import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Coordinate } from '../../../src/services/location-intelligence/coordinate.js';
import { LocationErrorCode } from '../../../src/services/location-intelligence/errors.js';

describe('Coordinate — Task 1.4', () => {
  describe('RED — Validation failures', () => {
    it('latitude below -90 rejected', () => {
      assert.throws(() => new Coordinate(-91, 117), { code: LocationErrorCode.INVALID_COORDINATES });
    });

    it('latitude above 90 rejected', () => {
      assert.throws(() => new Coordinate(91, 117), { code: LocationErrorCode.INVALID_COORDINATES });
    });

    it('longitude below -180 rejected', () => {
      assert.throws(() => new Coordinate(-0.5, -181), { code: LocationErrorCode.INVALID_COORDINATES });
    });

    it('longitude above 180 rejected', () => {
      assert.throws(() => new Coordinate(-0.5, 181), { code: LocationErrorCode.INVALID_COORDINATES });
    });

    it('NaN latitude rejected', () => {
      assert.throws(() => new Coordinate(NaN, 117), { code: LocationErrorCode.INVALID_COORDINATES });
    });

    it('NaN longitude rejected', () => {
      assert.throws(() => new Coordinate(-0.5, NaN), { code: LocationErrorCode.INVALID_COORDINATES });
    });

    it('Infinity latitude rejected', () => {
      assert.throws(() => new Coordinate(Infinity, 117), { code: LocationErrorCode.INVALID_COORDINATES });
    });

    it('Infinity longitude rejected', () => {
      assert.throws(() => new Coordinate(-0.5, -Infinity), { code: LocationErrorCode.INVALID_COORDINATES });
    });
  });

  describe('GREEN — Valid coordinates', () => {
    it('valid Indonesia coordinate accepted', () => {
      const c = new Coordinate(-0.502106, 117.153709);
      assert.equal(c.latitude, -0.502106);
      assert.equal(c.longitude, 117.153709);
    });

    it('valid Jakarta coordinate accepted', () => {
      const c = new Coordinate(-6.2088, 106.8456);
      assert.equal(c.latitude, -6.2088);
      assert.equal(c.longitude, 106.8456);
    });

    it('valid polar latitude accepted', () => {
      const c = new Coordinate(90, 0);
      assert.equal(c.latitude, 90);
    });

    it('valid equator coordinate accepted', () => {
      const c = new Coordinate(0, 0);
      assert.equal(c.latitude, 0);
      assert.equal(c.longitude, 0);
    });

    it('valid negative longitude accepted', () => {
      const c = new Coordinate(0, -180);
      assert.equal(c.longitude, -180);
    });
  });

  describe('Immutability', () => {
    it('object is frozen', () => {
      const c = new Coordinate(-0.5, 117);
      assert.ok(Object.isFrozen(c));
    });

    it('properties cannot be reassigned', () => {
      const c = new Coordinate(-0.5, 117);
      assert.throws(() => { c.latitude = 10; }, /Cannot assign to read only/);
    });
  });

  describe('Serialization helpers', () => {
    it('toJSON returns lat/lng object', () => {
      const c = new Coordinate(-0.502106, 117.153709);
      const json = c.toJSON();
      assert.equal(json.latitude, -0.502106);
      assert.equal(json.longitude, 117.153709);
    });

    it('toString returns formatted string', () => {
      const c = new Coordinate(-0.502106, 117.153709);
      assert.equal(c.toString(), '-0.502106,117.153709');
    });

    it('toArray returns [lng, lat] for GeoJSON', () => {
      const c = new Coordinate(-0.502106, 117.153709);
      const arr = c.toArray();
      assert.equal(arr[0], 117.153709);
      assert.equal(arr[1], -0.502106);
    });

    it('equals compares coordinates', () => {
      const a = new Coordinate(-0.5, 117);
      const b = new Coordinate(-0.5, 117);
      const c = new Coordinate(-0.5, 118);
      assert.ok(a.equals(b));
      assert.equal(a.equals(c), false);
    });
  });
});
