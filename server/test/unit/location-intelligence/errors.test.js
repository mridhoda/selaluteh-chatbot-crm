import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LocationError,
  LocationErrorCode,
  isLocationErrorCode,
  mapProviderError,
  createCustomerSafeError,
} from '../../../src/services/location-intelligence/errors.js';

describe('LocationError — Task 1.8', () => {
  describe('Stable domain error class', () => {
    it('creates error with code and message', () => {
      const err = new LocationError(LocationErrorCode.INVALID_COORDINATES, 'Invalid coordinates');
      assert.equal(err.code, LocationErrorCode.INVALID_COORDINATES);
      assert.equal(err.message, 'Invalid coordinates');
      assert(err instanceof Error);
    });

    it('has default HTTP status 400', () => {
      const err = new LocationError(LocationErrorCode.CITY_REQUIRED, 'City required');
      assert.equal(err.httpStatus, 400);
    });

    it('allows custom HTTP status', () => {
      const err = new LocationError(LocationErrorCode.INTERNAL_ERROR, 'Internal', 500);
      assert.equal(err.httpStatus, 500);
    });
  });

  describe('All LOCATION_* error codes', () => {
    it('INPUT_EMPTY exists', () => {
      assert.equal(LocationErrorCode.INPUT_EMPTY, 'LOCATION_INPUT_EMPTY');
      assert.ok(isLocationErrorCode(LocationErrorCode.INPUT_EMPTY));
    });

    it('INPUT_TOO_LARGE exists', () => {
      assert.equal(LocationErrorCode.INPUT_TOO_LARGE, 'LOCATION_INPUT_TOO_LARGE');
    });

    it('CITY_REQUIRED exists', () => {
      assert.equal(LocationErrorCode.CITY_REQUIRED, 'LOCATION_CITY_REQUIRED');
    });

    it('DETAIL_REQUIRED exists', () => {
      assert.equal(LocationErrorCode.DETAIL_REQUIRED, 'LOCATION_DETAIL_REQUIRED');
    });

    it('INVALID_COORDINATES exists', () => {
      assert.equal(LocationErrorCode.INVALID_COORDINATES, 'LOCATION_INVALID_COORDINATES');
    });

    it('UNSUPPORTED_CITY exists', () => {
      assert.equal(LocationErrorCode.UNSUPPORTED_CITY, 'LOCATION_UNSUPPORTED_CITY');
    });

    it('NOT_FOUND exists', () => {
      assert.equal(LocationErrorCode.NOT_FOUND, 'LOCATION_NOT_FOUND');
    });

    it('AMBIGUOUS exists', () => {
      assert.equal(LocationErrorCode.AMBIGUOUS, 'LOCATION_AMBIGUOUS');
    });

    it('CANDIDATE_EXPIRED exists', () => {
      assert.equal(LocationErrorCode.CANDIDATE_EXPIRED, 'LOCATION_CANDIDATE_EXPIRED');
    });

    it('FLOW_EXPIRED exists', () => {
      assert.equal(LocationErrorCode.FLOW_EXPIRED, 'LOCATION_FLOW_EXPIRED');
    });

    it('PROVIDER_UNAVAILABLE exists', () => {
      assert.equal(LocationErrorCode.PROVIDER_UNAVAILABLE, 'LOCATION_PROVIDER_UNAVAILABLE');
    });

    it('PROVIDER_TIMEOUT exists', () => {
      assert.equal(LocationErrorCode.PROVIDER_TIMEOUT, 'LOCATION_PROVIDER_TIMEOUT');
    });

    it('PROVIDER_RATE_LIMITED exists', () => {
      assert.equal(LocationErrorCode.PROVIDER_RATE_LIMITED, 'LOCATION_PROVIDER_RATE_LIMITED');
    });

    it('RATE_LIMITED exists', () => {
      assert.equal(LocationErrorCode.RATE_LIMITED, 'LOCATION_RATE_LIMITED');
    });

    it('NO_ELIGIBLE_OUTLET exists', () => {
      assert.equal(LocationErrorCode.NO_ELIGIBLE_OUTLET, 'LOCATION_NO_ELIGIBLE_OUTLET');
    });

    it('OUTSIDE_SERVICE_RADIUS exists', () => {
      assert.equal(LocationErrorCode.OUTSIDE_SERVICE_RADIUS, 'LOCATION_OUTSIDE_SERVICE_RADIUS');
    });

    it('OUTLET_NOT_ELIGIBLE exists', () => {
      assert.equal(LocationErrorCode.OUTLET_NOT_ELIGIBLE, 'LOCATION_OUTLET_NOT_ELIGIBLE');
    });

    it('OUTLET_LOCATION_UNVERIFIED exists', () => {
      assert.equal(LocationErrorCode.OUTLET_LOCATION_UNVERIFIED, 'LOCATION_OUTLET_LOCATION_UNVERIFIED');
    });

    it('MAPS_URL_INVALID exists', () => {
      assert.equal(LocationErrorCode.MAPS_URL_INVALID, 'LOCATION_MAPS_URL_INVALID');
    });

    it('MAPS_URL_SSRF_BLOCKED exists', () => {
      assert.equal(LocationErrorCode.MAPS_URL_SSRF_BLOCKED, 'LOCATION_MAPS_URL_SSRF_BLOCKED');
    });

    it('CROSS_WORKSPACE_ACCESS_DENIED exists', () => {
      assert.equal(LocationErrorCode.CROSS_WORKSPACE_ACCESS_DENIED, 'LOCATION_CROSS_WORKSPACE_ACCESS_DENIED');
    });

    it('PERMISSION_DENIED exists', () => {
      assert.equal(LocationErrorCode.PERMISSION_DENIED, 'LOCATION_PERMISSION_DENIED');
    });

    it('INTERNAL_ERROR exists', () => {
      assert.equal(LocationErrorCode.INTERNAL_ERROR, 'LOCATION_INTERNAL_ERROR');
    });
  });

  describe('Provider error mapping', () => {
    it('maps timeout to PROVIDER_TIMEOUT', () => {
      const mapped = mapProviderError(new Error('PROVIDER_TIMEOUT'));
      assert.equal(mapped.code, LocationErrorCode.PROVIDER_TIMEOUT);
    });

    it('maps rate limit to PROVIDER_RATE_LIMITED', () => {
      const mapped = mapProviderError(new Error('PROVIDER_RATE_LIMITED'));
      assert.equal(mapped.code, LocationErrorCode.PROVIDER_RATE_LIMITED);
    });

    it('maps not_found to NOT_FOUND', () => {
      const mapped = mapProviderError(new Error('PROVIDER_NOT_FOUND'));
      assert.equal(mapped.code, LocationErrorCode.NOT_FOUND);
    });

    it('maps unknown error to INTERNAL_ERROR', () => {
      const mapped = mapProviderError(new Error('random error'));
      assert.equal(mapped.code, LocationErrorCode.INTERNAL_ERROR);
    });

    it('maps string error to INTERNAL_ERROR', () => {
      const mapped = mapProviderError('string error');
      assert.equal(mapped.code, LocationErrorCode.INTERNAL_ERROR);
    });
  });

  describe('Customer-safe code mapping', () => {
    it('5xx errors have expose=false', () => {
      const err = new LocationError(LocationErrorCode.INTERNAL_ERROR, 'Internal', 500);
      assert.equal(err.expose, false);
    });

    it('4xx errors have expose=true', () => {
      const err = new LocationError(LocationErrorCode.CITY_REQUIRED, 'City required', 400);
      assert.equal(err.expose, true);
    });

    it('createCustomerSafeError strips internal details', () => {
      const err = new LocationError(LocationErrorCode.INTERNAL_ERROR, 'DB connection failed', 500);
      const safe = createCustomerSafeError(err);
      assert.equal(safe.code, LocationErrorCode.INTERNAL_ERROR);
      assert.equal(safe.message, 'Terjadi kesalahan. Silakan coba lagi.');
      assert.equal(safe.internalMessage, undefined);
    });

    it('createCustomerSafeError preserves customer-safe details for 4xx', () => {
      const err = new LocationError(LocationErrorCode.CITY_REQUIRED, 'City is required', 400);
      const safe = createCustomerSafeError(err);
      assert.equal(safe.message, 'Kota wajib diisi');
    });
  });

  describe('No raw exception exposure', () => {
    it('toJSON excludes stack trace by default', () => {
      const err = new LocationError(LocationErrorCode.INTERNAL_ERROR, 'Test');
      const json = err.toJSON();
      assert.equal(json.code, LocationErrorCode.INTERNAL_ERROR);
      assert.equal(json.stack, undefined);
    });
  });
});
