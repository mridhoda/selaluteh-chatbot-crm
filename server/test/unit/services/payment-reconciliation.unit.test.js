import { describe, it } from 'node:test';
import assert from 'node:assert';
import { determineReconciliationStatus, reconcilePendingProviderPayment } from '../../../src/services/payment-reconciliation.service.js';

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

  it('reconciles a missing paid webhook through provider status query without duplicate paid notification', async () => {
    const payment = {
      id: 'payment-1',
      workspaceId: 'workspace-1',
      outletId: 'outlet-1',
      orderId: 'order-1',
      status: 'pending',
      provider: 'bayargg',
      providerTransactionId: 'invoice-1',
      amount: 12000,
      currency: 'IDR',
      reconciliationStatus: 'pending',
    };
    let currentPayment = { ...payment };
    let paidNotifications = 0;
    let statusMessages = 0;
    const deps = {
      paymentsRepository: {
        findById: async () => currentPayment,
        transitionStatus: async ({ fromStatuses, newStatus, updates }) => {
          assert.deepStrictEqual(fromStatuses, ['pending', 'processing']);
          assert.ok(updates.paid_at);
          currentPayment = { ...currentPayment, status: newStatus, paidAt: '2026-07-07T08:00:00.000Z' };
          return currentPayment;
        },
        addEvent: async ({ event }) => {
          assert.strictEqual(event.status, 'paid');
          return { id: 'event-1' };
        },
        updatePayment: async ({ updates }) => {
          currentPayment = { ...currentPayment, reconciliationStatus: updates.reconciliation_status };
          return currentPayment;
        },
      },
      ordersRepository: {
        workspaceFindById: async () => ({ id: 'order-1', outletId: 'outlet-1', paymentStatus: 'paid', totals: { total: 12000 }, orderNumber: 'ORD-1' }),
        updateOne: async () => ({ id: 'order-1', outletId: 'outlet-1', paymentStatus: 'paid', totals: { total: 12000 }, orderNumber: 'ORD-1' }),
      },
      resolvePaymentProvider: async () => ({
        provider: 'bayargg',
        capabilities: { supportsStatusQuery: true },
        providerConfig: { apiKey: 'test-key' },
        adapter: {
          getPayment: async (providerTransactionId, providerConfig) => {
            assert.strictEqual(providerTransactionId, 'invoice-1');
            assert.deepStrictEqual(providerConfig, { apiKey: 'test-key' });
            return { status: 'paid', amount: 12000, currency: 'IDR', providerTransactionId: 'invoice-1' };
          },
        },
      }),
      notifyPaymentUpdatedRealtime: () => {},
      notifyPaidOrderRealtime: () => { paidNotifications += 1; },
      sendOrderStatusMessage: async () => { statusMessages += 1; },
      getSupabaseServiceClient: () => ({ from: () => ({ insert: async () => ({ data: null, error: null }) }) }),
    };

    const result = await reconcilePendingProviderPayment({ workspaceId: 'workspace-1', paymentId: 'payment-1' }, deps);

    assert.strictEqual(result.reconciled, true);
    assert.strictEqual(result.providerStatus, 'paid');
    assert.strictEqual(result.payment.status, 'paid');
    assert.strictEqual(result.payment.reconciliationStatus, 'matched');
    assert.strictEqual(paidNotifications, 0);
    assert.strictEqual(statusMessages, 0);
  });
});
