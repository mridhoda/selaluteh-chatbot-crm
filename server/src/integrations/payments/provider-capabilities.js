import { PAYMENT_METHODS, PAYMENT_PROVIDER_CODES, normalizeProviderCode } from './payment-provider.types.js';

export const PAYMENT_PROVIDER_CAPABILITIES = Object.freeze({
  [PAYMENT_PROVIDER_CODES.BAYARGG]: Object.freeze({
    code: PAYMENT_PROVIDER_CODES.BAYARGG,
    methods: [PAYMENT_METHODS.QRIS, PAYMENT_METHODS.VIRTUAL_ACCOUNT, PAYMENT_METHODS.EWALLET, PAYMENT_METHODS.LINK_PAYMENT],
    supportsWebhook: true,
    supportsRefund: false,
    supportsCancel: false,
    supportsStatusQuery: true,
  }),
  [PAYMENT_PROVIDER_CODES.DOKU]: Object.freeze({
    code: PAYMENT_PROVIDER_CODES.DOKU,
    methods: [PAYMENT_METHODS.QRIS, PAYMENT_METHODS.VIRTUAL_ACCOUNT, PAYMENT_METHODS.EWALLET, PAYMENT_METHODS.CARD, PAYMENT_METHODS.LINK_PAYMENT],
    supportsWebhook: true,
    supportsRefund: true,
    supportsCancel: false,
    supportsStatusQuery: false,
  }),
  [PAYMENT_PROVIDER_CODES.XENDIT]: Object.freeze({
    code: PAYMENT_PROVIDER_CODES.XENDIT,
    methods: [PAYMENT_METHODS.QRIS, PAYMENT_METHODS.VIRTUAL_ACCOUNT, PAYMENT_METHODS.EWALLET, PAYMENT_METHODS.CARD, PAYMENT_METHODS.LINK_PAYMENT],
    supportsWebhook: true,
    supportsRefund: true,
    supportsCancel: false,
    supportsStatusQuery: true,
  }),
  [PAYMENT_PROVIDER_CODES.MIDTRANS]: Object.freeze({
    code: PAYMENT_PROVIDER_CODES.MIDTRANS,
    methods: [PAYMENT_METHODS.QRIS, PAYMENT_METHODS.VIRTUAL_ACCOUNT, PAYMENT_METHODS.EWALLET, PAYMENT_METHODS.CARD, PAYMENT_METHODS.LINK_PAYMENT],
    supportsWebhook: true,
    supportsRefund: true,
    supportsCancel: true,
    supportsStatusQuery: true,
  }),
  [PAYMENT_PROVIDER_CODES.MANUAL]: Object.freeze({
    code: PAYMENT_PROVIDER_CODES.MANUAL,
    methods: [PAYMENT_METHODS.MANUAL_TRANSFER],
    supportsWebhook: false,
    supportsRefund: false,
    supportsCancel: false,
    supportsStatusQuery: false,
  }),
});

export function getProviderCapabilities(provider) {
  return PAYMENT_PROVIDER_CAPABILITIES[normalizeProviderCode(provider)] || null;
}

export function assertProviderCapability(provider, capability, method) {
  const capabilities = getProviderCapabilities(provider);
  if (!capabilities) return { ok: false, reason: 'UNKNOWN_PROVIDER' };
  if (capability === 'method') {
    return { ok: capabilities.methods.includes(method), reason: capabilities.methods.includes(method) ? null : 'PAYMENT_METHOD_NOT_SUPPORTED' };
  }
  const key = `supports${capability.charAt(0).toUpperCase()}${capability.slice(1)}`;
  return { ok: Boolean(capabilities[key]), reason: capabilities[key] ? null : 'PROVIDER_CAPABILITY_NOT_SUPPORTED' };
}
