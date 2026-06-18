import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { outletsRepository } from '../../../src/db/repositories/index.js';


describe('outlets repository contract', () => {
  it('exposes Supabase outlet repository methods used by routes/services', () => {
    for (const method of [
      'list',
      'count',
      'findById',
      'findByCode',
      'findActiveByWorkspace',
      'findActiveIdsByWorkspace',
      'create',
      'update',
      'updateStatus',
      'findUserAccess',
      'findOneUserAccess',
      'replaceUserAccess',
    ]) {
      assert.equal(typeof outletsRepository[method], 'function', `${method} exists`);
    }
  });
});
