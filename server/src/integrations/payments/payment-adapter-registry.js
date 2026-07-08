import { AppError } from '../../utils/errors.js';
import { assertPaymentAdapterContract, normalizeProviderCode } from './payment-provider.types.js';
import { getProviderCapabilities } from './provider-capabilities.js';

const ADAPTER_LOADERS = Object.freeze({
  bayargg: () => import('./bayargg-client.js'),
  doku: () => import('./doku-client.js'),
  xendit: () => import('./xendit-client.js'),
  midtrans: () => import('./midtrans-client.js'),
});

export function listRegisteredPaymentProviders() {
  return Object.keys(ADAPTER_LOADERS);
}

export async function loadPaymentAdapter(provider) {
  const code = normalizeProviderCode(provider);
  const loader = ADAPTER_LOADERS[code];
  if (!loader) {
    throw new AppError('PAYMENT_PROVIDER_UNKNOWN', `Unknown or disabled payment provider: ${provider}`, 400);
  }
  const adapter = await loader();
  return assertPaymentAdapterContract(adapter, code);
}

export function getPaymentAdapterCapabilities(provider) {
  return getProviderCapabilities(provider);
}
