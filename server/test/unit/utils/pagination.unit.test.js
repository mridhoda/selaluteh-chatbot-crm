import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parsePagination, paginationMeta } from '../../../src/utils/pagination.js';

describe('pagination helpers', () => {
  it('parsePagination returns defaults for empty query', () => {
    const result = parsePagination({});
    assert.strictEqual(result.page, 1);
    assert.strictEqual(result.limit, 20);
    assert.strictEqual(result.skip, 0);
    assert.strictEqual(result.sort, '-created_at');
  });

  it('parsePagination clamps page to minimum 1', () => {
    const result = parsePagination({ page: '0', limit: '10' });
    assert.strictEqual(result.page, 1);
    assert.strictEqual(result.skip, 0);
  });

  it('parsePagination enforces max limit', () => {
    const result = parsePagination({ limit: '999' }, 100);
    assert.strictEqual(result.limit, 100);
  });

  it('parsePagination uses custom maxLimit', () => {
    const result = parsePagination({ limit: '50' }, 30);
    assert.strictEqual(result.limit, 30);
  });

  it('paginationMeta returns correct structure', () => {
    const meta = paginationMeta(50, 1, 20);
    assert.strictEqual(meta.total, 50);
    assert.strictEqual(meta.page, 1);
    assert.strictEqual(meta.limit, 20);
    assert.strictEqual(meta.totalPages, 3);
    assert.strictEqual(meta.hasNext, true);
    assert.strictEqual(meta.hasPrev, false);
  });

  it('paginationMeta handles empty results', () => {
    const meta = paginationMeta(0, 1, 20);
    assert.strictEqual(meta.totalPages, 1);
    assert.strictEqual(meta.hasNext, false);
  });

  it('paginationMeta recognizes last page', () => {
    const meta = paginationMeta(20, 2, 20);
    assert.strictEqual(meta.totalPages, 1);
    assert.strictEqual(meta.hasNext, false);
  });
});
