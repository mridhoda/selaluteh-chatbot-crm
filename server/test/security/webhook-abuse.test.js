import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertWebhookPayloadSafe, verifyMetaSignature, verifyTelegramSecret } from '../../src/security/webhook-security.js';

describe('webhook abuse security', () => {
  it('rejects oversized payload', () => {
    const payload = { data: 'x'.repeat(300 * 1024) };
    assert.throws(() => assertWebhookPayloadSafe(payload), (err) => {
      assert.equal(err.code, 'PAYLOAD_TOO_LARGE');
      return true;
    });
  });

  it('rejects invalid meta signature', () => {
    const valid = verifyMetaSignature({ hello: 'world' }, 'sha256=invalid', 'secret');
    assert.equal(valid, false);
  });

  it('rejects missing telegram secret when configured', () => {
    assert.equal(verifyTelegramSecret('', 'expected-secret'), false);
  });

  it('allows matching telegram secret', () => {
    assert.equal(verifyTelegramSecret('expected-secret', 'expected-secret'), true);
  });
});
