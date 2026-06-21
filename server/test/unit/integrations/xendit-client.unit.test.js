import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN = 'test-callback-token';
process.env.XENDIT_MODE = 'test';

const xendit = await import('../../../src/integrations/payments/xendit-client.js');

describe('xendit payment session adapter', () => {
  it('maps SelaluTeh payment session input to Xendit PAY payment link payload', () => {
    const payload = xendit.buildPaymentSessionPayload({
      referenceId: 'SLT_SMD_ORD000124_PAY01',
      orderId: 'order-1',
      amount: 111000,
      currency: 'IDR',
      customer: { referenceId: 'cust-1', name: 'Customer Test', phone: '+6281234567890' },
      successReturnUrl: 'https://app.example/payments/return/success',
      cancelReturnUrl: 'https://app.example/payments/return/cancel',
      metadata: { workspace_id: 'workspace-id' },
    });

    assert.equal(payload.session_type, 'PAY');
    assert.equal(payload.mode, 'PAYMENT_LINK');
    assert.equal(payload.amount, 111000);
    assert.equal(payload.currency, 'IDR');
    assert.equal(payload.country, 'ID');
    assert.equal(payload.capture_method, 'AUTOMATIC');
    assert.equal(payload.allow_save_payment_method, 'DISABLED');
    assert.equal(payload.customer.type, 'INDIVIDUAL');
    assert.equal(payload.metadata.workspace_id, 'workspace-id');
  });

  it('maps Xendit session statuses to internal payment statuses', () => {
    assert.equal(xendit.mapSessionStatus('ACTIVE'), 'pending');
    assert.equal(xendit.mapSessionStatus('COMPLETED'), 'paid');
    assert.equal(xendit.mapSessionStatus('EXPIRED'), 'expired');
    assert.equal(xendit.mapSessionStatus('CANCELED'), 'cancelled');
  });

  it('verifies webhook callback token and normalizes payment session event', async () => {
    const payload = {
      event: 'payment_session.completed',
      business_id: 'biz-1',
      created: '2026-12-31T23:59:59Z',
      data: {
        payment_session_id: 'ps-661f87c614802d6c402cd82d',
        reference_id: 'SLT_SMD_ORD000124_PAY01',
        status: 'COMPLETED',
        amount: '111000',
        currency: 'IDR',
        payment_link_url: 'https://dev.xen.to/test',
        payment_request_id: 'pr-1',
        payment_id: 'py-1',
      },
    };

    const result = await xendit.verifyWebhook(JSON.stringify(payload), { 'x-callback-token': 'test-callback-token' });
    assert.equal(result.valid, true);
    assert.equal(result.event.eventType, 'payment_session.completed');
    assert.equal(result.event.status, 'paid');
    assert.equal(result.event.providerSessionId, 'ps-661f87c614802d6c402cd82d');
    assert.equal(result.event.merchantReference, 'SLT_SMD_ORD000124_PAY01');
    assert.equal(result.event.amount, 111000);
  });

  it('rejects invalid webhook callback token', async () => {
    const result = await xendit.verifyWebhook('{}', { 'x-callback-token': 'wrong-token' });
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'invalid_callback_token');
  });
});
