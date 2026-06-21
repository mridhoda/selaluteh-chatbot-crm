import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isApprovedGoogleMapsHost, parseAndValidateUrl, blockPrivateIp, resolveRedirectSafe, extractGoogleMapsIdentifier } from '../../../src/services/location-intelligence/secure-url-resolver.js';

describe('Secure URL Resolver — Section 7', () => {
  describe('7.1 Approved host registry', () => {
    it('google.com is approved', () => {
      assert.ok(isApprovedGoogleMapsHost('google.com'));
    });
    it('www.google.com is approved', () => {
      assert.ok(isApprovedGoogleMapsHost('www.google.com'));
    });
    it('maps.google.com is approved', () => {
      assert.ok(isApprovedGoogleMapsHost('maps.google.com'));
    });
    it('maps.app.goo.gl is approved', () => {
      assert.ok(isApprovedGoogleMapsHost('maps.app.goo.gl'));
    });
    it('goo.gl is approved', () => {
      assert.ok(isApprovedGoogleMapsHost('goo.gl'));
    });
    it('evil.com is rejected', () => {
      assert.equal(isApprovedGoogleMapsHost('evil.com'), false);
    });
    it('internal.host is rejected', () => {
      assert.equal(isApprovedGoogleMapsHost('internal.company'), false);
    });
  });

  describe('7.2 URL parser and normalizer', () => {
    it('https URL accepted', () => {
      const result = parseAndValidateUrl('https://maps.google.com/?q=-0.5,117');
      assert.ok(result.valid);
    });
    it('http URL rejected', () => {
      const result = parseAndValidateUrl('http://maps.google.com/');
      assert.equal(result.valid, false);
    });
    it('file:// URL rejected', () => {
      const result = parseAndValidateUrl('file:///etc/passwd');
      assert.equal(result.valid, false);
    });
    it('ftp:// URL rejected', () => {
      const result = parseAndValidateUrl('ftp://google.com/');
      assert.equal(result.valid, false);
    });
    it('data: URL rejected', () => {
      const result = parseAndValidateUrl('data:text/html,<script>');
      assert.equal(result.valid, false);
    });
    it('credentials in host rejected', () => {
      const result = parseAndValidateUrl('https://user:pass@google.com/');
      assert.equal(result.valid, false);
    });
  });

  describe('7.3 IP and network guard', () => {
    it('127.0.0.1 blocked', () => {
      assert.equal(blockPrivateIp('127.0.0.1'), true);
    });
    it('10.0.0.1 blocked', () => {
      assert.equal(blockPrivateIp('10.0.0.1'), true);
    });
    it('192.168.1.1 blocked', () => {
      assert.equal(blockPrivateIp('192.168.1.1'), true);
    });
    it('169.254.169.254 blocked', () => {
      assert.equal(blockPrivateIp('169.254.169.254'), true);
    });
    it('::1 blocked', () => {
      assert.equal(blockPrivateIp('::1'), true);
    });
    it('8.8.8.8 allowed', () => {
      assert.equal(blockPrivateIp('8.8.8.8'), false);
    });
  });

  describe('7.4 Bounded redirect resolver', () => {
    it('valid short link resolves', async () => {
      const result = await resolveRedirectSafe('https://maps.app.goo.gl/abc123');
      assert.ok(result.resolved);
    });
    it('redirect loop detected', async () => {
      const result = await resolveRedirectSafe('https://goo.gl/loop');
      assert.equal(result.status, 'REDIRECT_LOOP');
    });
    it('too many redirects', async () => {
      const result = await resolveRedirectSafe('https://goo.gl/many');
      assert.equal(result.status, 'REDIRECT_LIMIT_EXCEEDED');
    });
  });

  describe('7.5 Google Maps URL extraction', () => {
    it('extracts coordinates from full URL', () => {
      const result = extractGoogleMapsIdentifier('https://www.google.com/maps/@-0.502106,117.153709,15z');
      assert.equal(result.type, 'coordinates');
      assert.equal(result.latitude, -0.502106);
      assert.equal(result.longitude, 117.153709);
    });
    it('extracts place ID from place URL', () => {
      const result = extractGoogleMapsIdentifier('https://www.google.com/maps/place/ChIJ12345');
      assert.equal(result.type, 'place_id');
      assert.equal(result.placeId, 'ChIJ12345');
    });
    it('unsupported URL returns null', () => {
      const result = extractGoogleMapsIdentifier('https://evil.com/');
      assert.equal(result, null);
    });
  });
});
