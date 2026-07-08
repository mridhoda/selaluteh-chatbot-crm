import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { paymentProviderSettingsRepositoryInternals } from '../../../src/db/repositories/payment-provider-settings.supabase.repository.js';

describe('payment provider settings repository', () => {
  it('redacts normalized provider secret ciphertext fields', () => {
    const row = paymentProviderSettingsRepositoryInternals.redactProviderSettings({
      id: 'settings-1',
      workspace_id: 'workspace-1',
      provider_code: 'bayargg',
      is_active: true,
      mode: 'sandbox',
      public_key: 'public-value',
      secret_key_ciphertext: 'enc:secret',
      webhook_secret_ciphertext: 'enc:webhook',
      credential_fingerprint: 'fingerprint',
      config_json: { payment_method: 'qris' },
    });

    assert.equal(row.providerCode, 'bayargg');
    assert.equal(row.secretKeyCiphertext, undefined);
    assert.equal(row.webhookSecretCiphertext, undefined);
    assert.equal(row.secretKeyConfigured, true);
    assert.equal(row.webhookSecretConfigured, true);
    assert.equal(row.publicKey, 'public-value');
  });

  it('keeps provider mode in redacted settings for mode-specific runtime selection', () => {
    const row = paymentProviderSettingsRepositoryInternals.redactProviderSettings({
      workspace_id: 'workspace-1',
      provider_code: 'bayargg',
      is_active: true,
      mode: 'production',
      secret_key_ciphertext: null,
      webhook_secret_ciphertext: null,
    });

    assert.equal(row.mode, 'production');
    assert.equal(row.providerCode, 'bayargg');
  });
});
