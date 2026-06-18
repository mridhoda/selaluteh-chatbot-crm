import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizePhone } from '../../../src/utils/normalize.js';

describe('normalize utils', () => {
  it('normalizePhone strips dashes and spaces', () => {
    assert.strictEqual(normalizePhone('0812-3456-7890'), '081234567890');
  });

  it('normalizePhone converts 62 prefix to 0', () => {
    assert.strictEqual(normalizePhone('6281234567890'), '081234567890');
  });

  it('normalizePhone returns empty for empty input', () => {
    assert.strictEqual(normalizePhone(''), '');
    assert.strictEqual(normalizePhone(null), '');
  });
});
