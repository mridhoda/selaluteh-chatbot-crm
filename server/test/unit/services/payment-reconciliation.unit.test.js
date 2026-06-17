import { describe, it } from 'node:test';
import assert from 'node:assert';
import { determineReconciliationStatus } from '../../../src/services/payment-reconciliation.service.js';

describe('payment reconciliation', () => {
  it('matched when both provider and payment are paid', () => {
    const result = determineReconciliationStatus({
      payment: { status: 'paid', reconciliationStatus: 'pending', amount: 10000 },
      order: { totals: { total: 10000 } },
      providerStatus: 'paid',
    });
    assert.strictEqual(result, 'matched');
  });

  it('missing_webhook when provider is paid but payment is pending', () => {
    const result = determineReconciliationStatus({
      payment: { status: 'pending', reconciliationStatus: 'pending', amount: 10000 },
      order: { totals: { total: 10000 } },
      providerStatus: 'paid',
    });
    assert.strictEqual(result, 'missing_webhook');
  });

  it('unmatched when payment is paid but provider is not', () => {
    const result = determineReconciliationStatus({
      payment: { status: 'paid', reconciliationStatus: 'pending', amount: 10000 },
      order: { totals: { total: 10000 } },
      providerStatus: 'pending',
    });
    assert.strictEqual(result, 'unmatched');
  });

  it('amount_mismatch when amounts differ', () => {
    const result = determineReconciliationStatus({
      payment: { status: 'paid', reconciliationStatus: 'pending', amount: 5000 },
      order: { totals: { total: 10000 } },
      providerStatus: 'paid',
    });
    assert.strictEqual(result, 'amount_mismatch');
  });
});
