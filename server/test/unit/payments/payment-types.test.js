import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PaymentStatus, SessionStatus, isValidPaymentTransition, PAYMENT_ERRORS, PAYMENT_TRANSITIONS,
} from '../../../src/payments/payment-types.js';

describe('payment-types', () => {
  describe('PaymentStatus', () => {
    it('has expected values', () => {
      assert.strictEqual(PaymentStatus.CREATED, 'CREATED');
      assert.strictEqual(PaymentStatus.PAID, 'PAID');
      assert.strictEqual(PaymentStatus.REVIEW_REQUIRED, 'REVIEW_REQUIRED');
    });
  });

  describe('isValidPaymentTransition', () => {
    const valid = [
      ['CREATED → PENDING', PaymentStatus.CREATED, PaymentStatus.PENDING, true],
      ['PENDING → PAID', PaymentStatus.PENDING, PaymentStatus.PAID, true],
      ['PENDING → FAILED', PaymentStatus.PENDING, PaymentStatus.FAILED, true],
      ['PENDING → EXPIRED', PaymentStatus.PENDING, PaymentStatus.EXPIRED, true],
      ['PENDING → REVIEW_REQUIRED', PaymentStatus.PENDING, PaymentStatus.REVIEW_REQUIRED, true],
      ['REVIEW_REQUIRED → PAID', PaymentStatus.REVIEW_REQUIRED, PaymentStatus.PAID, true],
      ['REVIEW_REQUIRED → FAILED', PaymentStatus.REVIEW_REQUIRED, PaymentStatus.FAILED, true],
      ['PAID → anything', PaymentStatus.PAID, PaymentStatus.PENDING, false],
      ['FAILED → PAID', PaymentStatus.FAILED, PaymentStatus.PAID, false],
      ['EXPIRED → PAID', PaymentStatus.EXPIRED, PaymentStatus.PAID, false],
    ];

    for (const [label, from, to, expected] of valid) {
      it(label, () => {
        assert.strictEqual(isValidPaymentTransition(from, to), expected);
      });
    }
  });

  describe('PAYMENT_ERRORS', () => {
    it('has expected error codes', () => {
      assert.strictEqual(PAYMENT_ERRORS.ALREADY_PAID.code, 'PAYMENT_ALREADY_PAID');
      assert.strictEqual(PAYMENT_ERRORS.WEBHOOK_VERIFICATION_FAILED.code, 'WEBHOOK_VERIFICATION_FAILED');
      assert.strictEqual(PAYMENT_ERRORS.AMOUNT_MISMATCH.code, 'PAYMENT_AMOUNT_MISMATCH');
    });
  });

  describe('all statuses have transitions defined', () => {
    it('covers all PaymentStatus values', () => {
      for (const status of Object.values(PaymentStatus)) {
        assert.ok(Array.isArray(PAYMENT_TRANSITIONS[status]), `PaymentStatus ${status} missing transitions`);
      }
    });
  });
});
