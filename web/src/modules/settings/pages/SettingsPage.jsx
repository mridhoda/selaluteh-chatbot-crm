import React, { useEffect, useState } from 'react'
import PageHeader from '../../../shared/components/ui/PageHeader'
import { settingsApi } from '../api/settingsApi'
import SettingsNavigation from '../components/SettingsNavigation'
import GeneralSettingsForm from '../components/GeneralSettingsForm'
import PaymentProviderSettingsForm from '../components/PaymentProviderSettingsForm'
import { useToast } from '../../../shared/components/feedback/Toast'
import api from '../../../shared/api/httpClient'
import { isWebPushSupported, registerOrderPushNotifications } from '../../../shared/services/webPush'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general')
  const [settings, setSettings] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isTestPending, setIsTestPending] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const toast = useToast()

  const load = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await settingsApi.get()
      setSettings(res.data || {})
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSaveGeneral = async (payload) => {
    setIsSaving(true)
    try {
      await settingsApi.updateGeneral(payload)
      toast.success('General settings saved')
      load()
    } catch {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePayment = async (payload) => {
    setIsSaving(true)
    try {
      await settingsApi.updatePayment(payload)
      toast.success('Payment settings saved')
      load()
    } catch {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestProvider = async (payload) => {
    setIsTestPending(true)
    try {
      const res = await settingsApi.testPaymentProvider(payload)
      setTestResult({
        success: true,
        message: res.data?.message || 'Connection successful',
        timestamp: new Date().toLocaleTimeString(),
      })
    } catch (e) {
      setTestResult({
        success: false,
        message: e?.response?.data?.message || 'Connection failed',
        timestamp: new Date().toLocaleTimeString(),
      })
    } finally {
      setIsTestPending(false)
    }
  }

  function CommerceSettingsPlaceholder() {
    return (
      <div style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 8, color: 'var(--text-primary)' }}>
          Commerce Settings
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Catalog settings, order behavior, and checkout configuration will be
          available once the commerce backend is connected.
        </p>
      </div>
    )
  }

  function NotificationsPlaceholder() {
    const [permission, setPermission] = useState(() => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
    const [busy, setBusy] = useState(false)
    const [testBusy, setTestBusy] = useState(false)
    const [message, setMessage] = useState('')
    const refreshPermission = () => setPermission(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
    const enablePush = async () => {
      setBusy(true); setMessage('')
      try {
        const result = await registerOrderPushNotifications({ requestPermission: true })
        refreshPermission()
        setMessage(result.enabled ? 'Notifikasi berhasil diaktifkan di perangkat ini.' : ({ permission_denied: 'Izin notifikasi diblokir browser.', server_not_configured: 'Push server belum dikonfigurasi.', permission_required: 'Izin notifikasi belum diberikan.' }[result.reason] || 'Notifikasi belum aktif.'))
      } catch (error) { setMessage(error?.message || 'Gagal mengaktifkan notifikasi.') }
      finally { setBusy(false) }
    }
    const sendTest = async () => {
      setTestBusy(true); setMessage('')
      try {
        const res = await api.post('/api/push/test')
        const result = res.data?.data || {}
        setMessage(result.sent ? 'Test notification sudah dikirim.' : 'Belum ada subscription aktif di perangkat ini.')
      } catch (error) { setMessage(error?.response?.data?.error?.message || 'Gagal mengirim test notification.') }
      finally { setTestBusy(false) }
    }
    const status = permission === 'granted' ? ['Aktif', 'bg-emerald-50 text-emerald-700 border-emerald-200'] : permission === 'denied' ? ['Diblokir', 'bg-rose-50 text-rose-700 border-rose-200'] : permission === 'unsupported' ? ['Tidak didukung', 'bg-slate-100 text-slate-600 border-slate-200'] : ['Belum diizinkan', 'bg-amber-50 text-amber-700 border-amber-200']
    return (
      <div style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 8, color: 'var(--text-primary)' }}>
          Notification Settings
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Kelola izin notifikasi browser untuk user yang sedang login dan kirim notifikasi percobaan ke perangkat ini.</p>
        <div className='mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='flex items-center justify-between gap-3'><div><p className='m-0 text-sm font-black text-slate-900'>Notifikasi perangkat</p><p className='m-0 mt-1 text-xs font-semibold text-slate-400'>{isWebPushSupported() ? 'Web Push tersedia di browser ini.' : 'Gunakan HTTPS atau localhost. IP LAN dengan HTTP tidak dapat meminta izin push.'}</p></div><span className={`rounded-full border px-3 py-1 text-xs font-black ${status[1]}`}>{status[0]}</span></div>
          <div className='mt-4 flex flex-wrap gap-2'><button type='button' onClick={enablePush} disabled={busy || !isWebPushSupported() || permission === 'denied'} className='rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40'>{busy ? 'Mengaktifkan...' : 'Aktifkan Notifikasi'}</button><button type='button' onClick={sendTest} disabled={testBusy || permission !== 'granted'} className='rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40'>{testBusy ? 'Mengirim...' : 'Kirim Test Notification'}</button></div>
          {permission === 'denied' && <p className='mt-3 text-xs font-semibold text-rose-600'>Izin diblokir. Buka pengaturan site di browser, izinkan Notifications, lalu refresh halaman.</p>}
          {message && <p className='mt-3 text-xs font-semibold text-slate-600'>{message}</p>}
        </div>
      </div>
    )
  }

  function SecurityPlaceholder() {
    return (
      <div style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 8, color: 'var(--text-primary)' }}>
          Security
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Webhook security status, session management, and audit log access.
        </p>
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: 'var(--surface-secondary)',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Audit log access is available in a future release.
          </div>
        </div>
      </div>
    )
  }

  function AppearancePlaceholder() {
    return (
      <div style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 8, color: 'var(--text-primary)' }}>
          Appearance
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginTop: 12,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Theme
            </label>
            <select className='input' defaultValue='light'>
              <option value='light'>Light</option>
              <option value='dark'>Dark (coming soon)</option>
              <option value='system'>System</option>
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Table density
            </label>
            <select className='input' defaultValue='comfortable'>
              <option value='comfortable'>Comfortable</option>
              <option value='compact'>Compact</option>
            </select>
          </div>
        </div>
        <button className='btn' style={{ marginTop: 20 }}>
          Save Appearance
        </button>
      </div>
    )
  }

  const renderContent = () => {
    if (isLoading)
      return (
        <div style={{ color: 'var(--text-muted)', padding: 32 }}>
          Loading settings…
        </div>
      )
    if (error)
      return (
        <div style={{ padding: 32 }}>
          <div style={{ color: 'var(--danger-500)', marginBottom: 12 }}>
            {error}
          </div>
          <button className='btn' onClick={load}>
            Retry
          </button>
        </div>
      )
    switch (activeSection) {
      case 'general':
        return (
          <GeneralSettingsForm
            settings={settings}
            onSave={handleSaveGeneral}
            isSaving={isSaving}
          />
        )
      case 'payments':
        return (
          <PaymentProviderSettingsForm
            settings={settings}
            onSave={handleSavePayment}
            onTest={handleTestProvider}
            isSaving={isSaving}
            isTestPending={isTestPending}
            testResult={testResult}
          />
        )
      case 'commerce':
        return <CommerceSettingsPlaceholder />
      case 'notifications':
        return <NotificationsPlaceholder />
      case 'security':
        return <SecurityPlaceholder />
      case 'appearance':
        return <AppearancePlaceholder />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto -m-4 p-6 h-[calc(100vh-58px)] max-h-[calc(100vh-58px)]">
      <PageHeader
        title='Settings'
        description='Manage your workspace and outlet configuration'
      />
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          <SettingsNavigation
            activeSection={activeSection}
            onSelect={setActiveSection}
          />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: 'var(--surface-primary)',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
