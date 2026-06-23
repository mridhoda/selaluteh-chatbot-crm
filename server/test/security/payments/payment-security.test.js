import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidPaymentTransition, PaymentStatus, PAYMENT_ERRORS } from '../../../src/payments/payment-types.js';

describe('security: payments', () => {
  describe('no fake PAID', () => {
    it('CREATED → PAID rejected', () => {
      assert.ok(!isValidPaymentTransition(PaymentStatus.CREATED, PaymentStatus.PAID));
    });
    it('FAILED → PAID rejected', () => {
      assert.ok(!isValidPaymentTransition(PaymentStatus.FAILED, PaymentStatus.PAID));
    });
    it('EXPIRED → PAID rejected', () => {
      assert.ok(!isValidPaymentTransition(PaymentStatus.EXPIRED, PaymentStatus.PAID));
    });
  });

  describe('amount mismatch', () => {
    it('PAYMENT_AMOUNT_MISMATCH defined', () => {
      assert.strictEqual(PAYMENT_ERRORS.AMOUNT_MISMATCH.code, 'PAYMENT_AMOUNT_MISMATCH');
    });
  });

  describe('webhook verification', () => {
    it('WEBHOOK_VERIFICATION_FAILED defined', () => {
      assert.strictEqual(PAYMENT_ERRORS.WEBHOOK_VERIFICATION_FAILED.code, 'WEBHOOK_VERIFICATION_FAILED');
      assert.strictEqual(PAYMENT_ERRORS.WEBHOOK_VERIFICATION_FAILED.status, 401);
    });
  });

  describe('cross-outlet', () => {
    it('PAYMENT_CROSS_OUTLET defined', () => {
      assert.strictEqual(PAYMENT_ERRORS.CROSS_OUTLET.code, 'PAYMENT_CROSS_OUTLET');
    });
  });
});
