import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutsRepository } from '../../../src/db/repositories/index.js';


describe('checkout service contract', () => {
  it('exposes Supabase checkout repository methods used by service layer', () => {
    for (const method of ['findById', 'findByIdempotencyKey', 'findActiveByCart', 'create', 'updateStatus']) {
      assert.equal(typeof checkoutsRepository[method], 'function', `${method} exists`);
    }
  });
});
