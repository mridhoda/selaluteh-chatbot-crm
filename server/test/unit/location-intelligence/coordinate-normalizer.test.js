import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSharedCoordinates } from '../../../src/services/location-intelligence/coordinate-normalizer.js';
import { LocationErrorCode } from '../../../src/services/location-intelligence/errors.js';

describe('SharedCoordinates — Section 6', () => {
  describe('6.1 Telegram normalization', () => {
    it('maps Telegram payload to coordinate contract', () => {
      const result = normalizeSharedCoordinates({
        platform: 'telegram',
        latitude: -0.502106,
        longitude: 117.153709,
        messageId: 'tg-msg-1',
      });
      assert.equal(result.latitude, -0.502106);
      assert.equal(result.longitude, 117.153709);
      assert.equal(result.platform, 'telegram');
      assert(result.messageId);
    });

    it('validates lat/lng bounds', () => {
      assert.throws(() => normalizeSharedCoordinates({
        platform: 'telegram', latitude: 200, longitude: 117,
      }), { code: LocationErrorCode.INVALID_COORDINATES });
    });
  });

  describe('6.2 WhatsApp normalization', () => {
    it('maps WhatsApp payload to coordinate contract', () => {
      const result = normalizeSharedCoordinates({
        platform: 'whatsapp',
        latitude: -6.2088,
        longitude: 106.8456,
        messageId: 'wa-msg-1',
      });
      assert.equal(result.latitude, -6.2088);
      assert.equal(result.longitude, 106.8456);
      assert.equal(result.platform, 'whatsapp');
    });
  });

  describe('6.3 Coordinate-origin flow', () => {
    it('bypasses text geocoding', () => {
      const result = normalizeSharedCoordinates({
        platform: 'telegram', latitude: -0.5, longitude: 117, messageId: 'msg-1',
      });
      assert.equal(result.type, 'shared_coordinates');
    });

    it('stores temporarily', () => {
      const result = normalizeSharedCoordinates({
        platform: 'telegram', latitude: -0.5, longitude: 117, messageId: 'msg-1',
      });
      assert(result.latitude);
      assert(result.longitude);
    });

    it('does not select outlet automatically', () => {
      const result = normalizeSharedCoordinates({
        platform: 'telegram', latitude: -0.5, longitude: 117, messageId: 'msg-1',
      });
      assert.equal(result.selectedOutletId, undefined);
    });
  });

  describe('6.4 Privacy', () => {
    it('no raw provider payload in result', () => {
      const result = normalizeSharedCoordinates({
        platform: 'telegram', latitude: -0.5, longitude: 117, messageId: 'msg-1',
        rawProviderPayload: { secret: 'data' },
      });
      assert.equal(result.rawProviderPayload, undefined);
    });
  });
});
