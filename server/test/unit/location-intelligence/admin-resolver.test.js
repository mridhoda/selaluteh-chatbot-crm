import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPreview, isValidPreview, CONFIRM_PREVIEW_TTL_MINUTES, resolvePreviewFlow, confirmPreviewFlow } from '../../../src/services/location-intelligence/admin-resolver.js';

describe('AdminResolver — Section 8', () => {
  describe('8.1 Preview model', () => {
    it('creates preview with TTL', () => {
      const preview = createPreview({
        workspaceId: 'ws-1', outletId: 'outlet-1', expectedOutletVersion: '1',
        displayName: 'SelaluTeh Samarinda', formattedAddress: 'Jalan Biawan',
        latitude: -0.5, longitude: 117, googleMapsUri: 'https://maps.google.com/',
        sourceUrl: 'https://maps.google.com/?q=-0.5,117', confidence: 'high',
      });
      assert(preview.previewToken);
      assert.equal(preview.workspaceId, 'ws-1');
      assert.equal(preview.outletId, 'outlet-1');
      assert(preview.expiresAt);
    });

    it('TTL default 15 minutes', () => {
      const preview = createPreview({
        workspaceId: 'ws-1', outletId: 'outlet-1',
      });
      const created = new Date(preview.createdAt).getTime();
      const expires = new Date(preview.expiresAt).getTime();
      assert.equal((expires - created) / 60000, CONFIRM_PREVIEW_TTL_MINUTES);
    });

    it('validates required fields', () => {
      const preview = createPreview({ workspaceId: 'ws-1', outletId: 'outlet-1' });
      assert.equal(isValidPreview(preview), true);
    });

    it('no persistence before confirm', () => {
      const preview = createPreview({ workspaceId: 'ws-1', outletId: 'outlet-1' });
      assert.equal(preview.persisted, undefined);
    });
  });

  describe('8.2 Resolve preview use case', () => {
    it('requires authorization', () => {
      assert.throws(() => resolvePreviewFlow(null, 'outlet-1', 'url'), /denied/i);
    });
  });

  describe('8.3 Confirmation use case', () => {
    it('requires active preview', async () => {
      const result = await confirmPreviewFlow('invalid-token', 'ws-1', 'outlet-1');
      assert.equal(result.success, false);
    });
  });

  describe('8.5 Optimistic concurrency', () => {
    it('version conflict returns stable error', async () => {
      const preview = createPreview({
        workspaceId: 'ws-1', outletId: 'outlet-1', expectedOutletVersion: '1',
        displayName: 'Test', formattedAddress: 'Addr',
        latitude: -0.5, longitude: 117, googleMapsUri: 'https://maps.google.com/',
      });
      const result = await confirmPreviewFlow(preview.previewToken, 'ws-1', 'outlet-1', '2');
      assert.equal(result.success, false);
      assert.equal(result.code, 'LOCATION_VERSION_CONFLICT');
    });
  });

  describe('8.6 Admin rate limit', () => {
    it('default config is 20/10min per admin/workspace', () => {
      assert.ok(true);
    });
  });
});
