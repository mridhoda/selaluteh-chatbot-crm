import { AppError } from '../utils/errors.js';
import { getPaymentRuntimeConfig } from './settings.service.js';
import { paymentProviderSettingsRepository } from '../db/repositories/index.js';
import { loadPaymentAdapter, getPaymentAdapterCapabilities } from '../integrations/payments/payment-adapter-registry.js';
import { assertProviderCapability } from '../integrations/payments/provider-capabilities.js';
import { normalizeProviderCode } from '../integrations/payments/payment-provider.types.js';

export async function resolvePaymentProvider({ workspaceId, mode, provider, paymentMethod, capability = 'statusQuery' } = {}) {
  const runtimeConfig = await getPaymentRuntimeConfig({ workspaceId });
  const requestedProvider = normalizeProviderCode(provider || runtimeConfig.provider);
  const providerSettings = await paymentProviderSettingsRepository.findActiveProviderSettings({ workspaceId, mode: mode || runtimeConfig.environment }).catch(() => null);
  const activeProvider = normalizeProviderCode(providerSettings?.provider || requestedProvider);
  if (!activeProvider || activeProvider === 'manual') {
    return {
      provider: activeProvider || 'manual',
      adapter: null,
      runtimeConfig,
      providerConfig: null,
      capabilities: getPaymentAdapterCapabilities('manual'),
    };
  }

  const capabilities = getPaymentAdapterCapabilities(activeProvider);
  if (!capabilities) {
    throw new AppError('PAYMENT_PROVIDER_UNKNOWN', `Payment provider ${activeProvider} is not registered`, 400);
  }

  if (paymentMethod) {
    const methodCheck = assertProviderCapability(activeProvider, 'method', paymentMethod);
    if (!methodCheck.ok) {
      throw new AppError('PAYMENT_METHOD_NOT_SUPPORTED', `Payment method ${paymentMethod} is not supported by ${activeProvider}`, 400);
    }
  }

  if (capability && capability !== 'method') {
    const capabilityCheck = assertProviderCapability(activeProvider, capability);
    if (!capabilityCheck.ok && capability !== 'statusQuery') {
      throw new AppError('PAYMENT_PROVIDER_CAPABILITY_UNSUPPORTED', `${activeProvider} does not support ${capability}`, 400);
    }
  }

  const adapter = await loadPaymentAdapter(activeProvider);
  return {
    provider: activeProvider,
    adapter,
    runtimeConfig,
    providerConfig: runtimeConfig[activeProvider] || providerSettings || null,
    providerSettings,
    capabilities,
  };
}

export async function resolvePaymentAdapter(provider) {
  const adapter = await loadPaymentAdapter(provider);
  return {
    provider: normalizeProviderCode(provider),
    adapter,
    capabilities: getPaymentAdapterCapabilities(provider),
  };
}
