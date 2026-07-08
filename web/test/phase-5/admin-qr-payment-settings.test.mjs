import assert from 'node:assert/strict'
import test from 'node:test'

import { createPhase5ApiClient } from '../../src/features/public-store/api/phase5ApiClient.js'
import {
  containsSensitiveText,
  getAdminQrContractStatus,
  isProviderDirectUrl,
  normalizePaymentGatewayConfig,
} from '../../src/modules/payments/models/adminSettingsModel.js'

function createRecordingFetch(responseBody) {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => responseBody,
      text: async () => JSON.stringify(responseBody),
    }
  }
  return { calls, fetchImpl }
}

test('QR admin management is explicitly blocked when backend contract is missing', () => {
  const status = getAdminQrContractStatus()
  assert.equal(status.status, 'blocked')
  assert.deepEqual(status.supportedCapabilities, [])
  assert.equal(status.deferredCapabilities.includes('revoke'), true)
})

test('payment gateway config is normalized without secrets or raw provider payloads', () => {
  const normalized = normalizePaymentGatewayConfig({
    data: {
      provider: 'bayargg',
      environment: 'sandbox',
      configured: true,
      bayargg_api_key: 'secret-key',
      webhook_secret: 'secret-webhook',
      raw_provider_payload: { token: 'hidden' },
      webhookUrl: '/webhook/bayargg',
    },
  })

  assert.equal(normalized.provider, 'bayargg')
  assert.equal(normalized.displayName, 'BayarGG')
  assert.equal(normalized.configured, true)
  assert.equal(JSON.stringify(normalized).includes('secret-key'), false)
  assert.equal(JSON.stringify(normalized).includes('hidden'), false)
  assert.equal(containsSensitiveText('bayargg_api_key'), true)
})

test('payment settings client reads backend config and does not call provider APIs directly', async () => {
  const { calls, fetchImpl } = createRecordingFetch({ data: { provider: 'bayargg', environment: 'sandbox', configured: true } })
  const client = createPhase5ApiClient({ baseUrl: 'https://api.example.test', fetchImpl })

  await client.admin.getPaymentGatewayConfig()

  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://api.example.test/payments/gateway/config')
  assert.equal(isProviderDirectUrl(calls[0].url), false)
})
