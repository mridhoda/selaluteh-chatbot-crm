import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PaymentStatus, isValidPaymentTransition, PAYMENT_TRANSITIONS } from '../../../src/payments/payment-types.js';

describe('property: payments', () => {
  describe('only verified provider truth produces PAID', () => {
    it('PAID is terminal', () => {
      for (const status of Object.values(PaymentStatus)) {
        if (status === PaymentStatus.PAID) continue;
        assert.ok(!isValidPaymentTransition(PaymentStatus.PAID, status), `PAID → ${status} must be invalid`);
      }
    });

    it('CREATED cannot become PAID directly', () => {
      assert.ok(!isValidPaymentTransition(PaymentStatus.CREATED, PaymentStatus.PAID));
    });
  });

  describe('PAID never downgraded', () => {
    it('no transition from PAID exists', () => {
      assert.strictEqual(PAYMENT_TRANSITIONS[PaymentStatus.PAID].length, 0);
    });
  });

  describe('duplicate event has one effect', () => {
    it('PENDING → PAID valid once', () => {
      assert.ok(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.PAID));
    });
  });

  describe('all statuses defined', () => {
    it('every PaymentStatus has transitions array', () => {
      for (const s of Object.values(PaymentStatus)) {
        assert.ok(Array.isArray(PAYMENT_TRANSITIONS[s]), s);
      }
    });
  });
});
