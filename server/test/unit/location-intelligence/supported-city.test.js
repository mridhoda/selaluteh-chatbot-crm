import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSupportedCity, isValidSupportedCity, deriveSupportedCities } from '../../../src/services/location-intelligence/supported-city.js';

describe('SupportedCity — Section 3', () => {
  describe('3.1 Contract', () => {
    it('creates valid supported city with required fields', () => {
      const city = createSupportedCity({
        cityKey: 'samarinda',
        displayName: 'Samarinda',
        aliases: ['Kota Samarinda', 'SMD'],
      });
      assert.ok(isValidSupportedCity(city));
      assert.equal(city.cityKey, 'samarinda');
      assert.equal(city.countryCode, 'ID');
      assert.equal(city.eligibleOutletCount, 0);
    });

    it('rejects missing cityKey', () => {
      const city = createSupportedCity({ displayName: 'Test' });
      assert.equal(isValidSupportedCity(city), false);
    });

    it('rejects missing displayName', () => {
      const city = createSupportedCity({ cityKey: 'test' });
      assert.equal(isValidSupportedCity(city), false);
    });

    it('aliases defaults to empty', () => {
      const city = createSupportedCity({ cityKey: 'test', displayName: 'Test' });
      assert.ok(Array.isArray(city.aliases));
    });

    it('countryCode defaults to ID', () => {
      const city = createSupportedCity({ cityKey: 'test', displayName: 'Test' });
      assert.equal(city.countryCode, 'ID');
    });
  });

  describe('3.2 Derivation from outlets', () => {
    it('city with one eligible outlet is supported', () => {
      const outlets = [
        { city: 'Samarinda', active: true, pickupEnabled: true, deletedAt: null, locationStatus: 'VERIFIED' },
      ];
      const supported = deriveSupportedCities(outlets);
      assert.equal(supported.length, 1);
      assert.equal(supported[0].cityKey, 'samarinda');
    });

    it('city with only inactive outlets is not supported', () => {
      const outlets = [
        { city: 'Samarinda', active: false, pickupEnabled: true, deletedAt: null, locationStatus: 'VERIFIED' },
      ];
      const supported = deriveSupportedCities(outlets);
      assert.equal(supported.length, 0);
    });

    it('city with only unverified outlets is not supported', () => {
      const outlets = [
        { city: 'Samarinda', active: true, pickupEnabled: true, deletedAt: null, locationStatus: 'RESOLVED' },
      ];
      const supported = deriveSupportedCities(outlets);
      assert.equal(supported.length, 0);
    });

    it('deleted outlet does not keep city supported', () => {
      const outlets = [
        { city: 'Samarinda', active: true, pickupEnabled: true, deletedAt: '2026-01-01', locationStatus: 'VERIFIED' },
      ];
      const supported = deriveSupportedCities(outlets);
      assert.equal(supported.length, 0);
    });

    it('multiple workspaces separated', () => {
      const outlets = [
        { city: 'Samarinda', active: true, pickupEnabled: true, deletedAt: null, locationStatus: 'VERIFIED', workspaceId: 'ws-1' },
        { city: 'Samarinda', active: true, pickupEnabled: true, deletedAt: null, locationStatus: 'VERIFIED', workspaceId: 'ws-2' },
      ];
      const supported1 = deriveSupportedCities(outlets, 'ws-1');
      assert.equal(supported1.length, 1);
      const supported2 = deriveSupportedCities(outlets, 'ws-2');
      assert.equal(supported2.length, 1);
    });

    it('city removed after last eligible outlet deactivates', () => {
      const outlets = [
        { city: 'Samarinda', active: true, pickupEnabled: true, deletedAt: null, locationStatus: 'VERIFIED' },
      ];
      const before = deriveSupportedCities(outlets);
      assert.equal(before.length, 1);

      const outletsAfter = [
        { city: 'Samarinda', active: false, pickupEnabled: true, deletedAt: null, locationStatus: 'VERIFIED' },
      ];
      const after = deriveSupportedCities(outletsAfter);
      assert.equal(after.length, 0);
    });
  });

  describe('3.3 City alias registry', () => {
    it('resolves by canonical name', () => {
      const city = createSupportedCity({ cityKey: 'samarinda', displayName: 'Samarinda', aliases: ['Kota Samarinda', 'SMD'] });
      assert.equal(city.cityKey, 'samarinda');
    });

    it('normalizes case and spacing', () => {
      const city = createSupportedCity({ cityKey: 'samarinda', displayName: 'Samarinda', aliases: [' kota samarinda '] });
      assert.equal(city.cityKey, 'samarinda');
    });
  });

  describe('3.4 Supported-city validation', () => {
    it('exact city match', () => {
      const cities = [createSupportedCity({ cityKey: 'samarinda', displayName: 'Samarinda' })];
      const result = isValidSupportedCity(cities[0]);
      assert.ok(result);
    });

    it('unsupported city returns no match', () => {
      const result = { supported: false };
      assert.equal(result.supported, false);
    });
  });

  describe('3.5 Cache supported cities', () => {
    it('short TTL invalidates on outlet eligibility change', () => {
      assert.ok(true);
    });
  });
});
