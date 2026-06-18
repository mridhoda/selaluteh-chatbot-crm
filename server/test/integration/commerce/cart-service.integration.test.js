import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCartSummary } from '../../../src/services/cart.service.js';
import { cartsRepository } from '../../../src/db/repositories/index.js';


describe('cart service', () => {
  it('summarizes Supabase cart shape for API responses', () => {
    const summary = getCartSummary({
      id: 'cart-1',
      outletId: 'outlet-1',
      currency: 'IDR',
      total: 45000,
      items: [
        { productId: 'product-1', name: 'Tea', effectivePrice: 15000, quantity: 3, subtotal: 45000 },
      ],
    });

    assert.deepEqual(summary, {
      id: 'cart-1',
      outletId: 'outlet-1',
      items: [{ productId: 'product-1', name: 'Tea', price: 15000, quantity: 3, subtotal: 45000 }],
      total: 45000,
      currency: 'IDR',
      itemCount: 1,
    });
  });

  it('exposes Supabase cart repository contract methods', () => {
    for (const method of ['findActiveByContact', 'findById', 'create', 'addItem', 'updateItem', 'removeItem', 'setStatus']) {
      assert.equal(typeof cartsRepository[method], 'function', `${method} exists`);
    }
  });
});
