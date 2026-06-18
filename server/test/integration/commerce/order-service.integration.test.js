import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidTransition } from '../../../src/services/order.service.js';
import { ordersRepository } from '../../../src/db/repositories/index.js';


describe('order service', () => {
  it('allows only valid lifecycle transitions', () => {
    assert.equal(isValidTransition('new', 'accepted'), true);
    assert.equal(isValidTransition('accepted', 'preparing'), true);
    assert.equal(isValidTransition('preparing', 'ready'), true);
    assert.equal(isValidTransition('ready', 'completed'), true);
    assert.equal(isValidTransition('completed', 'accepted'), false);
    assert.equal(isValidTransition('cancelled', 'accepted'), false);
  });

  it('exposes Supabase order repository methods used by service layer', () => {
    for (const method of ['create', 'workspaceList', 'workspaceCount', 'workspaceFindById', 'updateOne']) {
      assert.equal(typeof ordersRepository[method], 'function', `${method} exists`);
    }
  });
});
