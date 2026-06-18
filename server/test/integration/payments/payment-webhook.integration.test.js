import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPaymentEventId } from '../../../src/services/webhook-idempotency.service.js';
import { paymentEventsRepository } from '../../../src/db/repositories/index.js';


describe('payment webhook contract', () => {
  it('derives stable payment event IDs from provider payloads', () => {
    assert.equal(getPaymentEventId('midtrans', { transaction_id: 'trx-1' }), 'trx-1');
    assert.equal(getPaymentEventId('xendit', { event_id: 'evt-1' }), 'evt-1');
    assert.equal(getPaymentEventId('manual', { order_id: 'order-1' }), 'order-1');
  });

  it('exposes methods required by payment webhook service', () => {
    for (const method of ['findByProviderEventId', 'create', 'updateProcessingStatus', 'updateReferences']) {
      assert.equal(typeof paymentEventsRepository[method], 'function', `${method} exists`);
    }
  });
});
