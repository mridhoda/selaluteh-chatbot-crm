import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SENSITIVE_ACTIONS, auditLog, redactSensitiveDetails } from '../../../src/services/audit.service.js';

describe('audit.service', () => {
  describe('SENSITIVE_ACTIONS', () => {
    it('includes auth actions', () => {
      assert.ok(SENSITIVE_ACTIONS.includes('auth.login'));
      assert.ok(SENSITIVE_ACTIONS.includes('auth.password_reset'));
    });
    it('includes stock and order actions', () => {
      assert.ok(SENSITIVE_ACTIONS.includes('stock.adjust'));
      assert.ok(SENSITIVE_ACTIONS.includes('order.cancel'));
    });
  });

  describe('auditLog', () => {
    it('requires action', async () => {
      await assert.rejects(() => auditLog({}), (err) => {
        assert.strictEqual(err.code, 'VALIDATION');
        return true;
      });
    });
  });
});
