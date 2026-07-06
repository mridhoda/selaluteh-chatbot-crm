import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listSchemas, getSchemaKeys, isSecretKey, secretConfiguredKey } from '../../../src/services/settings.service.js';

describe('settings.service', () => {
  describe('listSchemas', () => {
    it('returns all schemas', () => {
      const schemas = listSchemas();
      assert.ok(schemas.includes('general'));
      assert.ok(schemas.includes('ai'));
      assert.ok(schemas.includes('payment'));
      assert.ok(schemas.includes('security'));
    });
  });

  describe('getSchemaKeys', () => {
    it('returns keys for known schema', () => {
      const keys = getSchemaKeys('general');
      assert.ok(keys.includes('business_display_name'));
      assert.ok(keys.includes('timezone'));
      assert.ok(keys.includes('currency'));
      assert.ok(keys.includes('locale'));
      assert.ok(keys.includes('default_language'));
      assert.ok(keys.includes('support_contact_email'));
      assert.ok(keys.includes('default_outlet_id'));
      assert.ok(keys.includes('allow_all_outlets_view'));
    });

    it('throws for unknown schema', () => {
      assert.throws(() => getSchemaKeys('unknown'), (err) => {
        assert.strictEqual(err.code, 'INVALID_SCHEMA');
        return true;
      });
    });
  });

  describe('isSecretKey', () => {
    it('identifies secret keys', () => {
      assert.ok(isSecretKey('xendit_secret_key'));
      assert.ok(isSecretKey('midtrans_server_key'));
      assert.ok(isSecretKey('xendit_webhook_token'));
      assert.ok(!isSecretKey('business_display_name'));
      assert.ok(!isSecretKey('timezone'));
    });
  });

  describe('secretConfiguredKey', () => {
    it('appends configured suffix', () => {
      assert.strictEqual(secretConfiguredKey('xendit_secret_key'), 'xendit_secret_key_configured');
    });
  });
});
