import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { paymentsRepository, ordersRepository } from '../../../src/db/repositories/index.js';
import paymentRouter, { paymentRouteInternals } from '../../../src/routes/payments.js';

function createApp() {
  const app = express();
  app.use('/payments', paymentRouter);
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.code || error.message }));
  return app;
}

async function request(app, path) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, { redirect: 'manual' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

describe('Payment return route', () => {
  it('syncs a pending provider payment before deciding the return state', async () => {
    let syncArgs;
    const result = await paymentRouteInternals.resolvePaymentReturnState({
      payment: { id: 'pay-pending', workspaceId: 'workspace-1', status: 'pending' },
      isSuccess: true,
      sync: async (args) => {
        syncArgs = args;
        return { id: 'pay-pending', status: 'paid' };
      },
    });

    assert.deepEqual(syncArgs, { workspaceId: 'workspace-1', paymentId: 'pay-pending' });
    assert.equal(result.status, 'paid');
  });

  it('redirects the browser to the public payment page using a merchant reference', async (t) => {
    t.mock.method(paymentsRepository, 'findByMerchantReferenceGlobal', async () => ({ id: 'pay-1', workspaceId: 'workspace-1', orderId: 'order-1', status: 'paid' }));
    t.mock.method(ordersRepository, 'workspaceFindById', async () => ({ publicOrderToken: 'po-1', metadata: { publicStorefrontSlug: 'selalu-teh' } }));
    const response = await request(createApp(), '/payments/return/success?merchantReference=REF-1');

    assert.equal(response.status, 303);
    const location = new URL(response.headers.get('location'));
    assert.equal(location.origin, 'https://app-dev.incretlabs.my.id');
    assert.equal(location.pathname, '/store/selalu-teh');
    assert.equal(location.searchParams.get('paymentReturn'), 'success');
    assert.equal(location.searchParams.get('orderToken'), 'po-1');
  });

  it('uses provider invoice lookup when merchant reference is absent', async (t) => {
    t.mock.method(paymentsRepository, 'findByProviderTransactionId', async () => ({ id: 'pay-2', workspaceId: 'workspace-1', orderId: 'order-2', status: 'paid' }));
    t.mock.method(ordersRepository, 'workspaceFindById', async () => ({ publicOrderToken: 'po-2', metadata: { publicStorefrontSlug: 'store-2' } }));
    const response = await request(createApp(), '/payments/return/success?invoice_id=INV-2');

    assert.equal(response.status, 303);
    const location = new URL(response.headers.get('location'));
    assert.equal(location.pathname, '/store/store-2');
    assert.equal(location.searchParams.get('paymentReturn'), 'success');
    assert.equal(location.searchParams.get('orderToken'), 'po-2');
  });

  it('uses Duitku merchantOrderId and never syncs its browser return', async (t) => {
    t.mock.method(paymentsRepository, 'findByMerchantReferenceGlobal', async (reference) => ({ id: 'pay-3', workspaceId: 'workspace-1', orderId: 'order-3', provider: 'duitku', merchantReference: reference, status: 'pending' }));
    t.mock.method(ordersRepository, 'workspaceFindById', async () => ({ publicOrderToken: 'po-3', metadata: { publicStorefrontSlug: 'store-3' } }));
    const response = await request(createApp(), '/payments/return/success?merchantOrderId=DK-REF&reference=DK-1');

    assert.equal(response.status, 303);
    const location = new URL(response.headers.get('location'));
    assert.equal(location.pathname, '/store/store-3');
    assert.equal(location.searchParams.get('paymentReturn'), 'pending');
  });

  it('does not sync a pending Duitku payment from its browser return', async () => {
    let synced = false;
    const payment = await paymentRouteInternals.resolvePaymentReturnState({
      payment: { id: 'pay-4', workspaceId: 'workspace-1', provider: 'duitku', status: 'pending' },
      isSuccess: true,
      sync: async () => { synced = true; },
    });
    assert.equal(synced, false);
    assert.equal(payment.status, 'pending');
  });
});
