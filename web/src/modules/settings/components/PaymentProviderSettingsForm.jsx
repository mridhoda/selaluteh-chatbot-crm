import React, { useState, useEffect } from 'react'
import { Save, Copy, CheckCircle, XCircle, Zap } from 'lucide-react'
import SecretField from './SecretField'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const PROVIDERS = [
  { value: '', label: 'None — Payments disabled' },
  { value: 'midtrans', label: 'Midtrans' },
  { value: 'xendit', label: 'Xendit' },
  { value: 'doku', label: 'DOKU Checkout' },
]

const PAYMENT_METHODS = [
  { value: 'qris', label: 'QRIS' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cod', label: 'Cash on Delivery' },
]

const FIELD = { marginBottom: 16 }
const LABEL = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 4,
}
const SECTION_HDR = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 12,
  marginTop: 24,
  paddingBottom: 6,
  borderBottom: '1px solid var(--border-subtle)',
}

export default function PaymentProviderSettingsForm({
  settings,
  onSave,
  onTest,
  isSaving,
  isTestPending,
  testResult,
}) {
  const payment = settings?.payment || {}
  const {
    provider: savedProvider,
    environment: savedEnvironment,
    merchantId: savedMerchantId,
    publicKey: savedPublicKey,
    paymentMethods: savedPaymentMethods,
  } = payment
  const webhookBase =
    settings?.publicBaseUrl ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  const [form, setForm] = useState({
    provider: '',
    environment: 'sandbox',
    merchantId: '',
    publicKey: '',
    serverKey: null,
    webhookSecret: null,
    dokuClientId: null,
    dokuSecretKey: null,
    paymentMethods: ['qris', 'bank_transfer', 'ewallet'],
  })
  const [dirty, setDirty] = useState(false)
  const [showProdConfirm, setShowProdConfirm] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [savedRecently, setSavedRecently] = useState(false)

  useEffect(() => {
    if (settings?.payment) {
      setForm({
        provider: savedProvider || '',
        environment: savedEnvironment || 'sandbox',
        merchantId: savedMerchantId || '',
        publicKey: savedPublicKey || '',
        serverKey: null,
        webhookSecret: null,
        dokuClientId: null,
        dokuSecretKey: null,
        paymentMethods: savedPaymentMethods || [
          'qris',
          'bank_transfer',
          'ewallet',
        ],
      })
      setDirty(false)
    }
  }, [settings?.payment, savedProvider, savedEnvironment, savedMerchantId, savedPublicKey, savedPaymentMethods])

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }

  const handleEnvChange = (env) => {
    if (env === 'production') {
      setShowProdConfirm(true)
    } else {
      set('environment', env)
    }
  }

  const toggleMethod = (method) => {
    setForm((prev) => {
      const methods = prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter((m) => m !== method)
        : [...prev.paymentMethods, method]
      return { ...prev, paymentMethods: methods }
    })
    setDirty(true)
  }

  const buildPayload = () => {
    const payload = {
      provider: form.provider,
      environment: form.environment,
      merchantId: form.merchantId,
      publicKey: form.publicKey,
      paymentMethods: form.paymentMethods,
    }
    if (form.serverKey !== null) payload.serverKey = form.serverKey
    if (form.webhookSecret !== null) payload.webhookSecret = form.webhookSecret
    if (form.dokuClientId !== null) payload.dokuClientId = form.dokuClientId
    if (form.dokuSecretKey !== null) payload.dokuSecretKey = form.dokuSecretKey
    return payload
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave(buildPayload())
    setDirty(false)
    setSavedRecently(true)
    setTimeout(() => setSavedRecently(false), 3000)
  }

  const handleTest = () => onTest(buildPayload())

  const webhookUrl = payment.webhookUrl || `${webhookBase}/webhook/xendit/payment-sessions`

  const handleCopyWebhook = () => {
    navigator.clipboard?.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

  const envBtnStyle = (env) => ({
    padding: '6px 18px',
    borderRadius: 6,
    border: '1px solid var(--border-subtle)',
    background:
      form.environment === env
        ? 'var(--brand-500)'
        : 'var(--surface-secondary)',
    color: form.environment === env ? '#fff' : 'var(--text-primary)',
    fontWeight: form.environment === env ? 600 : 400,
    fontSize: 13,
    cursor: 'pointer',
    textTransform: 'capitalize',
  })

  const methodChipStyle = (val) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${form.paymentMethods.includes(val) ? 'var(--brand-500)' : 'var(--border-subtle)'}`,
    background: form.paymentMethods.includes(val)
      ? 'var(--info-50)'
      : 'transparent',
  })

  return (
    <>
      <form onSubmit={handleSubmit} style={{ padding: 24 }}>
        <h3
          style={{
            margin: '0 0 4px',
            color: 'var(--text-primary)',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Payment Provider
        </h3>
        <p
          style={{
            margin: '0 0 20px',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Configure your payment gateway for checkout and order management.
        </p>

        <div
          style={{
            marginBottom: 20,
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${payment.runtimeConfigured ? 'var(--success-100)' : 'var(--warning-200)'}`,
            background: payment.runtimeConfigured ? 'var(--success-50)' : 'var(--warning-50)',
            color: payment.runtimeConfigured ? 'var(--success-700)' : 'var(--warning-600)',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          Runtime gateway: <strong>{payment.runtimeProvider || 'manual'}</strong>{' '}
          ({payment.runtimeEnvironment || 'test'}) —{' '}
          {payment.runtimeConfigured
            ? 'configured from backend environment and used by payment link creation.'
            : 'not configured in backend runtime environment.'}
        </div>

        <div style={SECTION_HDR}>Provider</div>
        <div style={FIELD}>
          <label style={LABEL}>Payment Provider</label>
          <select
            className='input'
            value={form.provider}
            onChange={(e) => set('provider', e.target.value)}
            style={{ width: '100%' }}
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {form.provider && (
          <>
            <div style={FIELD}>
              <label style={LABEL}>Environment</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['sandbox', 'production'].map((env) => (
                  <button
                    key={env}
                    type='button'
                    onClick={() => handleEnvChange(env)}
                    style={envBtnStyle(env)}
                  >
                    {env}
                    {env === 'production' ? ' ⚠' : ''}
                  </button>
                ))}
              </div>
              {form.environment === 'production' && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 12px',
                    background: 'var(--warning-50)',
                    borderRadius: 6,
                    fontSize: 12,
                    color: 'var(--warning-500)',
                    border: '1px solid var(--warning-500)',
                  }}
                >
                  Production mode — live transactions will be processed.
                </div>
              )}
            </div>

            <div style={SECTION_HDR}>Credentials</div>
            <div style={FIELD}>
              <label style={LABEL}>
                {form.provider === 'midtrans'
                  ? 'Merchant ID'
                  : form.provider === 'doku'
                    ? 'Merchant / Account Label'
                    : 'Account Identifier'}
              </label>
              <input
                className='input'
                value={form.merchantId}
                onChange={(e) => set('merchantId', e.target.value)}
                placeholder={
                  form.provider === 'midtrans'
                    ? 'G12345678'
                    : form.provider === 'doku'
                      ? 'DOKU merchant label'
                      : 'your-account-id'
                }
                style={{ width: '100%' }}
              />
            </div>
            {form.provider !== 'doku' && <div style={FIELD}>
              <label style={LABEL}>
                {form.provider === 'midtrans'
                  ? 'Client Key (Public)'
                  : 'Public Key'}
              </label>
              <input
                className='input'
                value={form.publicKey}
                onChange={(e) => set('publicKey', e.target.value)}
                placeholder={
                  form.provider === 'midtrans'
                    ? 'SB-Mid-client-…'
                    : 'xnd_public_…'
                }
                style={{ width: '100%' }}
              />
            </div>}
            {form.provider === 'doku' ? (
              <>
                <SecretField
                  label='DOKU Client ID'
                  name='dokuClientId'
                  hasExistingValue={!!payment.dokuClientIdConfigured}
                  value={form.dokuClientId}
                  onChange={(val) => set('dokuClientId', val)}
                  placeholder='MCH-... or BRN-...'
                  helperText='Write-only. Required for DOKU Checkout request headers.'
                />
                <SecretField
                  label='DOKU Secret Key'
                  name='dokuSecretKey'
                  hasExistingValue={!!payment.dokuSecretKeyConfigured}
                  value={form.dokuSecretKey}
                  onChange={(val) => set('dokuSecretKey', val)}
                  placeholder='DOKU secret key'
                  helperText='Write-only. Used to sign DOKU Checkout requests and verify notifications.'
                />
              </>
            ) : (
              <>
                <SecretField
                  label={
                    form.provider === 'midtrans'
                      ? 'Server Key (Secret)'
                      : 'Secret Key'
                  }
                  name='serverKey'
                  hasExistingValue={!!payment.serverKeyConfigured}
                  value={form.serverKey}
                  onChange={(val) => set('serverKey', val)}
                  placeholder={
                    form.provider === 'midtrans'
                      ? 'SB-Mid-server-…'
                      : 'xnd_production_…'
                  }
                  helperText='Write-only. Your previous key is securely stored.'
                />
                <SecretField
                  label='Webhook Secret'
                  name='webhookSecret'
                  hasExistingValue={!!payment.webhookSecretConfigured}
                  value={form.webhookSecret}
                  onChange={(val) => set('webhookSecret', val)}
                  placeholder='Webhook validation secret'
                  helperText='Used to verify incoming webhook signatures from the provider.'
                />
              </>
            )}

            <div style={SECTION_HDR}>Webhook URL</div>
            <div style={FIELD}>
              <label style={LABEL}>
                Webhook Endpoint (register in your {form.provider} dashboard)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className='input'
                  type='text'
                  value={webhookUrl}
                  readOnly
                  style={{
                    flex: 1,
                    color: 'var(--text-muted)',
                    cursor: 'default',
                    fontFamily: 'monospace',
                    fontSize: 12,
                  }}
                  aria-label='Webhook URL'
                />
                <button
                  className='btn ghost'
                  type='button'
                  onClick={handleCopyWebhook}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Copy size={13} />
                  {copiedWebhook ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={SECTION_HDR}>Default Payment Methods</div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 20,
              }}
            >
              {PAYMENT_METHODS.map(({ value, label }) => (
                <label key={value} style={methodChipStyle(value)}>
                  <input
                    type='checkbox'
                    checked={form.paymentMethods.includes(value)}
                    onChange={() => toggleMethod(value)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13 }}>{label}</span>
                </label>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                paddingTop: 16,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type='button'
                className='btn ghost'
                onClick={handleTest}
                disabled={isTestPending}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Zap size={13} />
                {isTestPending ? 'Testing…' : 'Test Connection'}
              </button>
              {testResult && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: testResult.success
                      ? 'var(--success-600)'
                      : 'var(--danger-500)',
                  }}
                >
                  {testResult.success ? (
                    <CheckCircle size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  {testResult.message}
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginLeft: 4,
                    }}
                  >
                    {testResult.timestamp}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {(dirty || savedRecently) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {dirty && (
              <button
                className='btn'
                type='submit'
                disabled={isSaving}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Save size={14} />
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
            {savedRecently && !dirty && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--success-600)',
                  fontSize: 14,
                }}
              >
                <CheckCircle size={16} /> Saved successfully
              </div>
            )}
          </div>
        )}
      </form>

      <ConfirmDialog
        open={showProdConfirm}
        title='Switch to Production?'
        description='You are about to enable live production payments. Real money will be processed. Make sure your credentials are correct before saving.'
        confirmLabel='Yes, switch to Production'
        cancelLabel='Stay on Sandbox'
        variant='danger'
        onConfirm={() => {
          set('environment', 'production')
          setShowProdConfirm(false)
        }}
        onCancel={() => setShowProdConfirm(false)}
      />
    </>
  )
}
