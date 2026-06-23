import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PaymentStatus, isValidPaymentTransition, PAYMENT_TRANSITIONS } from '../../../src/payments/payment-types.js';

describe('concurrency: payments', () => {
  it('duplicate PAID blocked', () => {
    assert.ok(!isValidPaymentTransition(PaymentStatus.PAID, PaymentStatus.PAID));
  });

  it('PENDING → PAID then PAID → anything blocked', () => {
    assert.ok(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.PAID));
    assert.ok(!isValidPaymentTransition(PaymentStatus.PAID, PaymentStatus.EXPIRED));
  });
});
