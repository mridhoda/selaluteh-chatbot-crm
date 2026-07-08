import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CartStatus, OrderStatus, PaymentStatus, FulfillmentStatus, PublicOrderStatus,
  PublicOrderChannel, RuntimeFulfillmentType, RuntimePaymentProviderCode, RuntimePaymentProviderMode,
  RuntimeQrLocationType, RuntimeQrSessionStatus, RuntimeQrStatus,
  canTransitionFulfillment, canTransitionPayment,
  derivePublicOrderStatus, getOrderCapabilities,
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

  describe('payment, fulfillment, and public statuses', () => {
    it('defines lower-case payment and fulfillment statuses', () => {
      assert.strictEqual(PaymentStatus.PAID, 'paid');
      assert.strictEqual(PaymentStatus.MANUAL_REVIEW, 'manual_review');
      assert.strictEqual(FulfillmentStatus.AWAITING_ACCEPTANCE, 'awaiting_acceptance');
      assert.strictEqual(PublicOrderStatus.ORDER_RECEIVED, 'order_received');
    });

    it('validates payment transitions without allowing stale downgrade after paid', () => {
      assert.ok(canTransitionPayment(PaymentStatus.PENDING, PaymentStatus.PAID));
      assert.ok(canTransitionPayment(PaymentStatus.PROCESSING, PaymentStatus.PAID));
      assert.ok(canTransitionPayment(PaymentStatus.PROCESSING, PaymentStatus.MANUAL_REVIEW));
      assert.ok(canTransitionPayment(PaymentStatus.MANUAL_REVIEW, PaymentStatus.FAILED));
      assert.ok(!canTransitionPayment(PaymentStatus.PAID, PaymentStatus.EXPIRED));
      assert.ok(!canTransitionPayment(PaymentStatus.PAID, PaymentStatus.FAILED));
    });

    it('validates fulfillment transitions separately from payment', () => {
      assert.ok(canTransitionFulfillment(FulfillmentStatus.NOT_STARTED, FulfillmentStatus.AWAITING_ACCEPTANCE));
      assert.ok(canTransitionFulfillment(FulfillmentStatus.AWAITING_ACCEPTANCE, FulfillmentStatus.ACCEPTED));
      assert.ok(!canTransitionFulfillment(FulfillmentStatus.AWAITING_ACCEPTANCE, FulfillmentStatus.PREPARING));
      assert.ok(!canTransitionFulfillment(FulfillmentStatus.READY, FulfillmentStatus.PREPARING));
    });

    it('derives public order status from payment and fulfillment truth', () => {
      assert.strictEqual(derivePublicOrderStatus({ paymentStatus: 'pending', fulfillmentStatus: 'not_started' }), 'payment_pending');
      assert.strictEqual(derivePublicOrderStatus({ paymentStatus: 'failed', fulfillmentStatus: 'not_started' }), 'payment_failed');
      assert.strictEqual(derivePublicOrderStatus({ paymentStatus: 'expired', fulfillmentStatus: 'not_started' }), 'payment_expired');
      assert.strictEqual(derivePublicOrderStatus({ paymentStatus: 'paid', fulfillmentStatus: 'awaiting_acceptance' }), 'order_received');
      assert.strictEqual(derivePublicOrderStatus({ paymentStatus: 'paid', fulfillmentStatus: 'preparing' }), 'preparing');
      assert.strictEqual(derivePublicOrderStatus({ paymentStatus: 'paid', fulfillmentStatus: 'cancelled' }), 'cancelled');
    });

    it('exposes paid-only fulfillment capabilities', () => {
      assert.deepStrictEqual(getOrderCapabilities({ paymentStatus: 'pending', fulfillmentStatus: 'awaiting_acceptance' }), {
        canAccept: false,
        canStartPreparing: false,
        canMarkReady: false,
        canComplete: false,
        canCancel: true,
      });
      assert.equal(getOrderCapabilities({ paymentStatus: 'paid', fulfillmentStatus: 'awaiting_acceptance' }).canAccept, true);
      assert.equal(getOrderCapabilities({ paymentStatus: 'paid', fulfillmentStatus: 'accepted' }).canStartPreparing, true);
      assert.equal(getOrderCapabilities({ paymentStatus: 'paid', fulfillmentStatus: 'preparing' }).canMarkReady, true);
      assert.equal(getOrderCapabilities({ paymentStatus: 'paid', fulfillmentStatus: 'ready' }).canComplete, true);
    });
  });

  describe('Phase 3.1 runtime domain constants', () => {
    it('locks public ordering alpha channels and pickup-only runtime checkout scope', () => {
      assert.deepEqual(Object.values(PublicOrderChannel).sort(), ['online_store', 'qr_store']);
      assert.equal(RuntimeFulfillmentType.PICKUP, 'pickup');
      assert.equal(RuntimeFulfillmentType.DINE_IN, 'dine_in');
      assert.equal(RuntimeFulfillmentType.TAKEAWAY, 'takeaway');
    });

    it('keeps QR and payment provider values aligned to runtime support', () => {
      assert.equal(RuntimeQrLocationType.PICKUP_AREA, 'pickup_area');
      assert.equal(RuntimeQrLocationType.PICKUP_LEGACY, 'pickup');
      assert.deepEqual(Object.values(RuntimeQrSessionStatus).sort(), ['active', 'cancelled', 'completed', 'expired']);
      assert.ok(Object.values(RuntimeQrStatus).includes('archived'));
      assert.deepEqual(Object.values(RuntimePaymentProviderCode).sort(), ['bayargg', 'doku', 'manual', 'xendit']);
      assert.deepEqual(Object.values(RuntimePaymentProviderMode).sort(), ['production', 'sandbox', 'test']);
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
