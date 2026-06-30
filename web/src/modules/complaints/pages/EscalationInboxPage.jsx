/**
 * EscalationInboxPage.jsx
 * Supervisor inbox for complaint escalations.
 *
 * Features:
 *   - Real-time escalation queue with status/priority filters
 *   - Acknowledge, Complete, Cancel actions
 *   - Internal response panel
 *   - Auto-refresh every 30s
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faExclamationTriangle,
  faCheckCircle,
  faTimes,
  faReply,
  faEye,
  faRefresh,
  faBell,
  faFilter,
  faChevronDown,
  faChevronUp,
  faCircle,
  faUserCheck,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons'
import {
  listEscalations,
  acknowledgeEscalation,
  completeEscalation,
  cancelEscalation,
  addEscalationResponse,
  listEscalationResponses,
} from '../api/escalationApi'
import '../styles/escalation.css'

const STATUS_COLORS = {
  PENDING_ASSIGNMENT: '#f59e0b',
  ASSIGNED: '#3b82f6',
  ACKNOWLEDGED: '#8b5cf6',
  RESPONDED: '#10b981',
  COMPLETED: '#6b7280',
  CANCELLED: '#6b7280',
  FAILED_ROUTING: '#ef4444',
  EXPIRED: '#9ca3af',
}

const PRIORITY_BADGES = {
  critical: { label: 'Critical', color: '#ef4444', bg: '#fef2f2' },
  high: { label: 'High', color: '#f97316', bg: '#fff7ed' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fffbeb' },
  low: { label: 'Low', color: '#6b7280', bg: '#f9fafb' },
}

const TRIGGER_LABELS = {
  AUTO_PRIORITY: 'Prioritas Tinggi',
  AUTO_UNASSIGNED: 'Tidak Ada Penanganan',
  AUTO_SLA: 'SLA Kritis',
  AUTO_CATEGORY: 'Kategori Khusus',
  MANUAL: 'Eskalasi Manual',
  RE_ESCALATION: 'Re-eskalasi',
}

const ACTIVE_STATUSES = ['PENDING_ASSIGNMENT', 'ASSIGNED', 'ACKNOWLEDGED', 'RESPONDED']
const DONE_STATUSES = ['COMPLETED', 'CANCELLED', 'FAILED_ROUTING', 'EXPIRED']

function formatRelativeTime(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} jam lalu`
  return `${Math.floor(hrs / 24)} hari lalu`
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#6b7280'
  const label = status?.replace(/_/g, ' ')
  return (
    <span className="esc-status-badge" style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      <FontAwesomeIcon icon={faCircle} style={{ fontSize: 6 }} />
      {label}
    </span>
  )
}

function PriorityBadge({ priority }) {
  const p = priority?.toLowerCase()
  const badge = PRIORITY_BADGES[p] || PRIORITY_BADGES.medium
  return (
    <span className="esc-priority-badge" style={{ background: badge.bg, color: badge.color }}>
      {badge.label}
    </span>
  )
}

// ─── Response panel ───────────────────────────────────────────────────────────

function ResponsePanel({ escalationId, onClose }) {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listEscalationResponses(escalationId)
      .then(r => setResponses(r.data?.responses || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [escalationId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await addEscalationResponse(escalationId, { responseType: 'TEXT_NOTE', messageText: text.trim() })
      const r = await listEscalationResponses(escalationId)
      setResponses(r.data?.responses || [])
      setText('')
    } catch {
      alert('Gagal mengirim catatan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="esc-response-panel">
      <div className="esc-response-panel__header">
        <span>Catatan Internal</span>
        <button className="esc-icon-btn" onClick={onClose} title="Tutup">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="esc-response-panel__list">
        {loading && <div className="esc-empty-small">Memuat…</div>}
        {!loading && responses.length === 0 && (
          <div className="esc-empty-small">Belum ada catatan.</div>
        )}
        {responses.map(r => (
          <div key={r.id} className="esc-response-item">
            <div className="esc-response-item__meta">
              <span className="esc-response-item__type">{r.responseType?.replace(/_/g, ' ')}</span>
              <span className="esc-response-item__time">{formatRelativeTime(r.createdAt || r.created_at)}</span>
            </div>
            <p className="esc-response-item__text">{r.messageText || r.message_text || '—'}</p>
          </div>
        ))}
      </div>
      <form className="esc-response-panel__form" onSubmit={handleSubmit}>
        <textarea
          className="esc-response-textarea"
          rows={3}
          placeholder="Tulis catatan internal supervisor…"
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={submitting}
        />
        <button className="esc-btn esc-btn--primary" type="submit" disabled={submitting || !text.trim()}>
          <FontAwesomeIcon icon={faReply} /> Kirim Catatan
        </button>
      </form>
    </div>
  )
}

// ─── Escalation card ──────────────────────────────────────────────────────────

function EscalationCard({ esc, onAction, activePanelId, setActivePanelId }) {
  const [actioning, setActioning] = useState(null)

  const isResponseOpen = activePanelId === esc.id

  async function doAction(action) {
    if (action === 'response') {
      setActivePanelId(isResponseOpen ? null : esc.id)
      return
    }
    if (action === 'cancel' && !window.confirm('Batalkan eskalasi ini?')) return
    setActioning(action)
    try {
      if (action === 'acknowledge') await acknowledgeEscalation(esc.id)
      if (action === 'complete') await completeEscalation(esc.id, { reason: 'Diselesaikan oleh supervisor' })
      if (action === 'cancel') await cancelEscalation(esc.id, { reason: 'Dibatalkan oleh supervisor' })
      onAction()
    } catch (err) {
      alert(err?.response?.data?.error?.message || 'Gagal memproses aksi.')
    } finally {
      setActioning(null)
    }
  }

  const isDone = DONE_STATUSES.includes(esc.status)
  const needsAck = esc.status === 'PENDING_ASSIGNMENT' || esc.status === 'ASSIGNED'

  return (
    <div className={`esc-card ${isDone ? 'esc-card--done' : ''}`}>
      <div className="esc-card__header">
        <div className="esc-card__badges">
          <StatusBadge status={esc.status} />
          <PriorityBadge priority={esc.priority || esc.complaint?.priority} />
          {esc.triggerType && (
            <span className="esc-trigger-badge">
              {TRIGGER_LABELS[esc.triggerType] || esc.triggerType}
            </span>
          )}
        </div>
        <span className="esc-card__time">{formatRelativeTime(esc.createdAt || esc.created_at)}</span>
      </div>

      <div className="esc-card__body">
        <p className="esc-card__subject">
          {esc.complaint?.subject || esc.subject || 'Keluhan pelanggan'}
        </p>
        <div className="esc-card__meta">
          {esc.outletId && <span className="esc-meta-chip">Outlet: {esc.outletId.slice(0, 8)}…</span>}
          <span className="esc-meta-chip">ID: {esc.id?.slice(0, 8)}…</span>
        </div>
      </div>

      {!isDone && (
        <div className="esc-card__actions">
          {needsAck && (
            <button
              className="esc-btn esc-btn--acknowledge"
              disabled={!!actioning}
              onClick={() => doAction('acknowledge')}
            >
              <FontAwesomeIcon icon={faUserCheck} />
              {actioning === 'acknowledge' ? 'Memproses…' : 'Acknowledge'}
            </button>
          )}
          <button
            className="esc-btn esc-btn--response"
            disabled={!!actioning}
            onClick={() => doAction('response')}
          >
            <FontAwesomeIcon icon={faReply} />
            Catatan
          </button>
          {!needsAck && (
            <button
              className="esc-btn esc-btn--complete"
              disabled={!!actioning}
              onClick={() => doAction('complete')}
            >
              <FontAwesomeIcon icon={faCheckCircle} />
              {actioning === 'complete' ? 'Memproses…' : 'Selesai'}
            </button>
          )}
          <button
            className="esc-btn esc-btn--cancel"
            disabled={!!actioning}
            onClick={() => doAction('cancel')}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <a
            className="esc-btn esc-btn--link"
            href={`/app/complaints?escalation=${esc.id}`}
            target="_blank"
            rel="noreferrer"
            title="Buka keluhan"
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} />
          </a>
        </div>
      )}

      {isResponseOpen && (
        <ResponsePanel escalationId={esc.id} onClose={() => setActivePanelId(null)} />
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EscalationInboxPage() {
  const [escalations, setEscalations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('active')
  const [showDone, setShowDone] = useState(false)
  const [activePanelId, setActivePanelId] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchEscalations = useCallback(async () => {
    try {
      const params = {}
      if (statusFilter !== 'all') {
        params.status = statusFilter === 'active' ? undefined : statusFilter
      }
      const res = await listEscalations(params)
      setEscalations(res.data?.escalations || res.data?.data || [])
      setLastRefresh(new Date())
      setError(null)
    } catch (err) {
      setError('Gagal memuat data eskalasi.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    setLoading(true)
    fetchEscalations()
  }, [fetchEscalations])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchEscalations, 30000)
    return () => clearInterval(interval)
  }, [fetchEscalations])

  const { active, done } = useMemo(() => {
    const active = escalations.filter(e => ACTIVE_STATUSES.includes(e.status))
    const done = escalations.filter(e => DONE_STATUSES.includes(e.status))
    return { active, done }
  }, [escalations])

  return (
    <div className="escalation-inbox-page">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="esc-inbox-header">
        <div className="esc-inbox-header__left">
          <div className="esc-inbox-header__icon">
            <FontAwesomeIcon icon={faBell} />
          </div>
          <div>
            <h2 className="esc-inbox-header__title">Eskalasi Keluhan</h2>
            <p className="esc-inbox-header__subtitle">
              Antrian supervisor — {active.length} aktif
              {lastRefresh && (
                <span className="esc-refresh-hint">
                  {' '}· Diperbarui {formatRelativeTime(lastRefresh)}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="esc-inbox-header__actions">
          <a href="/app/complaints/escalation-settings" className="esc-btn esc-btn--ghost">
            <FontAwesomeIcon icon={faFilter} /> Pengaturan
          </a>
          <button className="esc-btn esc-btn--ghost" onClick={fetchEscalations} disabled={loading}>
            <FontAwesomeIcon icon={faRefresh} spin={loading} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="esc-error-banner">
          <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
        </div>
      )}

      {/* ── Active escalations ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="esc-skeleton-list">
          {[1, 2, 3].map(i => <div key={i} className="esc-skeleton-card" />)}
        </div>
      ) : active.length === 0 ? (
        <div className="esc-empty-state">
          <FontAwesomeIcon icon={faCheckCircle} className="esc-empty-icon" />
          <p>Tidak ada eskalasi aktif. 🎉</p>
          <span>Semua keluhan tertangani dengan baik.</span>
        </div>
      ) : (
        <div className="esc-card-grid">
          {active.map(esc => (
            <EscalationCard
              key={esc.id}
              esc={esc}
              onAction={fetchEscalations}
              activePanelId={activePanelId}
              setActivePanelId={setActivePanelId}
            />
          ))}
        </div>
      )}

      {/* ── Done escalations ───────────────────────────────────────────────── */}
      {done.length > 0 && (
        <div className="esc-done-section">
          <button
            className="esc-done-toggle"
            onClick={() => setShowDone(v => !v)}
          >
            <FontAwesomeIcon icon={showDone ? faChevronUp : faChevronDown} />
            Selesai / Dibatalkan ({done.length})
          </button>
          {showDone && (
            <div className="esc-card-grid esc-card-grid--done">
              {done.map(esc => (
                <EscalationCard
                  key={esc.id}
                  esc={esc}
                  onAction={fetchEscalations}
                  activePanelId={activePanelId}
                  setActivePanelId={setActivePanelId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
