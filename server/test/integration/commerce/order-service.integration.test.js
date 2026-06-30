import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidOrderTransition, OrderStatus } from '../../../src/orders/order-types.js';
import { ordersRepository } from '../../../src/db/repositories/index.js';


describe('order service', () => {
  it('allows only valid lifecycle transitions', () => {
    assert.equal(isValidOrderTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.AWAITING_OUTLET_APPROVAL), true);
    assert.equal(isValidOrderTransition(OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.APPROVED), true);
    assert.equal(isValidOrderTransition(OrderStatus.APPROVED, OrderStatus.PREPARING), true);
    assert.equal(isValidOrderTransition(OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP), true);
    assert.equal(isValidOrderTransition(OrderStatus.READY_FOR_PICKUP, OrderStatus.COMPLETED), true);
    assert.equal(isValidOrderTransition(OrderStatus.COMPLETED, OrderStatus.APPROVED), false);
    assert.equal(isValidOrderTransition(OrderStatus.CANCELLED, OrderStatus.APPROVED), false);
  });

  it('exposes Supabase order repository methods used by service layer', () => {
    for (const method of ['create', 'workspaceList', 'workspaceCount', 'workspaceFindById', 'updateOne']) {
      assert.equal(typeof ordersRepository[method], 'function', `${method} exists`);
    }
  });
});
