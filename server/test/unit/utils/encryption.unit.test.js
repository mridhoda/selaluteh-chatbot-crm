import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { encrypt, decrypt, redact } from '../../../src/utils/encryption.js';

describe('encryption utils', () => {
  it('encrypt returns formatted ciphertext', () => {
    const result = encrypt('secret-token-123');
    assert.ok(result);
    assert.strictEqual(result.split(':').length, 3);
  });

  it('decrypt returns original plaintext', () => {
    const original = 'my-super-secret-value';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, original);
  });

  it('decrypt returns empty for empty input', () => {
    assert.strictEqual(decrypt(''), '');
    assert.strictEqual(decrypt(null), '');
  });

  it('decrypt returns empty for malformed ciphertext', () => {
    assert.strictEqual(decrypt('invalid'), '');
    assert.strictEqual(decrypt('a:b'), '');
  });

  it('redact shortens long values', () => {
    assert.strictEqual(redact('abcdefgh'), 'abcd...efgh');
  });

  it('redact returns short values unchanged', () => {
    assert.strictEqual(redact('abc'), 'abc');
  });
});
