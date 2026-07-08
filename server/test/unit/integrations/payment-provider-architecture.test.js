import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PAYMENT_PROVIDER_CODES,
  normalizeProviderCode,
  normalizeProviderStatus,
  assertPaymentAdapterContract,
} from '../../../src/integrations/payments/payment-provider.types.js';
import {
  getProviderCapabilities,
  assertProviderCapability,
} from '../../../src/integrations/payments/provider-capabilities.js';
import {
  listRegisteredPaymentProviders,
  loadPaymentAdapter,
  getPaymentAdapterCapabilities,
} from '../../../src/integrations/payments/payment-adapter-registry.js';

describe('Phase 3.6.3 external provider architecture', () => {
  it('normalizes provider codes and provider statuses', () => {
    assert.equal(normalizeProviderCode(' BayarGG '), 'bayargg');
    assert.equal(normalizeProviderStatus('PAID'), 'paid');
    assert.equal(normalizeProviderStatus('COMPLETED'), 'paid');
    assert.equal(normalizeProviderStatus('PENDING'), 'pending');
    assert.equal(normalizeProviderStatus('EXPIRED'), 'expired');
    assert.equal(normalizeProviderStatus('CANCELED'), 'cancelled');
    assert.equal(normalizeProviderStatus('DENY'), 'failed');
  });

  it('defines provider capability matrix for active and future providers', () => {
    const bayargg = getProviderCapabilities(PAYMENT_PROVIDER_CODES.BAYARGG);
    const xendit = getProviderCapabilities(PAYMENT_PROVIDER_CODES.XENDIT);
    const manual = getProviderCapabilities(PAYMENT_PROVIDER_CODES.MANUAL);

    assert.equal(bayargg.supportsWebhook, true);
    assert.equal(bayargg.supportsRefund, false);
    assert.equal(xendit.supportsRefund, true);
    assert.equal(manual.supportsWebhook, false);
  });

  it('checks provider payment method capabilities', () => {
    assert.deepEqual(assertProviderCapability('bayargg', 'method', 'qris'), { ok: true, reason: null });
    assert.deepEqual(assertProviderCapability('bayargg', 'method', 'card'), { ok: false, reason: 'PAYMENT_METHOD_NOT_SUPPORTED' });
    assert.deepEqual(assertProviderCapability('manual', 'webhook'), { ok: false, reason: 'PROVIDER_CAPABILITY_NOT_SUPPORTED' });
  });

  it('loads registered adapters through registry and wraps optional methods safely', async () => {
    const registered = listRegisteredPaymentProviders();
    assert.ok(registered.includes('bayargg'));
    assert.ok(registered.includes('xendit'));
    assert.ok(registered.includes('doku'));
    assert.ok(registered.includes('midtrans'));

    const midtrans = await loadPaymentAdapter('midtrans');
    assert.equal(typeof midtrans.createPayment, 'function');
    assert.equal(typeof midtrans.createPaymentSession, 'function');
    assert.equal(typeof midtrans.getPaymentSession, 'function');
    assert.equal(typeof midtrans.refundPayment, 'function');
    assert.equal(getPaymentAdapterCapabilities('midtrans').supportsWebhook, true);
  });

  it('asserts minimum adapter contract', () => {
    assert.throws(
      () => assertPaymentAdapterContract({ createPayment() {}, getPayment() {} }, 'broken'),
      /verifyWebhook\(\)/,
    );

    const adapter = assertPaymentAdapterContract({
      createPayment() {},
      verifyWebhook() {},
      getPayment() {},
    }, 'fake');
    assert.equal(typeof adapter.createPaymentSession, 'function');
    assert.equal(typeof adapter.getPaymentSession, 'function');
  });
});
