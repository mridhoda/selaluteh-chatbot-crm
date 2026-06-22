import React, { useEffect, useState } from 'react'
import PageHeader from '../../../shared/components/ui/PageHeader'
import { settingsApi } from '../api/settingsApi'
import SettingsNavigation from '../components/SettingsNavigation'
import GeneralSettingsForm from '../components/GeneralSettingsForm'
import PaymentProviderSettingsForm from '../components/PaymentProviderSettingsForm'
import { useToast } from '../../../shared/components/feedback/Toast'

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
    return (
      <div style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 8, color: 'var(--text-primary)' }}>
          Notification Settings
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Configure when and how you receive notifications for orders, payments,
          and platform events.
        </p>
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {[
            'New order received',
            'Payment received',
            'Payment failed/expired',
            'Order needs attention',
            'New escalated chat',
            'Platform disconnected',
          ].map((item) => (
            <label
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <input type='checkbox' defaultChecked />
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {item}
              </span>
            </label>
          ))}
        </div>
        <button className='btn' style={{ marginTop: 20 }}>
          Save Notifications
        </button>
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
    <div style={{ padding: '20px 24px' }}>
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
