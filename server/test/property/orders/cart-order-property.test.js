import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidCartTransition, isValidOrderTransition, CartStatus, OrderStatus } from '../../../src/orders/order-types.js';

describe('property: cart-order-lifecycle', () => {
  describe('one-cart-one-order', () => {
    it('CONVERTED cart cannot transition', () => {
      assert.ok(!isValidCartTransition(CartStatus.CONVERTED, CartStatus.ACTIVE));
      assert.ok(!isValidCartTransition(CartStatus.CONVERTED, CartStatus.CONFIRMED));
    });

    it('CHECKOUT_LOCKED only goes to CONVERTED or ACTIVE', () => {
      assert.ok(isValidCartTransition(CartStatus.CHECKOUT_LOCKED, CartStatus.CONVERTED));
      assert.ok(isValidCartTransition(CartStatus.CHECKOUT_LOCKED, CartStatus.ACTIVE));
      assert.ok(!isValidCartTransition(CartStatus.CHECKOUT_LOCKED, CartStatus.CANCELLED));
    });
  });

  describe('unpaid-order-cannot-be-approved', () => {
    it('AWAITING_OUTLET_APPROVAL requires paid payment', () => {
      assert.ok(isValidOrderTransition(OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.APPROVED));
      assert.ok(isValidOrderTransition(OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.REJECTED));
    });

    it('PENDING_PAYMENT cannot skip to APPROVED', () => {
      assert.ok(!isValidOrderTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.APPROVED));
    });
  });

  describe('payment-and-approval-separated', () => {
    it('COMPLETED is terminal', () => {
      assert.strictEqual(isValidOrderTransition(OrderStatus.COMPLETED, OrderStatus.APPROVED), false);
      assert.strictEqual(isValidOrderTransition(OrderStatus.COMPLETED, OrderStatus.PREPARING), false);
    });

    it('REJECTED is terminal', () => {
      assert.strictEqual(isValidOrderTransition(OrderStatus.REJECTED, OrderStatus.APPROVED), false);
      assert.strictEqual(isValidOrderTransition(OrderStatus.REJECTED, OrderStatus.PENDING_PAYMENT), false);
    });
  });

  describe('duplicate-paid-event-once', () => {
    it('AWAITING_OUTLET_APPROVAL from PENDING_PAYMENT allowed once', () => {
      assert.ok(isValidOrderTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.AWAITING_OUTLET_APPROVAL));
      assert.ok(!isValidOrderTransition(OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.AWAITING_OUTLET_APPROVAL));
    });
  });

  describe('fulfillment-chains', () => {
    it('APPROVED → PREPARING → READY → COMPLETED', () => {
      assert.ok(isValidOrderTransition(OrderStatus.APPROVED, OrderStatus.PREPARING));
      assert.ok(isValidOrderTransition(OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP));
      assert.ok(isValidOrderTransition(OrderStatus.READY_FOR_PICKUP, OrderStatus.COMPLETED));
    });

    it('COMPLETED cannot go backward', () => {
      assert.ok(!isValidOrderTransition(OrderStatus.COMPLETED, OrderStatus.PREPARING));
      assert.ok(!isValidOrderTransition(OrderStatus.COMPLETED, OrderStatus.AWAITING_OUTLET_APPROVAL));
    });

    it('CANCELLED is terminal', () => {
      assert.ok(!isValidOrderTransition(OrderStatus.CANCELLED, OrderStatus.PENDING_PAYMENT));
      assert.ok(!isValidOrderTransition(OrderStatus.CANCELLED, OrderStatus.APPROVED));
    });
  });
});
