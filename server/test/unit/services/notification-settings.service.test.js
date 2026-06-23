import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getNotificationSettings,
  updateNotificationSettings,
  setOutletRecipient,
} from '../../../src/services/notification-settings.service.js';

describe('notification-settings.service', () => {
  describe('getNotificationSettings', () => {
    it('returns defaults when no settings exist', async () => {
      const result = await getNotificationSettings({ workspaceId: '00000000-0000-0000-0000-000000000001' });
      assert.ok(result.default_channel);
      assert.ok(result.enabled_types);
      assert.ok(result.quiet_hours);
      assert.ok(result.outlet_recipients);
      assert.strictEqual(result.default_channel, 'telegram');
    });
  });

  describe('updateNotificationSettings', () => {
    it('validates enabled_types must be an object', async () => {
      const workspaceId = '00000000-0000-0000-0000-000000000001';
      await assert.rejects(
        () => updateNotificationSettings({ workspaceId, updates: { enabled_types: 'not-an-object' } }),
        (err) => {
          assert.strictEqual(err.code, 'VALIDATION');
          assert.strictEqual(err.status, 400);
          return true;
        }
      );
    });

    it('validates default_channel', async () => {
      const workspaceId = '00000000-0000-0000-0000-000000000001';
      await assert.rejects(
        () => updateNotificationSettings({ workspaceId, updates: { default_channel: 'fax' } }),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_CHANNEL');
          assert.strictEqual(err.status, 400);
          return true;
        }
      );
    });
  });

  describe('setOutletRecipient', () => {
    it('validates telegramChatId', async () => {
      const workspaceId = '00000000-0000-0000-0000-000000000001';
      await assert.rejects(
        () => setOutletRecipient({ workspaceId, outletId: 'outlet-1', telegramChatId: '' }),
        (err) => {
          assert.strictEqual(err.code, 'VALIDATION');
          assert.strictEqual(err.status, 400);
          return true;
        }
      );
    });
  });
});
