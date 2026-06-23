import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateFile, sanitizeFilename } from '../../src/services/file.service.js';

describe('file security', () => {
  it('rejects path traversal filenames', () => {
    assert.throws(() => sanitizeFilename('../../../etc/passwd.exe'), (err) => {
      assert.strictEqual(err.code, 'INVALID_EXTENSION');
      return true;
    });
    const safe = sanitizeFilename('../../safe.pdf');
    assert.ok(!safe.includes('/'));
    assert.ok(safe.endsWith('.pdf'));
  });

  it('rejects MIME mismatch (disallowed type)', () => {
    assert.throws(() => validateFile('text/html', 100), (err) => {
      assert.strictEqual(err.code, 'INVALID_MIME');
      return true;
    });
    assert.throws(() => validateFile('application/x-executable', 100), (err) => {
      assert.strictEqual(err.code, 'INVALID_MIME');
      return true;
    });
  });

  it('rejects oversized files', () => {
    assert.throws(() => validateFile('image/png', 11 * 1024 * 1024), (err) => {
      assert.strictEqual(err.code, 'FILE_TOO_LARGE');
      return true;
    });
  });

  it('rejects executable file extensions', () => {
    assert.throws(() => sanitizeFilename('script.exe'), (err) => {
      assert.strictEqual(err.code, 'INVALID_EXTENSION');
      return true;
    });
    assert.throws(() => sanitizeFilename('virus.com'), (err) => {
      assert.strictEqual(err.code, 'INVALID_EXTENSION');
      return true;
    });
  });

  it('rejects suspicious double extensions', () => {
    assert.throws(() => validateFile('application/pdf', 100, 'invoice.pdf.exe'), (err) => {
      assert.equal(err.code, 'DOUBLE_EXTENSION');
      return true;
    });
  });

  it('rejects MIME spoofed executable filenames', () => {
    assert.throws(() => validateFile('application/pdf', 100, 'payload.php.pdf'), (err) => {
      assert.equal(err.code, 'INVALID_EXTENSION');
      return true;
    });
  });

  it('rejects filenames without extension', () => {
    assert.throws(() => sanitizeFilename('noext'), (err) => {
      assert.strictEqual(err.code, 'INVALID_EXTENSION');
      return true;
    });
  });

  it('accepts valid file types within size limit', () => {
    assert.doesNotThrow(() => validateFile('image/jpeg', 1024));
    assert.doesNotThrow(() => validateFile('application/pdf', 5 * 1024 * 1024));
    assert.doesNotThrow(() => validateFile('text/csv', 500));
    assert.doesNotThrow(() => sanitizeFilename('report.xlsx'));
    assert.doesNotThrow(() => sanitizeFilename('photo.jpg'));
    assert.doesNotThrow(() => sanitizeFilename('doc.pdf'));
  });
});
