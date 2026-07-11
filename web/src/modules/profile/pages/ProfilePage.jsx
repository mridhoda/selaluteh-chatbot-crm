/**
 * ProfilePage.jsx
 *
 * User profile + notification preferences.
 * Includes a "Preferensi Notifikasi Eskalasi" section where supervisors
 * can choose which channels they receive escalation alerts on.
 *
 * API: PATCH /api/workspaces/:workspaceId/members/me/notification-channels
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faBell,
  faCheckCircle,
  faExclamationTriangle,
  faSave,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'
import {
  faTelegram,
  faWhatsapp,
} from '@fortawesome/free-brands-svg-icons'
import api from '../../../shared/api/httpClient'
import { clearDemoMode } from '../../../mocks/demoState'
import './profile.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSessionUser() {
  try { return JSON.parse(sessionStorage.getItem('user') || 'null') } catch { return null }
}

function getWorkspaceName(user) {
  const name = user?.workspaceName || user?.workspace_name || user?.workspace?.name || user?.name || 'Workspace'
  return String(name)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

const CHANNEL_OPTIONS = [
  {
    key: 'telegram',
    label: 'Telegram',
    desc: 'Terima notifikasi via pesan Telegram langsung ke akun kamu.',
    icon: faTelegram,
    color: '#0088cc',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    desc: 'Terima notifikasi via WhatsApp ke nomor yang terdaftar.',
    icon: faWhatsapp,
    color: '#25d366',
  },
]

// ─── Notification channel preferences ────────────────────────────────────────

function NotificationChannelsSection({ workspaceId }) {
  const [membership, setMembership] = useState(null)
  const [selected, setSelected] = useState(null) // null = all channels
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  // Fetch current membership settings
  useEffect(() => {
    if (!workspaceId) return
    api.get(`/api/workspaces/${workspaceId}/members`)
      .then(res => {
        const user = getSessionUser()
        const me = (res.data?.data || []).find(m => m.userId === user?.id)
        if (me) {
          setMembership(me)
          // null = all channels default
          setSelected(me.notificationChannels ?? null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [workspaceId])

  function toggleChannel(key) {
    setSaved(false)
    setError(null)
    setSelected(prev => {
      // null means all enabled → expand to explicit list minus this key
      const current = prev ?? CHANNEL_OPTIONS.map(c => c.key)
      if (current.includes(key)) {
        const next = current.filter(k => k !== key)
        return next.length === 0 ? null : next // reset to null if nothing left
      }
      const next = [...current, key]
      // if all selected → use null (= all)
      return next.length === CHANNEL_OPTIONS.length ? null : next
    })
  }

  function isEnabled(key) {
    if (selected === null) return true // all channels
    return selected.includes(key)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await api.patch(`/api/workspaces/${workspaceId}/members/me/notification-channels`, {
        channels: selected, // null = all channels
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Gagal menyimpan preferensi.')
    } finally {
      setSaving(false)
    }
  }

  if (!workspaceId || loading) {
    return (
      <div className="profile-section">
        <div className="profile-section__skeleton" style={{ height: 120 }} />
      </div>
    )
  }

  if (!membership) return null // not a workspace member — don't show

  return (
    <div className="profile-section">
      <div className="profile-section__header">
        <div className="profile-section__icon" style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
          <FontAwesomeIcon icon={faBell} />
        </div>
        <div>
          <h3 className="profile-section__title">Preferensi Notifikasi Eskalasi</h3>
          <p className="profile-section__desc">
            Pilih channel yang ingin kamu gunakan untuk menerima notifikasi ketika keluhan dieskalasikan ke kamu sebagai supervisor.
          </p>
        </div>
      </div>

      {error && (
        <div className="profile-alert profile-alert--error">
          <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
        </div>
      )}
      {saved && (
        <div className="profile-alert profile-alert--success">
          <FontAwesomeIcon icon={faCheckCircle} /> Preferensi berhasil disimpan.
        </div>
      )}

      <div className="profile-channel-grid">
        {CHANNEL_OPTIONS.map(ch => {
          const enabled = isEnabled(ch.key)
          return (
            <label
              key={ch.key}
              className={`profile-channel-card ${enabled ? 'profile-channel-card--on' : ''}`}
              style={{ '--ch-color': ch.color }}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => toggleChannel(ch.key)}
                id={`notif-ch-${ch.key}`}
              />
              <div className="profile-channel-card__icon">
                <FontAwesomeIcon icon={ch.icon} />
              </div>
              <div className="profile-channel-card__body">
                <p className="profile-channel-card__label">{ch.label}</p>
                <p className="profile-channel-card__desc">{ch.desc}</p>
              </div>
              <div className={`profile-channel-card__badge ${enabled ? 'on' : 'off'}`}>
                {enabled ? 'Aktif' : 'Nonaktif'}
              </div>
            </label>
          )
        })}
      </div>

      <div className="profile-section__footer">
        <p className="profile-section__hint">
          Web Push selalu aktif — dikontrol langsung oleh izin browser kamu.
        </p>
        <button
          className="profile-save-btn"
          onClick={handleSave}
          disabled={saving}
          id="btn-save-notification-channels"
        >
          <FontAwesomeIcon icon={faSave} />
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = getSessionUser()
  const workspaceId = user?.workspaceId || user?.workspace_id || null
  const workspaceName = getWorkspaceName(user)
  const role = user?.workspaceRole || user?.role

  const handleLogout = () => {
    clearDemoMode()
    sessionStorage.removeItem('token')
    localStorage.removeItem('token')
    sessionStorage.removeItem('user')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="profile-page profile-page--scrollable">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="profile-header">
        <div className="profile-avatar">
          {workspaceName?.[0]?.toUpperCase() || <FontAwesomeIcon icon={faUser} />}
        </div>
        <div>
          <h2 className="profile-header__name">{workspaceName}</h2>
          <p className="profile-header__email">{user?.email || ''}</p>
          {role && (
            <span className="profile-role-badge">{role.replace(/_/g, ' ')}</span>
          )}
        </div>
        <button className="profile-logout-icon" onClick={handleLogout} aria-label="Keluar" title="Keluar">
          <FontAwesomeIcon icon={faRightFromBracket} />
        </button>
      </div>

      {/* ── Notification preferences ────────────────────────────────────────── */}
      <NotificationChannelsSection workspaceId={workspaceId} />
    </div>
  )
}
