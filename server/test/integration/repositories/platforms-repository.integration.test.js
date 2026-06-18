import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { platformsRepository } from '../../../src/db/repositories/index.js';


describe('platforms repository contract', () => {
  it('exposes Supabase platform repository methods used by routes/webhooks', () => {
    for (const method of [
      'list',
      'findById',
      'findByIdWithCredentials',
      'create',
      'update',
      'remove',
      'updateHealth',
      'findByToken',
    ]) {
      assert.equal(typeof platformsRepository[method], 'function', `${method} exists`);
    }
  });
});
