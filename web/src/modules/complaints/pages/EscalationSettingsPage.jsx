/**
 * EscalationSettingsPage.jsx
 * Workspace-level escalation policy configuration.
 *
 * Layout: Two-column grid
 *   Left column  → Trigger Rules + Supervisor SLA
 *   Right column → Enable toggle + Recipient Strategy
 */

import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBell,
  faCheckCircle,
  faExclamationTriangle,
  faSave,
  faToggleOn,
  faToggleOff,
  faClock,
  faUserShield,
  faSlidersH,
  faInfoCircle,
  faBoltLightning,
} from '@fortawesome/free-solid-svg-icons'
import {
  getEscalationSettings,
  updateEscalationSettings,
  validateEscalationSettings,
} from '../api/escalationApi'
import '../styles/escalation.css'

const RECIPIENT_STRATEGIES = [
  { value: 'PRIMARY_ONLY',          label: 'Supervisor Utama Saja',     desc: 'Hanya kirim ke supervisor utama outlet.', emoji: '🎯' },
  { value: 'FIRST_AVAILABLE',       label: 'Supervisor Tersedia',       desc: 'Pilih supervisor pertama yang tersedia untuk outlet.', emoji: '⛓️' },
  { value: 'SUPERVISOR_QUEUE',      label: 'Antrean Supervisor',        desc: 'Masukkan eskalasi ke antrean supervisor untuk ditangani.', emoji: '📥' },
  { value: 'ALL_SUPERVISORS',       label: 'Semua Supervisor',          desc: 'Kirim notifikasi ke semua supervisor outlet.', emoji: '📣' },
]

const DEFAULT_RECIPIENT_STRATEGY = 'FIRST_AVAILABLE'
const VALID_RECIPIENT_STRATEGIES = new Set(RECIPIENT_STRATEGIES.map(s => s.value))

const PRIORITY_OPTIONS = [
  { value: 'critical', label: '🔴 Critical', color: '#dc2626' },
  { value: 'high',     label: '🟠 High',     color: '#ea580c' },
  { value: 'medium',   label: '🟡 Medium',   color: '#d97706' },
  { value: 'urgent',   label: '🔥 Urgent',   color: '#7c3aed' },
]

const DEFAULT_POLICY = {
  enabled: true,
  matchMode: 'ANY',
  triggerRules: {
    immediatePriorities: ['high', 'critical'],
    unassignedAfterMinutes: null,
    slaRemainingMinutes: null,
  },
  supervisorSla: {
    acknowledgementMinutes: 30,
    firstResponseMinutes: null,
  },
  recipientStrategy: DEFAULT_RECIPIENT_STRATEGY,
}

// ─── Small reusable components ────────────────────────────────────────────────

function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      className={`esc-switch ${checked ? 'esc-switch--checked' : ''}`}
      onClick={() => onChange(!checked)}
      type="button"
      role="switch"
      aria-checked={checked}
    >
      <span className="esc-switch__thumb" />
    </button>
  )
}

function NumberInput({ id, label, value, onChange, min = 1, placeholder, hint }) {
  return (
    <div className="esc-field">
      <label htmlFor={id} className="esc-field__label">{label}</label>
      {hint && <p className="esc-field__hint">{hint}</p>}
      <div className="esc-input-group">
        <input
          id={id}
          type="number"
          className="esc-input-field"
          min={min}
          value={value ?? ''}
          placeholder={placeholder || 'Nonaktif'}
          onChange={e => onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
        />
        <span className="esc-input-suffix">menit</span>
      </div>
    </div>
  )
}

// ─── Card wrapper for grid cells ──────────────────────────────────────────────

function SettingsCard({ icon, title, accent = '#7c3aed', children }) {
  return (
    <div className="esc-settings-card">
      <div className="esc-settings-card__header">
        <div className="esc-settings-card__icon" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}>
          <FontAwesomeIcon icon={icon} />
        </div>
        <h3 className="esc-settings-card__title">{title}</h3>
      </div>
      <div className="esc-settings-card__body">{children}</div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EscalationSettingsPage() {
  const [form, setForm] = useState(DEFAULT_POLICY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    getEscalationSettings()
      .then(r => {
        const p = r.data?.policy
        if (p) {
          setForm({
            enabled: p.enabled ?? true,
            matchMode: p.matchMode || 'ANY',
            triggerRules: {
              immediatePriorities: p.triggerRules?.immediatePriorities || [],
              unassignedAfterMinutes: p.triggerRules?.unassignedAfterMinutes ?? null,
              slaRemainingMinutes: p.triggerRules?.slaRemainingMinutes ?? null,
            },
            supervisorSla: {
              acknowledgementMinutes: p.supervisorSla?.acknowledgementMinutes ?? 30,
              firstResponseMinutes: p.supervisorSla?.firstResponseMinutes ?? null,
            },
            recipientStrategy: VALID_RECIPIENT_STRATEGIES.has(p.recipientStrategy)
              ? p.recipientStrategy
              : DEFAULT_RECIPIENT_STRATEGY,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function patch(path, value) {
    setForm(prev => {
      const next = { ...prev }
      const parts = path.split('.')
      let ref = next
      for (let i = 0; i < parts.length - 1; i++) {
        ref[parts[i]] = { ...ref[parts[i]] }
        ref = ref[parts[i]]
      }
      ref[parts[parts.length - 1]] = value
      return next
    })
    setSaved(false)
    setErrors([])
  }

  function togglePriority(val) {
    const cur = form.triggerRules.immediatePriorities
    patch('triggerRules.immediatePriorities', cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val])
  }

  async function handleSave() {
    setSaving(true)
    setErrors([])
    try {
      const vr = await validateEscalationSettings(form)
      if (!vr.data.valid) {
        setErrors(vr.data.errors || ['Validasi gagal.'])
        return
      }
      await updateEscalationSettings(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setErrors([err?.response?.data?.error?.message || 'Gagal menyimpan pengaturan.'])
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="esc-settings-page">
        <div className="esc-settings-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="esc-skeleton-card" style={{ height: 180 }} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="esc-settings-page">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="esc-settings-header">
        <div className="esc-settings-header__icon">
          <FontAwesomeIcon icon={faBell} />
        </div>
        <div>
          <h2 className="esc-settings-header__title">Pengaturan Eskalasi Keluhan</h2>
          <p className="esc-settings-header__subtitle">
            Konfigurasi aturan auto-eskalasi dan supervisor workspace.
          </p>
        </div>
        {/* Save button top-right */}
        <button
          className="esc-btn esc-btn--primary"
          onClick={handleSave}
          disabled={saving}
          id="btn-save-escalation-settings"
          style={{ marginLeft: 'auto' }}
        >
          <FontAwesomeIcon icon={faSave} />
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>

      {/* ── Banners ──────────────────────────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="esc-error-banner">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          {errors.join(' | ')}
        </div>
      )}
      {saved && (
        <div className="esc-success-banner">
          <FontAwesomeIcon icon={faCheckCircle} /> Pengaturan berhasil disimpan.
        </div>
      )}

      {/* ── Two-column grid ──────────────────────────────────────────────────── */}
      <div className="esc-settings-grid">

        {/* ─ COLUMN 1 (LEFT) ───────────────────────────────────────────────── */}
        <div className="esc-settings-col">
          {/* Card 1: Enable toggle */}
          <SettingsCard icon={faToggleOn} title="Status Auto-Eskalasi" accent="#7c3aed">
            <div className="esc-settings-row">
              <div>
                <p className="esc-settings-row__label">Aktifkan Auto-Eskalasi</p>
                <p className="esc-settings-row__desc">
                  Keluhan prioritas tinggi atau tidak tertangani akan otomatis dieskalasikan ke supervisor.
                </p>
              </div>
              <Toggle
                id="toggle-enabled"
                checked={form.enabled}
                onChange={v => patch('enabled', v)}
              />
            </div>

            {form.enabled && (
              <div className="esc-settings-row" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', alignItems: 'center' }}>
                <span className="esc-settings-row__label" style={{ margin: 0 }}>Mode Pencocokan</span>
                <div className="esc-segmented-control">
                  <button
                    type="button"
                    className={`esc-segmented-btn ${form.matchMode === 'ANY' ? 'esc-segmented-btn--active' : ''}`}
                    onClick={() => patch('matchMode', 'ANY')}
                  >
                    OR (Salah Satu)
                  </button>
                  <button
                    type="button"
                    className={`esc-segmented-btn ${form.matchMode === 'ALL' ? 'esc-segmented-btn--active' : ''}`}
                    onClick={() => patch('matchMode', 'ALL')}
                  >
                    AND (Semua)
                  </button>
                </div>
              </div>
            )}
          </SettingsCard>

          {/* Card 3: Trigger rules (only when enabled) */}
          {form.enabled && (
            <SettingsCard icon={faBoltLightning} title="Aturan Pemicu" accent="#ea580c">
              <div className="esc-field">
                <label className="esc-field__label">Prioritas yang Langsung Dieskalasikan</label>
                <div className="esc-priority-grid">
                  {PRIORITY_OPTIONS.map(o => {
                    const on = form.triggerRules.immediatePriorities.includes(o.value)
                    return (
                      <button
                        type="button"
                        key={o.value}
                        onClick={() => togglePriority(o.value)}
                        className={`esc-priority-pill ${on ? 'esc-priority-pill--active' : ''}`}
                        style={{ '--pill-color': o.color }}
                      >
                        <span className="esc-priority-dot" style={{ backgroundColor: o.color }} />
                        {o.label.split(' ').slice(1).join(' ')}
                      </button>
                    )
                  })}
                </div>
              </div>

              <NumberInput
                id="unassigned-minutes"
                label="Eskalasi Jika Tidak Ditangani Selama"
                value={form.triggerRules.unassignedAfterMinutes}
                onChange={v => patch('triggerRules.unassignedAfterMinutes', v)}
                hint="Kosongkan untuk menonaktifkan trigger ini."
              />

              <NumberInput
                id="sla-remaining"
                label="Eskalasi Jika SLA Tersisa ≤"
                value={form.triggerRules.slaRemainingMinutes}
                onChange={v => patch('triggerRules.slaRemainingMinutes', v)}
                hint="Eskalasi dipicu jika sisa waktu SLA ≤ nilai ini."
              />
            </SettingsCard>
          )}
        </div>

        {/* ─ COLUMN 2 (RIGHT) ──────────────────────────────────────────────── */}
        <div className="esc-settings-col">
          {/* Card 2: Recipient strategy */}
          <SettingsCard icon={faUserShield} title="Strategi Penerima" accent="#0891b2">
            <div className="esc-strategy-grid">
              {RECIPIENT_STRATEGIES.map(s => (
                <label
                  key={s.value}
                  className={`esc-strategy-card ${form.recipientStrategy === s.value ? 'esc-strategy-card--selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="recipientStrategy"
                    value={s.value}
                    checked={form.recipientStrategy === s.value}
                    onChange={() => patch('recipientStrategy', s.value)}
                  />
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{s.emoji}</span>
                    <div>
                      <p className="esc-strategy-card__label">{s.label}</p>
                      <p className="esc-strategy-card__desc">{s.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </SettingsCard>

          {/* Card 4: Supervisor SLA (only when enabled) */}
          {form.enabled && (
            <SettingsCard icon={faClock} title="SLA Supervisor" accent="#059669">
              <NumberInput
                id="ack-minutes"
                label="Target Waktu Acknowledge"
                value={form.supervisorSla.acknowledgementMinutes}
                onChange={v => patch('supervisorSla.acknowledgementMinutes', v)}
                hint="Supervisor harus acknowledge eskalasi dalam waktu ini."
              />

              <NumberInput
                id="first-response"
                label="Target Respons Pertama"
                value={form.supervisorSla.firstResponseMinutes}
                onChange={v => patch('supervisorSla.firstResponseMinutes', v)}
                hint="Supervisor harus memberikan respons pertama dalam waktu ini."
              />
            </SettingsCard>
          )}
        </div>

      </div>

      {/* ── Footer hint ──────────────────────────────────────────────────────── */}
      <div className="esc-settings-footer">
        <div className="esc-settings-footer__hint">
          <FontAwesomeIcon icon={faInfoCircle} />
          Pengaturan ini berlaku untuk seluruh workspace. Override per-outlet tersedia di halaman Outlets.
        </div>
      </div>
    </div>
  )
}
