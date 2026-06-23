import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CartStatus, OrderStatus,
  isValidCartTransition, isValidOrderTransition, CART_TRANSITIONS, ORDER_TRANSITIONS,
} from '../../../src/orders/order-types.js';

describe('e2e: cart-order-lifecycle', () => {
  const happyPathCart = [
    ['DRAFT → ACTIVE', CartStatus.DRAFT, CartStatus.ACTIVE, true],
    ['ACTIVE → CONFIRMATION_REQUIRED', CartStatus.ACTIVE, CartStatus.CONFIRMATION_REQUIRED, true],
    ['CONFIRMATION_REQUIRED → CONFIRMED', CartStatus.CONFIRMATION_REQUIRED, CartStatus.CONFIRMED, true],
    ['CONFIRMED → CHECKOUT_LOCKED', CartStatus.CONFIRMED, CartStatus.CHECKOUT_LOCKED, true],
    ['CHECKOUT_LOCKED → CONVERTED', CartStatus.CHECKOUT_LOCKED, CartStatus.CONVERTED, true],
  ];

  for (const [label, from, to, expected] of happyPathCart) {
    it(`cart happy path: ${label}`, () => {
      assert.strictEqual(isValidCartTransition(from, to), expected);
    });
  }

  const happyPathOrder = [
    ['PENDING_PAYMENT → AWAITING_OUTLET_APPROVAL', OrderStatus.PENDING_PAYMENT, OrderStatus.AWAITING_OUTLET_APPROVAL, true],
    ['AWAITING_OUTLET_APPROVAL → APPROVED', OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.APPROVED, true],
    ['APPROVED → PREPARING', OrderStatus.APPROVED, OrderStatus.PREPARING, true],
    ['PREPARING → READY_FOR_PICKUP', OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP, true],
    ['READY_FOR_PICKUP → COMPLETED', OrderStatus.READY_FOR_PICKUP, OrderStatus.COMPLETED, true],
  ];

  for (const [label, from, to, expected] of happyPathOrder) {
    it(`order happy path: ${label}`, () => {
      assert.strictEqual(isValidOrderTransition(from, to), expected);
    });
  }

  const rejectionPaths = [
    ['AWAITING_OUTLET_APPROVAL → REJECTED', OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.REJECTED, true],
    ['PENDING_PAYMENT → CANCELLED', OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED, true],
    ['PENDING_PAYMENT → EXPIRED', OrderStatus.PENDING_PAYMENT, OrderStatus.EXPIRED, true],
  ];

  for (const [label, from, to, expected] of rejectionPaths) {
    it(`rejection/expiry: ${label}`, () => {
      assert.strictEqual(isValidOrderTransition(from, to), expected);
    });
  }

  const invalidPaths = [
    ['DRAFT cannot checkout', CartStatus.DRAFT, CartStatus.CONVERTED, false],
    ['ACTIVE cannot create order', CartStatus.ACTIVE, CartStatus.CONVERTED, false],
    ['no payment cannot approve', OrderStatus.PENDING_PAYMENT, OrderStatus.APPROVED, false],
    ['COMPLETED cannot go back', OrderStatus.COMPLETED, OrderStatus.PREPARING, false],
    ['EXPIRED cannot revive', OrderStatus.EXPIRED, OrderStatus.PENDING_PAYMENT, false],
    ['CANCELLED cannot revive', OrderStatus.CANCELLED, OrderStatus.PENDING_PAYMENT, false],
    ['REJECTED cannot approve', OrderStatus.REJECTED, OrderStatus.APPROVED, false],
  ];

  for (const [label, from, to, expected] of invalidPaths) {
    it(`invalid path: ${label}`, () => {
      assert.strictEqual(isValidCartTransition(from, to) || isValidOrderTransition(from, to), expected);
    });
  }

  it('all cart statuses have defined transitions', () => {
    for (const status of Object.values(CartStatus)) {
      assert.ok(Array.isArray(CART_TRANSITIONS[status]), `CartStatus ${status} has transitions`);
    }
  });

  it('all order statuses have defined transitions', () => {
    for (const status of Object.values(OrderStatus)) {
      assert.ok(Array.isArray(ORDER_TRANSITIONS[status]), `OrderStatus ${status} has transitions`);
    }
  });
});
