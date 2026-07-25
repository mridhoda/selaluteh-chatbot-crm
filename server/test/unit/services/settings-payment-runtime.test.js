import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPaymentRuntimeConfig } from '../../../src/services/settings.service.js';
import { workspacesSupabaseRepository, paymentProviderSettingsRepository } from '../../../src/db/repositories/index.js';

describe('payment runtime configuration', () => {
  it('prefers the workspace Settings provider over a legacy active provider record', async (t) => {
    t.mock.method(workspacesSupabaseRepository, 'getSettings', async () => ({
      metadata: { app_settings: { provider: 'duitku', environment: 'sandbox', duitku_merchant_code: 'M123', duitku_api_key: 'key' } },
    }));
    t.mock.method(paymentProviderSettingsRepository, 'findActiveByWorkspace', async () => ({ provider: 'bayargg', mode: 'production' }));
    const runtime = await getPaymentRuntimeConfig({ workspaceId: 'workspace-1' });
    assert.equal(runtime.provider, 'duitku');
    assert.equal(runtime.environment, 'sandbox');
    assert.equal(runtime.configured, true);
  });
});
