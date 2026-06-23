import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PaymentStatus, isValidPaymentTransition } from '../../../src/payments/payment-types.js';

describe('resilience: payments', () => {
  it('PAID remains PAID after failure scenario', () => {
    assert.ok(!isValidPaymentTransition(PaymentStatus.PAID, PaymentStatus.FAILED));
  });

  it('REVIEW_REQUIRED can become PAID after reconciliation', () => {
    assert.ok(isValidPaymentTransition(PaymentStatus.REVIEW_REQUIRED, PaymentStatus.PAID));
  });

  it('REVIEW_REQUIRED can become FAILED', () => {
    assert.ok(isValidPaymentTransition(PaymentStatus.REVIEW_REQUIRED, PaymentStatus.FAILED));
  });

  it('PENDING can handle timeout → EXPIRED', () => {
    assert.ok(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.EXPIRED));
  });

  it('EXPIRED is terminal', () => {
    assert.ok(!isValidPaymentTransition(PaymentStatus.EXPIRED, PaymentStatus.PENDING));
    assert.ok(!isValidPaymentTransition(PaymentStatus.EXPIRED, PaymentStatus.PAID));
  });
});
