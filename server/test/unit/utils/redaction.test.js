import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redactSecrets, redactSecretsInText } from '../../../src/utils/redaction.js';

describe('redaction utilities', () => {
  it('redacts nested secret fields', () => {
    const output = redactSecrets({ token: 'abc123456789', nested: { password: 'secret-pass' }, safe: 'value' });
    assert.equal(output.token, '[REDACTED]');
    assert.equal(output.nested.password, '[REDACTED]');
    assert.equal(output.safe, 'value');
  });

  it('redacts bearer tokens from text', () => {
    const output = redactSecretsInText('Authorization: Bearer abcdefghijklmnop');
    assert.equal(output.includes('abcdefghijklmnop'), false);
    assert.equal(output.includes('[REDACTED]'), true);
  });
});
