import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPaymentEventId } from '../../../src/services/webhook-idempotency.service.js';
import { paymentEventsRepository } from '../../../src/db/repositories/index.js';
import { processBayarGgWebhook } from '../../../src/services/payment-webhook.service.js';


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

  it('processes valid BayarGG paid webhook after verification and fulfils once', async () => {
    const calls = [];
    const deps = buildBayarGgWebhookDeps({ calls });

    const result = await processBayarGgWebhook({ rawBody: JSON.stringify({ invoice_id: 'INV-123' }), headers: { 'x-test': '1' } }, deps);

    assert.deepEqual(result, { processed: true, event: { eventType: 'payment.paid', status: 'paid' } });
    assert.deepEqual(calls.slice(0, 5), ['find-payment', 'runtime-config', 'resolve-provider', 'verify-webhook', 'find-event']);
    assert.equal(calls.includes('transition-paid'), true);
    assert.equal(calls.includes('mark-order-paid'), true);
    assert.equal(calls.includes('notify-paid-order'), true);
    assert.equal(deps.state.eventStatuses.at(-1).verificationResult, 'paid');
  });

  it('rejects BayarGG verification failure before mutating payment events', async () => {
    const calls = [];
    const deps = buildBayarGgWebhookDeps({ calls, verifyResult: { valid: false, reason: 'check_payment_failed: network' } });

    await assert.rejects(
      () => processBayarGgWebhook({ rawBody: JSON.stringify({ invoice_id: 'INV-123' }), headers: {} }, deps),
      (err) => err.code === 'BAYARGG_WEBHOOK_UNAUTHORIZED' && err.status === 401,
    );

    assert.deepEqual(calls, ['find-payment', 'runtime-config', 'resolve-provider', 'verify-webhook', 'security-payment.webhook_verification_failed']);
    assert.equal(deps.state.createdEvents.length, 0);
    assert.equal(deps.state.paymentUpdates.length, 0);
    assert.equal(deps.state.securityEvents.length, 1);
    assert.equal(deps.state.securityEvents[0].eventType, 'payment.webhook_verification_failed');
    assert.equal(deps.state.securityEvents[0].metadata.provider, 'bayargg');
  });

  it('returns safe no-op for duplicate BayarGG webhook', async () => {
    const deps = buildBayarGgWebhookDeps({ existingEvent: { id: 'evt-existing', processingStatus: 'processed' } });

    const result = await processBayarGgWebhook({ rawBody: JSON.stringify({ invoice_id: 'INV-123' }), headers: {} }, deps);

    assert.deepEqual(result, { processed: false, reason: 'duplicate', existingEventId: 'evt-existing' });
    assert.equal(deps.state.createdEvents.length, 0);
    assert.equal(deps.state.transitionCalls.length, 0);
  });

  it('routes BayarGG amount mismatch to manual_review without fulfilment', async () => {
    const deps = buildBayarGgWebhookDeps({ eventOverrides: { amount: 51000 } });

    const result = await processBayarGgWebhook({ rawBody: JSON.stringify({ invoice_id: 'INV-123' }), headers: {} }, deps);

    assert.equal(result.reason, 'amount_mismatch');
    assert.deepEqual(deps.state.paymentUpdates.at(-1).updates, { status: 'manual_review', reconciliation_status: 'manual_review' });
    assert.equal(deps.state.eventStatuses.at(-1).verificationResult, 'amount_mismatch');
    assert.equal(deps.state.transitionCalls.length, 0);
    assert.equal(deps.state.markOrderPaidCalls, 0);
    assert.equal(deps.state.auditLogs.some((entry) => entry.action === 'payment.manual_review'), true);
  });

  it('routes BayarGG currency mismatch to manual_review without fulfilment', async () => {
    const deps = buildBayarGgWebhookDeps({ eventOverrides: { currency: 'USD' } });

    const result = await processBayarGgWebhook({ rawBody: JSON.stringify({ invoice_id: 'INV-123' }), headers: {} }, deps);

    assert.equal(result.reason, 'currency_mismatch');
    assert.deepEqual(deps.state.paymentUpdates.at(-1).updates, { status: 'manual_review', reconciliation_status: 'manual_review' });
    assert.equal(deps.state.eventStatuses.at(-1).verificationResult, 'currency_mismatch');
    assert.equal(deps.state.transitionCalls.length, 0);
    assert.equal(deps.state.markOrderPaidCalls, 0);
  });

  it('routes expired BayarGG paid callback to manual_review without fulfilment', async () => {
    const deps = buildBayarGgWebhookDeps({ paymentOverrides: { expiresAt: new Date(Date.now() - 60_000).toISOString() } });

    const result = await processBayarGgWebhook({ rawBody: JSON.stringify({ invoice_id: 'INV-123' }), headers: {} }, deps);

    assert.equal(result.reason, 'payment_expired');
    assert.deepEqual(deps.state.paymentUpdates.at(-1).updates, { status: 'manual_review', reconciliation_status: 'manual_review' });
    assert.equal(deps.state.eventStatuses.at(-1).verificationResult, 'payment_expired');
    assert.equal(deps.state.transitionCalls.length, 0);
    assert.equal(deps.state.markOrderPaidCalls, 0);
  });

  it('rejects BayarGG provider transaction mismatch without manual review or fulfilment', async () => {
    const deps = buildBayarGgWebhookDeps({ eventOverrides: { providerTransactionId: 'INV-OTHER' } });

    const result = await processBayarGgWebhook({ rawBody: JSON.stringify({ invoice_id: 'INV-123' }), headers: {} }, deps);

    assert.equal(result.reason, 'provider_transaction_mismatch');
    assert.equal(deps.state.eventStatuses.at(-1).verificationResult, 'provider_transaction_mismatch');
    assert.equal(deps.state.paymentUpdates.length, 0);
    assert.equal(deps.state.transitionCalls.length, 0);
  });

  it('rejects BayarGG merchant reference mismatch without manual review or fulfilment', async () => {
    const deps = buildBayarGgWebhookDeps({ eventOverrides: { merchantReference: 'BAYARGG-ORDER-99-A1' } });

    const result = await processBayarGgWebhook({ rawBody: JSON.stringify({ invoice_id: 'INV-123' }), headers: {} }, deps);

    assert.equal(result.reason, 'reference_mismatch');
    assert.equal(deps.state.eventStatuses.at(-1).verificationResult, 'reference_mismatch');
    assert.equal(deps.state.paymentUpdates.length, 0);
    assert.equal(deps.state.transitionCalls.length, 0);
  });
});

function buildBayarGgWebhookDeps({ calls = [], verifyResult, existingEvent = null, paymentOverrides = {}, eventOverrides = {} } = {}) {
  const state = {
    createdEvents: [],
    eventStatuses: [],
    paymentUpdates: [],
    transitionCalls: [],
    markOrderPaidCalls: 0,
    auditLogs: [],
    securityEvents: [],
  };
  const payment = {
    id: 'pay-1',
    workspaceId: 'workspace-1',
    outletId: 'outlet-1',
    orderId: 'order-1',
    providerTransactionId: 'INV-123',
    merchantReference: 'BAYARGG-ORDER-1-A1',
    status: 'pending',
    amount: 50000,
    currency: 'IDR',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ...paymentOverrides,
  };
  const event = {
    providerEventId: 'REF-001',
    providerTransactionId: 'INV-123',
    merchantReference: 'BAYARGG-ORDER-1-A1',
    eventType: 'payment.paid',
    status: 'paid',
    amount: 50000,
    currency: 'IDR',
    paymentMethod: 'qris',
    paidAt: '2026-07-07T01:00:00.000Z',
    raw: { invoice_id: 'INV-123' },
    ...eventOverrides,
  };
  return {
    state,
    paymentsRepository: {
      async findByProviderTransactionId(invoiceId) {
        calls.push('find-payment');
        assert.equal(invoiceId, 'INV-123');
        return payment;
      },
      async updatePayment(args) {
        calls.push('update-payment');
        state.paymentUpdates.push(args);
        return { ...payment, ...args.updates };
      },
      async transitionStatus(args) {
        calls.push('transition-paid');
        state.transitionCalls.push(args);
        return { ...payment, status: args.newStatus, reconciliationStatus: args.updates.reconciliation_status };
      },
      async addEvent(args) {
        calls.push('add-payment-event');
        state.addedPaymentEvent = args;
      },
    },
    paymentEventsRepository: {
      async findByProviderEventId() {
        calls.push('find-event');
        return existingEvent;
      },
      async create(args) {
        calls.push('create-event');
        state.createdEvents.push(args);
        return { id: 'evt-1', ...args };
      },
      async updateReferences(args) {
        calls.push('update-event-refs');
        state.eventReferences = args;
      },
      async updateProcessingStatus(args) {
        calls.push(`event-status-${args.verificationResult || args.status}`);
        state.eventStatuses.push(args);
      },
    },
    async getPaymentRuntimeConfig() {
      calls.push('runtime-config');
      return { bayargg: { apiKey: 'mock-key' } };
    },
    async resolvePaymentProvider() {
      calls.push('resolve-provider');
      return {
        providerConfig: { apiKey: 'mock-key' },
        adapter: {
          async verifyWebhook() {
            calls.push('verify-webhook');
            return verifyResult || { valid: true, event };
          },
        },
      };
    },
    async markOrderPaidAwaitingAcceptance() {
      calls.push('mark-order-paid');
      state.markOrderPaidCalls += 1;
      return { id: 'order-1', workspaceId: 'workspace-1', outletId: 'outlet-1', metadata: {} };
    },
    notifyPaymentUpdatedRealtime() {
      calls.push('notify-payment');
    },
    notifyPaidOrderRealtime() {
      calls.push('notify-paid-order');
    },
    async notifyPaidOnce() {
      calls.push('notify-paid-once');
    },
    auditLogsRepository: {
      async log(entry) {
        calls.push(`audit-${entry.action}`);
        state.auditLogs.push(entry);
      },
    },
    async recordSecurityEvent(event) {
      calls.push(`security-${event.eventType}`);
      state.securityEvents.push(event);
    },
  };
}
