import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDuitkuInvoicePayload,
  buildDuitkuRequestSignature,
  buildDuitkuWebhookSignature,
  normalizeDuitkuInvoiceResponse,
  verifyWebhook,
} from '../../../src/integrations/payments/duitku-client.js';

const config = { merchantCode: 'M123', apiKey: 'secret', environment: 'sandbox', paymentTtlMinutes: 15 };

describe('Duitku POP adapter', () => {
  it('signs requests and builds authoritative invoice payloads', () => {
    assert.equal(buildDuitkuRequestSignature({ merchantCode: 'M123', timestamp: '123', apiKey: 'secret' }), 'cebb54d473a4471b84516cf6acc29db53ab4b94a9bd6d25be826b77acca357e6');
    const payload = buildDuitkuInvoicePayload({
      referenceId: 'SLTORDERPAY01', amount: 25000, orderNumber: 'ORDER-1', customer: { name: 'Ada Lovelace', phone: '08123' },
      items: [{ productNameSnapshot: 'Tea', quantity: 2, unitPrice: 12500 }], callbackUrl: 'https://api.example.com/webhook/duitku', returnUrl: 'https://api.example.com/payments/return/success',
    }, config);
    assert.equal(payload.paymentAmount, 25000);
    assert.equal(payload.merchantOrderId, 'SLTORDERPAY01');
    assert.deepEqual(payload.itemDetails, [{ name: 'Tea', price: 12500, quantity: 2 }]);
    assert.equal(payload.expiryPeriod, 15);
  });

  it('falls back to one line item and accepts only valid hosted responses', () => {
    const payload = buildDuitkuInvoicePayload({ referenceId: 'REF', amount: 20000, items: [{ name: 'Wrong', quantity: 1, unitPrice: 10000 }] }, config);
    assert.deepEqual(payload.itemDetails, [{ name: 'Order REF', price: 20000, quantity: 1 }]);
    const response = normalizeDuitkuInvoiceResponse({ statusCode: '00', reference: 'DK-1', paymentUrl: 'https://app-sandbox.duitku.com/pay/DK-1' }, { referenceId: 'REF', amount: 20000 });
    assert.equal(response.providerTransactionId, 'DK-1');
    assert.throws(() => normalizeDuitkuInvoiceResponse({ statusCode: '00', reference: 'DK-1', paymentUrl: 'http://unsafe.example' }, { referenceId: 'REF', amount: 20000 }));
  });

  it('uses the configured environment endpoint and signed JSON request', async (t) => {
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ statusCode: '00', reference: 'DK-1', paymentUrl: 'https://app-sandbox.duitku.com/pay/DK-1' }), { status: 200 });
    });
    const { createPaymentSession } = await import('../../../src/integrations/payments/duitku-client.js');
    await createPaymentSession({ referenceId: 'REF', amount: 20000, callbackUrl: 'https://api.example.com/webhook/duitku', returnUrl: 'https://api.example.com/payments/return/success' }, config);
    assert.equal(calls[0].url, 'https://api-sandbox.duitku.com/api/merchant/createInvoice');
    assert.equal(calls[0].options.headers['x-duitku-merchantcode'], 'M123');
    assert.match(calls[0].options.headers['x-duitku-signature'], /^[a-f0-9]{64}$/);
    assert.equal(JSON.parse(calls[0].options.body).paymentAmount, 20000);
  });

  it('verifies form callbacks and maps successful or failed results', async () => {
    const base = { merchantCode: 'M123', amount: '25000', merchantOrderId: 'REF-1', reference: 'DK-1' };
    const signature = buildDuitkuWebhookSignature({ ...base, apiKey: 'secret' });
    const paid = await verifyWebhook(new URLSearchParams({ ...base, resultCode: '00', signature }).toString(), {}, config);
    assert.equal(paid.valid, true);
    assert.equal(paid.event.status, 'paid');
    const failed = await verifyWebhook(new URLSearchParams({ ...base, resultCode: '01', signature }).toString(), {}, config);
    assert.equal(failed.event.status, 'failed');
    const invalid = await verifyWebhook(new URLSearchParams({ ...base, resultCode: '00', signature: 'bad' }).toString(), {}, config);
    assert.equal(invalid.valid, false);
  });
});
