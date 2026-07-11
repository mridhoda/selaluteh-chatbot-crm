import React, { useEffect, useState } from 'react'
import { createPhase5ApiClient } from '../../../features/public-store/api/phase5ApiClient.js'
import { getApiErrorMessage } from '../../../shared/api/apiError.js'
import {
  getAdminQrContractStatus,
  isProviderDirectUrl,
  normalizePaymentGatewayConfig,
} from '../models/adminSettingsModel.js'

function readStoredJson(key) {
  try {
    const value = sessionStorage.getItem(key) || localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function createAdminClient() {
  return createPhase5ApiClient({
    getAuthToken: () => sessionStorage.getItem('token') || localStorage.getItem('token') || '',
    getWorkspaceId: () => {
      const user = readStoredJson('user') || {}
      return user.workspaceId || user.workspace_id || user.currentWorkspaceId || user.workspace?.id || ''
    },
  }).admin
}

const adminClient = createAdminClient()

export default function Phase5AdminSettingsPage() {
  const [paymentConfig, setPaymentConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const qrStatus = getAdminQrContractStatus()

  async function loadPaymentConfig() {
    setLoading(true)
    setError('')
    try {
      const payload = await adminClient.getPaymentGatewayConfig()
      setPaymentConfig(normalizePaymentGatewayConfig(payload))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load payment gateway config.'))
      setPaymentConfig(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPaymentConfig()
  }, [])

  return (
    <div className='flex min-h-[calc(100vh-90px)] flex-col gap-4 bg-[var(--app-background)] p-1 text-[var(--text-primary)]'>
      <header className='rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 shadow-sm'>
        <div className='flex flex-col justify-between gap-3 md:flex-row md:items-start'>
          <div>
            <h1 className='m-0 text-2xl font-black tracking-tight'>QR and Payment Settings</h1>
            <p className='mt-1 max-w-3xl text-sm text-[var(--text-muted)]'>
              Safe Phase 5 admin status view. Payment provider authority remains backend-managed; QR management is blocked until a backend admin contract exists.
            </p>
          </div>
          <button
            type='button'
            onClick={loadPaymentConfig}
            disabled={loading}
            className='h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 text-sm font-bold text-[var(--text-secondary)] disabled:opacity-60'
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700'>{error}</div>}

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <section className='rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 shadow-sm'>
          <div className='text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]'>Admin QR Management</div>
          <h2 className='m-0 mt-1 text-xl font-black'>Blocked by Backend Contract</h2>
          <p className='mt-2 text-sm leading-6 text-[var(--text-secondary)]'>{qrStatus.reason}</p>
          <div className='mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800'>
            No QR list/detail/create/update/revoke buttons are rendered because frontend must not invent QR authority.
          </div>
          <div className='mt-4'>
            <div className='text-sm font-black'>Deferred capabilities</div>
            <div className='mt-2 flex flex-wrap gap-2'>
              {qrStatus.deferredCapabilities.map((item) => <span key={item} className='rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs font-bold'>{item.replaceAll('_', ' ')}</span>)}
            </div>
          </div>
        </section>

        <section className='rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 shadow-sm'>
          <div className='text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]'>Payment Provider Settings</div>
          <h2 className='m-0 mt-1 text-xl font-black'>Read-only Backend Status</h2>
          {paymentConfig ? (
            <div className='mt-4 grid grid-cols-1 gap-3 text-sm'>
              <SettingRow label='Active provider' value={paymentConfig.displayName} />
              <SettingRow label='Provider key' value={paymentConfig.provider} />
              <SettingRow label='Environment' value={paymentConfig.environment} />
              <SettingRow label='Configured' value={paymentConfig.configured ? 'Yes' : 'No'} />
              <SettingRow label='Webhook route' value={isProviderDirectUrl(paymentConfig.webhookUrl) ? 'Backend-managed route' : paymentConfig.webhookUrl || '-'} />
              <SettingRow label='Public base URL' value={paymentConfig.publicBaseUrl || '-'} />
            </div>
          ) : (
            <div className='mt-4 rounded-xl bg-[var(--surface-secondary)] p-4 text-sm font-semibold text-[var(--text-muted)]'>No payment settings returned yet.</div>
          )}
          <div className='mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800'>
            Secrets, API keys, webhook secrets, raw provider payloads, and direct provider API calls are intentionally not exposed.
          </div>
        </section>
      </div>
    </div>
  )
}

function SettingRow({ label, value }) {
  return (
    <div className='rounded-xl border border-[var(--border-subtle)] p-3'>
      <div className='text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]'>{label}</div>
      <div className='mt-1 break-all font-bold'>{value}</div>
    </div>
  )
}
