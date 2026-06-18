import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { webhookEventsRepository } from '../../../src/db/repositories/index.js';
import { getPaymentEventId, getTelegramEventId } from '../../../src/services/webhook-idempotency.service.js';


describe('webhook idempotency repository contract', () => {
  it('exposes Supabase webhook event methods used by idempotency service', () => {
    for (const method of ['create', 'findByProviderPlatformEvent', 'incrementAttempt', 'incrementAttemptByKey', 'markProcessed', 'markFailed']) {
      assert.equal(typeof webhookEventsRepository[method], 'function', `${method} exists`);
    }
  });

  it('derives deterministic external event ids across providers', () => {
    assert.equal(getTelegramEventId({ callback_query: { id: 'cb-1' } }), 'callback:cb-1');
    assert.equal(getPaymentEventId('midtrans', { transaction_id: 'trx-1' }), 'trx-1');
  });
});
