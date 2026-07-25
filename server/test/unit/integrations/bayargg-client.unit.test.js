import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

const bayargg = await import('../../../src/integrations/payments/bayargg-client.js');

describe('bayargg payment adapter', () => {
  it('normalizes create payment response', () => {
    const result = bayargg.normalizeCreatePaymentResponse({
      data: {
        invoice_id: 'INV-456',
        payment_url: 'https://www.bayar.gg/pay?invoice=INV-456',
        expires_at: '2026-07-02T02:00:00Z',
        status: 'pending',
        payment_method: 'qris_bayar_gg',
        final_amount: '99000',
      },
    }, { referenceId: 'SLT123PAY01', amount: 99000, currency: 'IDR' });

    assert.equal(result.provider, 'bayargg');
    assert.equal(result.providerSessionId, 'INV-456');
    assert.equal(result.providerTransactionId, 'INV-456');
    assert.equal(result.merchantReference, 'SLT123PAY01');
    assert.equal(result.status, 'pending');
    assert.equal(result.amount, 99000);
    assert.equal(result.paymentUrl, 'https://www.bayar.gg/pay?invoice=INV-456');
    assert.equal(result.paymentMethod, 'qris_bayar_gg');
  });

  it('sends HTTPS redirect and callback URLs when creating a payment', async () => {
    const originalFetch = global.fetch;
    let requestBody;
    global.fetch = async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        text: async () => JSON.stringify({
          success: true,
          data: { invoice_id: 'INV-REDIRECT', status: 'pending', payment_url: 'https://www.bayar.gg/pay?invoice=INV-REDIRECT' },
        }),
      };
    };

    try {
      await bayargg.createPaymentSession({
        referenceId: 'REF-REDIRECT',
        orderId: 'order-redirect',
        amount: 50000,
        currency: 'IDR',
        successReturnUrl: 'https://app.example.com/store/payment/pending/pay-1',
        callbackUrl: 'https://api.example.com/webhook/bayargg',
      }, { apiKey: 'test-key', checkoutUrl: 'https://www.bayar.gg/pay', paymentMethod: 'qris' });
    } finally {
      global.fetch = originalFetch;
    }

    assert.equal(requestBody.payment_url, 'https://www.bayar.gg/pay');
    assert.equal(requestBody.redirect_url, 'https://app.example.com/store/payment/pending/pay-1');
    assert.equal(requestBody.callback_url, 'https://api.example.com/webhook/bayargg');
  });

  it('normalizes check payment paid response', () => {
    const result = bayargg.normalizeCreatePaymentResponse({
      data: {
        invoice_id: 'INV-789',
        status: 'paid',
        final_amount: 150000,
        payment_method: 'ovo',
      },
    }, { referenceId: 'INV-789' });

    assert.equal(result.status, 'paid');
    assert.equal(result.amount, 150000);
    assert.equal(result.paymentMethod, 'ovo');
  });

  it('normalizes webhook event payload', () => {
    const event = bayargg.normalizeWebhookEvent({
      invoice_id: 'INV-123',
      status: 'paid',
      final_amount: 50000,
      payment_method: 'qris',
      paid_via: 'qris',
      paid_at: '2026-07-02 15:33:00',
      paid_reff_num: 'REF-001',
    });

    assert.equal(event.providerTransactionId, 'INV-123');
    assert.equal(event.status, 'paid');
    assert.equal(event.amount, 50000);
    assert.equal(event.paymentMethod, 'qris');
    assert.equal(event.providerEventId, 'REF-001');
  });

  it('verifyWebhook returns invalid when api key missing', async () => {
    const result = await bayargg.verifyWebhook(
      JSON.stringify({ invoice_id: 'INV-1' }),
      {},
      {},
    );
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'missing_api_key');
  });

  it('verifyWebhook returns invalid when invoice_id missing', async () => {
    const result = await bayargg.verifyWebhook(
      JSON.stringify({ status: 'paid' }),
      {},
      { apiKey: 'test-key' },
    );
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'missing_invoice_id');
  });

  it('verifyWebhook calls check-payment and returns valid=true when paid', async () => {
    // Mock global fetch untuk check-payment
    const originalFetch = global.fetch;
    global.fetch = async (url) => {
      if (String(url).includes('check-payment')) {
        return {
          ok: true,
          text: async () => JSON.stringify({
            success: true,
            data: { invoice_id: 'INV-123', status: 'paid', final_amount: 50000, payment_method: 'qris' },
          }),
        };
      }
      throw new Error('Unexpected fetch: ' + url);
    };

    try {
      const result = await bayargg.verifyWebhook(
        JSON.stringify({ invoice_id: 'INV-123', status: 'paid', final_amount: 50000 }),
        {},
        { apiKey: 'test-key', apiBaseUrl: 'https://www.bayar.gg/api' },
      );
      assert.equal(result.valid, true);
      assert.equal(result.event.status, 'paid');
      assert.equal(result.event.providerTransactionId, 'INV-123');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('verifyWebhook returns invalid when check-payment fails', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => { throw new Error('network error'); };
    try {
      const result = await bayargg.verifyWebhook(
        JSON.stringify({ invoice_id: 'INV-ERR' }),
        {},
        { apiKey: 'test-key' },
      );
      assert.equal(result.valid, false);
      assert.ok(result.reason.startsWith('check_payment_failed'));
    } finally {
      global.fetch = originalFetch;
    }
  });
});
