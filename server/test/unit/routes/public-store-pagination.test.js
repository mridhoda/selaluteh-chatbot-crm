import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { publicStoreRouteInternals } from '../../../src/routes/public-store.js';

describe('public storefront pagination', () => {
  it('accepts bounded zero-based pages and rejects invalid input', () => {
    assert.deepEqual(publicStoreRouteInternals.getMenuQuery({ page: '1', limit: '24', category: 'cat_minuman', search: 'kopi' }), {
      page: 1,
      limit: 24,
      category: 'cat_minuman',
      search: 'kopi',
    });
    assert.throws(() => publicStoreRouteInternals.getMenuQuery({ page: '-1' }), { code: 'INVALID_PAGINATION' });
    assert.throws(() => publicStoreRouteInternals.getMenuQuery({ limit: '49' }), { code: 'INVALID_PAGINATION' });
  });
});
