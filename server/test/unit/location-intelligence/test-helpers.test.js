import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FixedClock, buildCoordinate, buildTextLocationInput, buildPendingLocationContext,
  buildLocationCandidate, buildNearestOutletResult, buildOutletLocation,
  buildSupportedCity, buildOutletLocationPreview, nextId,
} from '../../helpers/location/index.js';

describe('Location Test Helpers', () => {
  describe('FixedClock', () => {
    it('returns initial time', () => {
      const clock = new FixedClock('2026-06-20T00:00:00Z');
      assert.equal(clock.toISOString(), '2026-06-20T00:00:00.000Z');
    });

    it('advances time correctly', () => {
      const clock = new FixedClock('2026-06-20T00:00:00Z');
      clock.advanceMinutes(30);
      assert.equal(clock.toISOString(), '2026-06-20T00:30:00.000Z');
    });

    it('returns current time as Date', () => {
      const clock = new FixedClock('2026-06-20T00:00:00Z');
      const d = clock.now();
      assert(d instanceof Date);
      assert.equal(d.toISOString(), '2026-06-20T00:00:00.000Z');
    });

    it('toUnixMs returns epoch milliseconds', () => {
      const clock = new FixedClock('2026-06-20T00:00:00Z');
      assert.equal(clock.toUnixMs(), new Date('2026-06-20T00:00:00Z').getTime());
    });
  });

  describe('Factories', () => {
    it('buildCoordinate returns valid coordinate', () => {
      const c = buildCoordinate();
      assert.equal(typeof c.latitude, 'number');
      assert.equal(typeof c.longitude, 'number');
      assert(c.latitude >= -90 && c.latitude <= 90);
      assert(c.longitude >= -180 && c.longitude <= 180);
    });

    it('buildCoordinate allows overrides', () => {
      const c = buildCoordinate({ latitude: -6.2, longitude: 106.8 });
      assert.equal(c.latitude, -6.2);
      assert.equal(c.longitude, 106.8);
    });

    it('buildTextLocationInput returns default text input', () => {
      const input = buildTextLocationInput();
      assert.equal(input.inputType, 'text');
      assert.equal(input.city, null);
      assert.equal(input.street, null);
    });

    it('buildTextLocationInput allows overrides', () => {
      const input = buildTextLocationInput({ city: 'Samarinda', street: 'Jalan Biawan' });
      assert.equal(input.city, 'Samarinda');
      assert.equal(input.street, 'Jalan Biawan');
    });

    it('buildPendingLocationContext has required identity fields', () => {
      const ctx = buildPendingLocationContext();
      assert(ctx.flowId);
      assert(ctx.workspaceId);
      assert(ctx.contactId);
      assert(ctx.chatId);
      assert(ctx.expiresAt);
    });

    it('buildPendingLocationContext defaults to EMPTY', () => {
      const ctx = buildPendingLocationContext();
      assert.equal(ctx.status, 'EMPTY');
    });

    it('buildPendingLocationContext has 30-min TTL', () => {
      const ctx = buildPendingLocationContext();
      const created = new Date(ctx.createdAt).getTime();
      const expires = new Date(ctx.expiresAt).getTime();
      assert.equal(expires - created, 30 * 60 * 1000);
    });

    it('buildLocationCandidate has valid coordinates', () => {
      const c = buildLocationCandidate();
      assert(c.latitude >= -90 && c.latitude <= 90);
      assert(c.longitude >= -180 && c.longitude <= 180);
      assert(c.candidateId);
      assert(c.provider);
    });

    it('buildNearestOutletResult has non-negative distance', () => {
      const r = buildNearestOutletResult();
      assert(r.approximateDistanceMeters >= 0);
      assert(r.outletId);
      assert(r.googleMapsUrl);
    });

    it('buildOutletLocation has VERIFIED status', () => {
      const loc = buildOutletLocation();
      assert.equal(loc.status, 'VERIFIED');
      assert(loc.outletId);
      assert(loc.workspaceId);
      assert(loc.latitude);
      assert(loc.longitude);
    });

    it('buildSupportedCity has aliases', () => {
      const city = buildSupportedCity();
      assert(city.cityKey);
      assert(Array.isArray(city.aliases));
      assert(city.aliases.length > 0);
      assert.equal(city.countryCode, 'ID');
    });

    it('buildOutletLocationPreview has 15-min TTL', () => {
      const preview = buildOutletLocationPreview();
      const created = new Date('2026-06-20T00:00:00Z').getTime();
      const expires = new Date(preview.expiresAt).getTime();
      assert.equal(expires - created, 15 * 60 * 1000);
      assert(preview.previewToken);
      assert(preview.outletId);
    });

    it('nextId generates unique IDs', () => {
      const a = nextId('test');
      const b = nextId('test');
      assert(a !== b);
      assert(a.startsWith('test-'));
    });
  });
});
