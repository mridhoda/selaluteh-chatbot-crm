import api from '../../../shared/api/httpClient'

const normalizeGeneralSettings = (data = {}) => ({
  workspaceName: data.workspace_name || data.workspaceName || '',
  businessDisplayName: data.business_display_name || data.businessDisplayName || '',
  timezone: data.timezone || 'Asia/Jakarta',
  currency: data.currency || 'IDR',
  locale: data.locale || 'id-ID',
  defaultLanguage: data.default_language || data.defaultLanguage || 'id',
  supportContactEmail: data.support_contact_email || data.supportContactEmail || '',
  defaultOutlet: data.default_outlet_id || data.defaultOutlet || '',
  allowAllOutletsView: data.allow_all_outlets_view ?? data.allowAllOutletsView ?? true,
})

const normalizePaymentSettings = (data = {}, runtime = {}) => {
  const provider = data.provider || runtime.provider || ''
  const environment = data.xendit_mode || data.environment || runtime.environment || 'test'
  return {
    provider: provider === 'manual' ? '' : provider,
    environment: environment === 'test' ? 'sandbox' : environment,
    merchantId: data.merchant_id || data.merchantId || '',
    publicKey: data.public_key || data.publicKey || '',
    paymentMethods: data.payment_methods || data.paymentMethods || ['qris', 'bank_transfer', 'ewallet'],
    serverKeyConfigured: Boolean(data.xendit_secret_key_configured || data.serverKeyConfigured),
    dokuClientIdConfigured: Boolean(data.doku_client_id_configured),
    dokuSecretKeyConfigured: Boolean(data.doku_secret_key_configured),
    webhookSecretConfigured: Boolean(data.xendit_webhook_token_configured || data.webhookSecretConfigured),
    bayarggApiKeyConfigured: Boolean(data.bayargg_api_key_configured),
    bayarggWebhookSecretConfigured: Boolean(data.bayargg_webhook_secret_configured),
    bayarggCheckoutUrl: data.bayargg_checkout_url || data.bayarggCheckoutUrl || 'https://www.bayar.gg/pay',
    bayarggPaymentMethod: data.bayargg_payment_method || data.bayarggPaymentMethod || 'qris',
    bayarggUseQrisConverter: Boolean(data.bayargg_use_qris_converter || data.bayarggUseQrisConverter),
    runtimeProvider: runtime.provider || provider || 'manual',
    runtimeEnvironment: runtime.environment || 'test',
    runtimeConfigured: Boolean(runtime.configured),
    webhookUrl: runtime.webhookUrl || '',
  }
}

const mapPaymentPayload = (payload = {}) => {
  const provider = payload.provider || 'manual'
  return {
    provider,
    xendit_mode: payload.environment === 'sandbox' ? 'test' : payload.environment,
    merchant_id: payload.merchantId || '',
    public_key: payload.publicKey || '',
    payment_methods: payload.paymentMethods || [],
    ...(provider === 'xendit' && payload.serverKey !== undefined && payload.serverKey !== null ? { xendit_secret_key: payload.serverKey } : {}),
    ...(provider === 'xendit' && payload.webhookSecret !== undefined && payload.webhookSecret !== null ? { xendit_webhook_token: payload.webhookSecret } : {}),
    ...(provider === 'doku' && payload.dokuClientId !== undefined && payload.dokuClientId !== null ? { doku_client_id: payload.dokuClientId } : {}),
    ...(provider === 'doku' && payload.dokuSecretKey !== undefined && payload.dokuSecretKey !== null ? { doku_secret_key: payload.dokuSecretKey } : {}),
    ...(provider === 'bayargg' && payload.bayarggApiKey !== undefined && payload.bayarggApiKey !== null ? { bayargg_api_key: payload.bayarggApiKey } : {}),
    ...(provider === 'bayargg' && payload.bayarggWebhookSecret !== undefined && payload.bayarggWebhookSecret !== null ? { bayargg_webhook_secret: payload.bayarggWebhookSecret } : {}),
    ...(provider === 'bayargg' ? {
      bayargg_checkout_url: payload.bayarggCheckoutUrl || 'https://www.bayar.gg/pay',
      bayargg_payment_method: payload.bayarggPaymentMethod || 'qris',
      bayargg_use_qris_converter: Boolean(payload.bayarggUseQrisConverter),
    } : {}),
  }
}

export const settingsApi = {
  get: async () => {
    const [generalRes, paymentRes, gatewayRes] = await Promise.all([
      api.get('/api/workspaces/settings/general'),
      api.get('/api/workspaces/settings/payment'),
      api.get('/payments/gateway/config').catch(() => ({ data: { data: {} } })),
    ])

    const general = generalRes.data?.data || generalRes.data || {}
    const payment = paymentRes.data?.data || paymentRes.data || {}
    const gateway = gatewayRes.data?.data || gatewayRes.data || {}

    return {
      data: {
        publicBaseUrl: gateway.publicBaseUrl,
        general: normalizeGeneralSettings(general),
        payment: normalizePaymentSettings(payment, gateway),
      },
    }
  },
  updateGeneral: (payload) => api.put('/api/workspaces/settings/general', {
    business_display_name: payload.businessDisplayName,
    timezone: payload.timezone,
    currency: payload.currency,
    locale: payload.locale,
    default_language: payload.defaultLanguage || 'id',
  }),
  updateCommerce: (payload) => api.put('/settings/commerce', payload),
  updatePayment: (payload) => api.put('/api/workspaces/settings/payment', mapPaymentPayload(payload)),
  updateNotifications: (payload) => api.put('/settings/notifications', payload),
  updateAppearance: (payload) => api.put('/settings/appearance', payload),
  testPaymentProvider: () => api.get('/payments/gateway/config').then((res) => {
    const data = res.data?.data || res.data || {}
    if (!data.configured) {
      const err = new Error('Payment provider is not configured in backend runtime env')
      err.response = { data: { message: err.message } }
      throw err
    }
    return { data: { message: `${data.provider || 'Payment provider'} ${data.environment || ''} is configured` } }
  }),
}
