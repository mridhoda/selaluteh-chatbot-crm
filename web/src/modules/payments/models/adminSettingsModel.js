const SECRET_OR_RAW_KEYS = /secret|api[_-]?key|token|signature|provider_payload|providerPayload|raw_provider|rawProvider/i
const PROVIDER_HOST_PATTERN = /bayargg|xendit|doku|midtrans/i

function stripSensitive(value) {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(stripSensitive)
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SECRET_OR_RAW_KEYS.test(key))
      .map(([key, item]) => [key, stripSensitive(item)]),
  )
}

export function normalizePaymentGatewayConfig(payload = {}) {
  const data = stripSensitive(payload.data || payload.config || payload) || {}
  return {
    provider: data.provider || 'unknown',
    displayName: data.provider === 'bayargg' ? 'BayarGG' : data.provider || 'Payment Provider',
    environment: data.environment || data.mode || '-',
    configured: Boolean(data.configured),
    publicBaseUrl: data.publicBaseUrl || data.public_base_url || '',
    webhookUrl: data.webhookUrl || data.webhook_url || '',
  }
}

export function getAdminQrContractStatus() {
  return {
    status: 'blocked',
    reason: 'No backend admin QR list/detail/create/update/revoke route is present. Public QR resolve exists only for shopper flow.',
    supportedCapabilities: [],
    deferredCapabilities: ['list', 'detail', 'create_universal', 'create_outlet', 'create_location', 'activate', 'disable', 'revoke', 'print_export'],
  }
}

export function containsSensitiveText(value) {
  return SECRET_OR_RAW_KEYS.test(String(value || ''))
}

export function isProviderDirectUrl(url) {
  const value = String(url || '')
  if (!value) return false
  try {
    const parsed = new URL(value)
    return PROVIDER_HOST_PATTERN.test(parsed.hostname)
  } catch {
    return PROVIDER_HOST_PATTERN.test(value)
  }
}

export const adminSettingsModelInternals = Object.freeze({ stripSensitive })
