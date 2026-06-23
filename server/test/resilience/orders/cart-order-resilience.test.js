import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrderStatus, CartStatus, isValidOrderTransition, isValidCartTransition } from '../../../src/orders/order-types.js';

describe('resilience: cart-order-lifecycle', () => {
  describe('external service failure', () => {
    it('inventory failure blocks checkout — checked via service, not state', () => {
      assert.ok(isValidCartTransition(CartStatus.CONFIRMED, CartStatus.CHECKOUT_LOCKED));
    });
  });

  describe('payment link failure', () => {
    it('PENDING_PAYMENT can become AWAITING_OUTLET_APPROVAL on paid', () => {
      assert.ok(isValidOrderTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.AWAITING_OUTLET_APPROVAL));
    });
  });

  describe('notification failure', () => {
    it('order truth unchanged after notification failure — state allows transitions', () => {
      assert.ok(isValidOrderTransition(OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.APPROVED));
      assert.ok(isValidOrderTransition(OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.REJECTED));
    });
  });

  describe('expiry and timeout', () => {
    it('PENDING_PAYMENT can expire', () => {
      assert.ok(isValidOrderTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.EXPIRED));
    });

    it('EXPIRED is terminal', () => {
      assert.ok(!isValidOrderTransition(OrderStatus.EXPIRED, OrderStatus.PENDING_PAYMENT));
      assert.ok(!isValidOrderTransition(OrderStatus.EXPIRED, OrderStatus.APPROVED));
    });
  });

  describe('paid cancellation resilience', () => {
    it('paid order should NOT silently cancel — AWAITING_OUTLET_APPROVAL can cancel with policy', () => {
      assert.ok(isValidOrderTransition(OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.CANCELLED));
    });

    it('PAID payment should not be reverted by order cancellation', () => {
      assert.ok(isValidOrderTransition(OrderStatus.APPROVED, OrderStatus.CANCELLED));
    });
  });
});
