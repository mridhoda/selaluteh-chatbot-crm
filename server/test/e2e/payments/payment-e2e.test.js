import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PaymentStatus, isValidPaymentTransition, PAYMENT_TRANSITIONS,
} from '../../../src/payments/payment-types.js';

describe('e2e: payments', () => {
  // Happy path: CREATED → PENDING → PAID
  it('CREATED → PENDING → PAID', () => {
    assert.ok(isValidPaymentTransition(PaymentStatus.CREATED, PaymentStatus.PENDING));
    assert.ok(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.PAID));
  });

  // Review path: PENDING → REVIEW_REQUIRED → PAID
  it('PENDING → REVIEW_REQUIRED → PAID', () => {
    assert.ok(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.REVIEW_REQUIRED));
    assert.ok(isValidPaymentTransition(PaymentStatus.REVIEW_REQUIRED, PaymentStatus.PAID));
  });

  // Expiry path: PENDING → EXPIRED
  it('PENDING → EXPIRED', () => {
    assert.ok(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.EXPIRED));
  });

  // Failure path: PENDING → FAILED
  it('PENDING → FAILED', () => {
    assert.ok(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.FAILED));
  });

  // Cancellation path: CREATED → CANCELLED, PENDING → CANCELLED
  it('CREATED → CANCELLED', () => {
    assert.ok(isValidPaymentTransition(PaymentStatus.CREATED, PaymentStatus.CANCELLED));
  });
  it('PENDING → CANCELLED', () => {
    assert.ok(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.CANCELLED));
  });

  // All status transitions defined
  it('all payment statuses have transitions', () => {
    const statuses = Object.values(PaymentStatus);
    for (const s of statuses) {
      assert.ok(Array.isArray(PAYMENT_TRANSITIONS[s]), `Missing: ${s}`);
    }
  });

  // PAID cannot go to any other status
  it('PAID is terminal across all possible targets', () => {
    const all = Object.values(PaymentStatus);
    for (const target of all) {
      if (target === PaymentStatus.PAID) continue;
      assert.ok(!isValidPaymentTransition(PaymentStatus.PAID, target), `PAID → ${target} must fail`);
    }
  });
});
