import React, { useState, useEffect } from 'react'
import { Save, CheckCircle } from 'lucide-react'

const TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'UTC',
]

const LOCALES = [
  { value: 'id-ID', label: 'Indonesian (Indonesia)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
]

const CURRENCIES = [
  { value: 'IDR', label: 'IDR — Indonesian Rupiah' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'MYR', label: 'MYR — Malaysian Ringgit' },
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

export default function GeneralSettingsForm({ settings, onSave, isSaving }) {
  const [form, setForm] = useState({
    workspaceName: '',
    businessDisplayName: '',
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
    locale: 'id-ID',
    supportContactEmail: '',
    defaultOutlet: '',
    allowAllOutletsView: true,
  })
  const [dirty, setDirty] = useState(false)
  const [savedRecently, setSavedRecently] = useState(false)

  useEffect(() => {
    if (settings?.general) {
      setForm({
        workspaceName: settings.general.workspaceName || '',
        businessDisplayName: settings.general.businessDisplayName || '',
        timezone: settings.general.timezone || 'Asia/Jakarta',
        currency: settings.general.currency || 'IDR',
        locale: settings.general.locale || 'id-ID',
        supportContactEmail: settings.general.supportContactEmail || '',
        defaultOutlet: settings.general.defaultOutlet || '',
        allowAllOutletsView: settings.general.allowAllOutletsView !== false,
      })
      setDirty(false)
    }
  }, [settings])

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave(form)
    setDirty(false)
    setSavedRecently(true)
    setTimeout(() => setSavedRecently(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 24 }}>
      <h3
        style={{
          margin: '0 0 4px',
          color: 'var(--text-primary)',
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        General Settings
      </h3>
      <p
        style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: 13 }}
      >
        Workspace identity and regional configuration.
      </p>

      <div style={SECTION_HDR}>Workspace Identity</div>
      <div style={FIELD}>
        <label style={LABEL}>Workspace Name</label>
        <input
          className='input'
          value={form.workspaceName}
          onChange={(e) => set('workspaceName', e.target.value)}
          placeholder='e.g. Selaluteh HQ'
          style={{ width: '100%' }}
        />
      </div>
      <div style={FIELD}>
        <label style={LABEL}>Business Display Name</label>
        <input
          className='input'
          value={form.businessDisplayName}
          onChange={(e) => set('businessDisplayName', e.target.value)}
          placeholder='e.g. Selaluteh Cafe & Resto'
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Shown to customers in receipts and notifications.
        </div>
      </div>
      <div style={FIELD}>
        <label style={LABEL}>Support Contact Email</label>
        <input
          className='input'
          type='email'
          value={form.supportContactEmail}
          onChange={(e) => set('supportContactEmail', e.target.value)}
          placeholder='support@yourbusiness.com'
          style={{ width: '100%' }}
        />
      </div>

      <div style={SECTION_HDR}>Regional</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={FIELD}>
          <label style={LABEL}>Timezone</label>
          <select
            className='input'
            value={form.timezone}
            onChange={(e) => set('timezone', e.target.value)}
            style={{ width: '100%' }}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <div style={FIELD}>
          <label style={LABEL}>Currency</label>
          <select
            className='input'
            value={form.currency}
            onChange={(e) => set('currency', e.target.value)}
            style={{ width: '100%' }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={FIELD}>
        <label style={LABEL}>Locale</label>
        <select
          className='input'
          value={form.locale}
          onChange={(e) => set('locale', e.target.value)}
          style={{ width: '100%' }}
        >
          {LOCALES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div style={SECTION_HDR}>Multi-Outlet Defaults</div>
      <div style={FIELD}>
        <label style={LABEL}>Default Outlet for Admin View</label>
        <input
          className='input'
          value={form.defaultOutlet}
          onChange={(e) => set('defaultOutlet', e.target.value)}
          placeholder='Outlet ID or name (leave blank for All Outlets)'
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ ...FIELD, display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type='checkbox'
          id='allowAllOutletsView'
          checked={form.allowAllOutletsView}
          onChange={(e) => set('allowAllOutletsView', e.target.checked)}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
        <label
          htmlFor='allowAllOutletsView'
          style={{ ...LABEL, margin: 0, cursor: 'pointer' }}
        >
          Allow "All Outlets" aggregate view
        </label>
      </div>

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
  )
}
