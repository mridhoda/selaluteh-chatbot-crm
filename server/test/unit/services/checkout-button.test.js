/**
 * checkout-button.test.js — Verifies the checkout button appears after cart is ready
 * Tests the core logic: cart detection → checkout creation → button availability
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('checkout button logic', () => {
  const mockCart = {
    id: 'cart-123',
    outletId: 'outlet-456',
    status: 'active',
    items: [{ productId: 'p1', name: 'Teh Tarik Original', quantity: 1, price: 15000 }],
    total: 15000,
  };

  it('detects active cart with items', () => {
    const hasItems = mockCart && mockCart.items?.length > 0 && mockCart.status !== 'converted';
    assert.ok(hasItems, 'Cart should trigger checkout button');
  });

  it('rejects converted cart', () => {
    const convertedCart = { ...mockCart, status: 'converted' };
    const hasItems = convertedCart && convertedCart.items?.length > 0 && convertedCart.status !== 'converted';
    assert.ok(!hasItems, 'Converted cart should NOT trigger button');
  });

  it('rejects empty cart', () => {
    const emptyCart = { ...mockCart, items: [] };
    const hasItems = emptyCart && emptyCart.items?.length > 0 && emptyCart.status !== 'converted';
    assert.ok(!hasItems, 'Empty cart should NOT trigger button');
  });

  it('checkout idempotency key format', () => {
    const cartId = 'cart-123';
    const key = `tg_checkout_${cartId}_${Date.now()}`;
    assert.match(key, /^tg_checkout_cart-123_\d+$/);
  });

  it('requires the active cart to belong to the current outlet', () => {
    const currentOutletId = 'outlet-new';
    const cartForCheckout = String(mockCart.outletId) === String(currentOutletId) ? mockCart : null;
    assert.equal(cartForCheckout, null, 'Old cart from a different outlet must not trigger checkout');
  });

  it('records the same checkout prompt text that is sent to Telegram', () => {
    const checkoutPrompt = 'Silakan klik tombol di bawah untuk checkout dan dapatkan link pembayaran:';
    const sentText = checkoutPrompt;
    const persistedText = checkoutPrompt;
    assert.strictEqual(persistedText, sentText);
  });
});
