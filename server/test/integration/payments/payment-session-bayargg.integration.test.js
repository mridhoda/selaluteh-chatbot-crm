import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPaymentSessionForOrder } from '../../../src/services/payment.service.js';

describe('BayarGG payment session contract', () => {
  it('uses backend authoritative amount/currency/reference and returns customer-safe response', async () => {
    const adapterCalls = [];
    const createdPayments = [];
    const order = {
      id: 'order-1',
      workspaceId: 'workspace-1',
      outletId: 'outlet-1',
      orderNumber: 'SLT-0001',
      publicOrderToken: 'po_test-123',
      metadata: { publicStorefrontSlug: 'selalu-teh' },
      paymentStatus: 'unpaid',
      totals: { total: 75000, currency: 'IDR' },
      items: [{ name: 'Tea', quantity: 1, subtotal: 75000 }],
    };

    const response = await createPaymentSessionForOrder({
      workspaceId: 'workspace-1',
      orderId: 'order-1',
      customer: { name: 'Customer', phone: '62812' },
      idempotencyKey: 'idem-1',
      provider: 'bayargg',
    }, {
      ordersRepository: {
        async workspaceFindById(args) {
          assert.deepEqual(args, { workspaceId: 'workspace-1', orderId: 'order-1' });
          return order;
        },
        async updateOne(args) {
          assert.deepEqual(args.updates, { payment_status: 'pending' });
          return { ...order, paymentStatus: 'pending' };
        },
      },
      paymentsRepository: {
        async findByIdempotencyKey() {
          return null;
        },
        async findReusableAttempt() {
          return null;
        },
        async count() {
          return 0;
        },
        async create(payment) {
          createdPayments.push(payment);
          return { id: 'pay-1', ...payment };
        },
      },
      async resolvePaymentProvider() {
        return {
          provider: 'bayargg',
          runtimeConfig: {
            configured: true,
            environment: 'test',
            bayargg: { paymentMethod: 'qris' },
          },
          providerConfig: { apiKey: 'mock-key' },
          adapter: {
            async createPaymentSession(input, config) {
              adapterCalls.push({ input, config });
              return {
                providerTransactionId: 'INV-123',
                providerSessionId: 'INV-123',
                status: 'pending',
                amount: input.amount,
                currency: input.currency,
                paymentUrl: 'https://www.bayar.gg/pay?invoice=INV-123',
                paymentMethod: 'qris',
                expiresAt: '2026-07-08T01:00:00.000Z',
                rawProviderResponse: { secret_token: 'must-not-be-public', nested: { api_key: 'hidden' } },
              };
            },
          },
        };
      },
      notifyPaymentUpdatedRealtime() {},
      notifyOrderUpdatedRealtime() {},
      auditLogsRepository: {
        async log(entry) {
          createdPayments.auditEntry = entry;
        },
      },
    });

    assert.equal(adapterCalls.length, 1);
    assert.equal(adapterCalls[0].input.amount, 75000);
    assert.equal(adapterCalls[0].input.currency, 'IDR');
    assert.equal(adapterCalls[0].input.referenceId, 'SLTSLT0001PAY01');
    assert.equal(adapterCalls[0].input.orderId, 'order-1');
    assert.equal(adapterCalls[0].input.callbackUrl.endsWith('/webhook/bayargg'), true);
    assert.match(adapterCalls[0].input.successReturnUrl, /\/payments\/return\/success\?/);
    assert.match(adapterCalls[0].input.successReturnUrl, /merchantReference=SLTSLT0001PAY01/);
    assert.match(adapterCalls[0].input.successReturnUrl, /publicOrderToken=/);

    assert.equal(createdPayments.length, 1);
    assert.equal(createdPayments[0].amount, 75000);
    assert.equal(createdPayments[0].currency, 'IDR');
    assert.equal(createdPayments[0].merchantReference, adapterCalls[0].input.referenceId);
    assert.deepEqual(createdPayments[0].metadata.raw_provider_response, { secret_token: 'must-not-be-public', nested: { api_key: 'hidden' } });

    assert.deepEqual(response, {
      paymentId: 'pay-1',
      orderId: 'order-1',
      provider: 'bayargg',
      environment: 'test',
      status: 'pending',
      amount: 75000,
      currency: 'IDR',
      paymentUrl: 'https://www.bayar.gg/pay?invoice=INV-123',
      paymentLink: 'https://www.bayar.gg/pay?invoice=INV-123',
      paymentLinkUrl: 'https://www.bayar.gg/pay?invoice=INV-123',
      expiresAt: '2026-07-08T01:00:00.000Z',
      attemptNumber: 1,
      referenceId: adapterCalls[0].input.referenceId,
    });
    assert.equal(Object.hasOwn(response, 'rawProviderResponse'), false);
    assert.equal(Object.hasOwn(response, 'metadata'), false);
    assert.equal(createdPayments.auditEntry.action, 'payment.created');
    assert.equal(createdPayments.auditEntry.resourceType, 'payment');
    assert.equal(createdPayments.auditEntry.resourceId, 'pay-1');
    assert.deepEqual(createdPayments.auditEntry.details, {
      orderId: 'order-1',
      provider: 'bayargg',
      status: 'pending',
      amount: 75000,
      currency: 'IDR',
    });
  });

  it('requires active BayarGG provider to have configured settings', async () => {
    await assert.rejects(
      () => createPaymentSessionForOrder({ workspaceId: 'workspace-1', orderId: 'order-1', provider: 'bayargg' }, {
        async resolvePaymentProvider() {
          return {
            provider: 'bayargg',
            runtimeConfig: { configured: false, bayargg: {} },
            providerConfig: null,
          };
        },
      }),
      (err) => err.code === 'PAYMENT_PROVIDER_NOT_CONFIGURED' && err.status === 409,
    );
  });
});
