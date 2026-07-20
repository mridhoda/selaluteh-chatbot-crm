import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { paymentsRepository, ordersRepository } from '../../../src/db/repositories/index.js';
import paymentRouter from '../../../src/routes/payments.js';

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

describe('Bayar.gg payment return route', () => {
  it('redirects the browser to the public payment page using a merchant reference', async (t) => {
    t.mock.method(paymentsRepository, 'findByMerchantReferenceGlobal', async () => ({ id: 'pay-1', workspaceId: 'workspace-1', orderId: 'order-1' }));
    t.mock.method(ordersRepository, 'workspaceFindById', async () => ({ publicOrderToken: 'po-1', metadata: { publicStorefrontSlug: 'selalu-teh' } }));
    const response = await request(createApp(), '/payments/return/success?merchantReference=REF-1');

    assert.equal(response.status, 303);
    const location = new URL(response.headers.get('location'));
    assert.equal(location.origin, 'https://app-dev.incretlabs.my.id');
    assert.equal(location.pathname, '/store/payment/pending/pay-1');
    assert.equal(location.searchParams.get('publicOrderToken'), 'po-1');
    assert.equal(location.searchParams.get('storefrontSlug'), 'selalu-teh');
  });

  it('uses provider invoice lookup when merchant reference is absent', async (t) => {
    t.mock.method(paymentsRepository, 'findByProviderTransactionId', async () => ({ id: 'pay-2', workspaceId: 'workspace-1', orderId: 'order-2' }));
    t.mock.method(ordersRepository, 'workspaceFindById', async () => ({ publicOrderToken: 'po-2', metadata: { publicStorefrontSlug: 'store-2' } }));
    const response = await request(createApp(), '/payments/return/success?invoice_id=INV-2');

    assert.equal(response.status, 303);
    assert.match(response.headers.get('location'), /payment\/pending\/pay-2/);
  });
});
