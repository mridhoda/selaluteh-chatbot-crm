import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CartStatus, OrderStatus, FulfillmentType, ActorType,
  isValidCartTransition, isValidOrderTransition, ORDER_ERRORS,
} from '../../../src/orders/order-types.js';

describe('order-types', () => {
  describe('CartStatus', () => {
    it('has expected values', () => {
      assert.strictEqual(CartStatus.DRAFT, 'DRAFT');
      assert.strictEqual(CartStatus.ACTIVE, 'ACTIVE');
      assert.strictEqual(CartStatus.CONVERTED, 'CONVERTED');
    });
  });

  describe('OrderStatus', () => {
    it('has expected values', () => {
      assert.strictEqual(OrderStatus.PENDING_PAYMENT, 'PENDING_PAYMENT');
      assert.strictEqual(OrderStatus.AWAITING_OUTLET_APPROVAL, 'AWAITING_OUTLET_APPROVAL');
      assert.strictEqual(OrderStatus.COMPLETED, 'COMPLETED');
    });
  });

  describe('isValidCartTransition', () => {
    it('allows ACTIVE → CONFIRMATION_REQUIRED', () => {
      assert.ok(isValidCartTransition(CartStatus.ACTIVE, CartStatus.CONFIRMATION_REQUIRED));
    });
    it('allows CONFIRMATION_REQUIRED → CONFIRMED', () => {
      assert.ok(isValidCartTransition(CartStatus.CONFIRMATION_REQUIRED, CartStatus.CONFIRMED));
    });
    it('allows CONFIRMED → CHECKOUT_LOCKED', () => {
      assert.ok(isValidCartTransition(CartStatus.CONFIRMED, CartStatus.CHECKOUT_LOCKED));
    });
    it('allows CHECKOUT_LOCKED → CONVERTED', () => {
      assert.ok(isValidCartTransition(CartStatus.CHECKOUT_LOCKED, CartStatus.CONVERTED));
    });
    it('rejects CONVERTED → ACTIVE', () => {
      assert.ok(!isValidCartTransition(CartStatus.CONVERTED, CartStatus.ACTIVE));
    });
  });

  describe('isValidOrderTransition', () => {
    it('allows PENDING_PAYMENT → AWAITING_OUTLET_APPROVAL', () => {
      assert.ok(isValidOrderTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.AWAITING_OUTLET_APPROVAL));
    });
    it('allows AWAITING_OUTLET_APPROVAL → APPROVED', () => {
      assert.ok(isValidOrderTransition(OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.APPROVED));
    });
    it('allows APPROVED → PREPARING', () => {
      assert.ok(isValidOrderTransition(OrderStatus.APPROVED, OrderStatus.PREPARING));
    });
    it('allows PREPARING → READY_FOR_PICKUP', () => {
      assert.ok(isValidOrderTransition(OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP));
    });
    it('allows READY_FOR_PICKUP → COMPLETED', () => {
      assert.ok(isValidOrderTransition(OrderStatus.READY_FOR_PICKUP, OrderStatus.COMPLETED));
    });
    it('rejects COMPLETED → APPROVED', () => {
      assert.ok(!isValidOrderTransition(OrderStatus.COMPLETED, OrderStatus.APPROVED));
    });
    it('rejects AWAITING_OUTLET_APPROVAL → COMPLETED', () => {
      assert.ok(!isValidOrderTransition(OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.COMPLETED));
    });
  });

  describe('ORDER_ERRORS', () => {
    it('has expected error codes', () => {
      assert.strictEqual(ORDER_ERRORS.CART_NOT_FOUND.code, 'CART_NOT_FOUND');
      assert.strictEqual(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'ORDER_NOT_FOUND');
      assert.strictEqual(ORDER_ERRORS.ORDER_INVALID_TRANSITION.code, 'ORDER_INVALID_TRANSITION');
      assert.strictEqual(ORDER_ERRORS.PRICING_CHANGED.code, 'ORDER_PRICING_CHANGED');
    });
  });
});
