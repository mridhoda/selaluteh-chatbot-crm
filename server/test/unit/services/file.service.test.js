import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateFile, sanitizeFilename } from '../../../src/services/file.service.js';

describe('file.service', () => {
  describe('validateFile', () => {
    it('rejects disallowed mime type', () => {
      assert.throws(() => validateFile('text/html', 100), (err) => {
        assert.strictEqual(err.code, 'INVALID_MIME');
        assert.strictEqual(err.status, 400);
        return true;
      });
    });

    it('rejects oversized file', () => {
      assert.throws(() => validateFile('image/jpeg', 11 * 1024 * 1024), (err) => {
        assert.strictEqual(err.code, 'FILE_TOO_LARGE');
        assert.strictEqual(err.status, 400);
        return true;
      });
    });

    it('accepts valid file', () => {
      assert.doesNotThrow(() => validateFile('image/jpeg', 1024));
      assert.doesNotThrow(() => validateFile('application/pdf', 500));
    });
  });

  describe('sanitizeFilename', () => {
    it('sanitizes dangerous characters', () => {
      const result = sanitizeFilename('../../etc/passwd.jpg');
      assert.strictEqual(result, '.._.._etc_passwd.jpg');
    });

    it('rejects disallowed extension', () => {
      assert.throws(() => sanitizeFilename('script.exe'), (err) => {
        assert.strictEqual(err.code, 'INVALID_EXTENSION');
        return true;
      });
    });

    it('rejects filename without extension', () => {
      assert.throws(() => sanitizeFilename('noext'), (err) => {
        assert.strictEqual(err.code, 'INVALID_EXTENSION');
        return true;
      });
    });
  });
});
