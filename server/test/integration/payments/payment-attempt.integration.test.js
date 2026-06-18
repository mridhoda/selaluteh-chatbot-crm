import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { determineReconciliationStatus } from '../../../src/services/payment-reconciliation.service.js';
import { paymentsRepository, paymentEventsRepository } from '../../../src/db/repositories/index.js';


describe('payment attempt/reconciliation', () => {
  it('classifies provider/internal payment state', () => {
    assert.equal(determineReconciliationStatus({
      payment: { status: 'paid', amount: 100, reconciliationStatus: 'pending' },
      order: { totals: { total: 100 }, paymentStatus: 'paid' },
      providerStatus: 'paid',
    }), 'matched');

    assert.equal(determineReconciliationStatus({
      payment: { status: 'pending', amount: 100, reconciliationStatus: 'pending' },
      order: { totals: { total: 100 } },
      providerStatus: 'paid',
    }), 'missing_webhook');

    assert.equal(determineReconciliationStatus({
      payment: { status: 'paid', amount: 100, reconciliationStatus: 'pending' },
      order: { totals: { total: 120 } },
      providerStatus: 'paid',
    }), 'amount_mismatch');
  });

  it('exposes Supabase payment repository contract', () => {
    for (const method of ['findById', 'findByOrder', 'findByMerchantReference', 'list', 'create', 'atomicStatusUpdate', 'updatePayment']) {
      assert.equal(typeof paymentsRepository[method], 'function', `${method} exists`);
    }
  });

  it('exposes Supabase payment event repository contract', () => {
    for (const method of ['create', 'findByProviderEventId', 'updateProcessingStatus', 'updateReferences', 'findByPayment']) {
      assert.equal(typeof paymentEventsRepository[method], 'function', `${method} exists`);
    }
  });
});
