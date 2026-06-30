import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  RefreshCw,
  Search,
  Eye,
  Trash2,
  Settings,
  TestTube,
  RotateCcw,
  Layers,
  Activity,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react'
import PageHeader from '../../../shared/components/ui/PageHeader'
import EmptyState from '../../../shared/components/ui/EmptyState'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import { useToast } from '../../../shared/components/feedback/Toast'
import BrandIcon from '../../../shared/components/brand/BrandIcon'
import api from '../../../shared/api/httpClient'
import { platformsApi } from '../api/platformsApi'
import PlatformStatusBadge from '../components/PlatformStatusBadge'
import WebhookHealthBadge from '../components/WebhookHealthBadge'
import PlatformDetailDrawer from '../components/PlatformDetailDrawer'

// ─── helpers ───────────────────────────────────────────────────────────────

const PLATFORM_TYPES = [
  {
    type: 'telegram',
    label: 'Telegram',
    description: 'Bot-based messaging with inline buttons and cart flow',
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    description: 'Meta Business API — requires a verified business number',
  },
  {
    type: 'instagram',
    label: 'Instagram',
    description: 'Meta Business API — requires a connected Instagram account',
  },
]

function getConnectionStatus(platform) {
  if (platform.type === 'telegram') {
    return platform.token ? 'connected' : 'pending_setup'
  }
  return platform.credentials && platform.credentials.accessToken
    ? 'connected'
    : 'pending_setup'
}

function getWebhookHealth(platform) {
  return platform.webhookConfigured ? 'healthy' : 'not_configured'
}

function getAccountId(platform) {
  return (
    platform.accountId ||
    platform.botId ||
    (platform.credentials &&
      (platform.credentials.phoneNumberId || platform.credentials.pageId)) ||
    null
  )
}

function maskAccountId(id) {
  if (!id) return '—'
  const s = String(id)
  if (s.length <= 8) return '••' + s.slice(-4)
  return s.slice(0, 3) + '•••' + s.slice(-4)
}

function formatRelativeDate(d) {
  if (!d) return '—'
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return mins + 'm ago'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 30) return days + 'd ago'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getApiErrorMessage(e, fallback = 'Request failed') {
  const data = e?.response?.data
  const detail = data?.detail
  const detailMessage =
    detail?.description ||
    detail?.message ||
    detail?.error ||
    (typeof detail === 'string' ? detail : '')

  return (
    data?.error?.message ||
    data?.message ||
    data?.error ||
    detailMessage ||
    e?.message ||
    fallback
  )
}

// ─── sub-components ────────────────────────────────────────────────────────

function SummaryCard({ label, value, color, icon: Icon }) {
  return (
    <div
      className='card'
      style={{
        padding: '20px 24px',
        flex: 1,
        minWidth: 0,
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        boxShadow: '0 4px 20px -2px rgba(17, 24, 46, 0.02), 0 2px 6px -1px rgba(17, 24, 46, 0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(17, 24, 46, 0.04), 0 8px 16px -6px rgba(17, 24, 46, 0.04)'
        e.currentTarget.style.borderColor = color || 'var(--border-strong)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(17, 24, 46, 0.02), 0 2px 6px -1px rgba(17, 24, 46, 0.02)'
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: color || 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
      </div>
      {Icon && (
        <div
          style={{
            padding: 10,
            borderRadius: 12,
            background: color ? `${color}15` : 'var(--surface-secondary)',
            color: color || 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} />
        </div>
      )}
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  )
}

function PlatformForm({ type, initialData = {}, onSubmit, onCancel, saving }) {
  const isEdit = !!(initialData._id || initialData.id)
  const [form, setForm] = useState({
    label: initialData.label || '',
    token: '',
    phoneNumberId:
      (initialData.credentials && initialData.credentials.phoneNumberId) || '',
    accessToken: '',
    webhookVerifyToken:
      (initialData.credentials && initialData.credentials.webhookVerifyToken) ||
      '',
    pageId: (initialData.credentials && initialData.credentials.pageId) || '',
    agentId: initialData.agentId || '',
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const typeName = type.charAt(0).toUpperCase() + type.slice(1)
    if (type === 'telegram') {
      const payload = { label: form.label, type: 'telegram' }
      if (form.token) payload.token = form.token
      onSubmit(payload)
    } else if (type === 'whatsapp') {
      onSubmit({
        label: form.label,
        type: 'whatsapp',
        credentials: {
          phoneNumberId: form.phoneNumberId,
          ...(form.accessToken ? { accessToken: form.accessToken } : {}),
          webhookVerifyToken: form.webhookVerifyToken,
        },
      })
    } else if (type === 'instagram') {
      onSubmit({
        label: form.label,
        type: 'instagram',
        credentials: {
          pageId: form.pageId,
          ...(form.accessToken ? { accessToken: form.accessToken } : {}),
          webhookVerifyToken: form.webhookVerifyToken,
        },
      })
    }
  }

  const isMeta = type === 'whatsapp' || type === 'instagram'

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <FieldLabel>Display Label *</FieldLabel>
          <input
            className='input'
            required
            placeholder={
              'My ' + type.charAt(0).toUpperCase() + type.slice(1) + ' Bot'
            }
            value={form.label}
            onChange={(e) => set('label', e.target.value)}
          />
        </div>

        {type === 'telegram' && (
          <div>
            <FieldLabel>
              Bot Token{isEdit ? ' — leave blank to keep existing' : ' *'}
            </FieldLabel>
            <input
              className='input'
              type='password'
              required={!isEdit}
              placeholder={
                isEdit
                  ? '••••••••  (unchanged)'
                  : '110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw'
              }
              value={form.token}
              onChange={(e) => set('token', e.target.value)}
              autoComplete='new-password'
            />
            <div
              style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}
            >
              Get your token from @BotFather on Telegram. It will never be shown
              again.
            </div>
          </div>
        )}

        {isMeta && type === 'whatsapp' && (
          <div>
            <FieldLabel>Phone Number ID *</FieldLabel>
            <input
              className='input'
              required
              placeholder='1234567890'
              value={form.phoneNumberId}
              onChange={(e) => set('phoneNumberId', e.target.value)}
            />
          </div>
        )}

        {isMeta && type === 'instagram' && (
          <div>
            <FieldLabel>Page ID *</FieldLabel>
            <input
              className='input'
              required
              placeholder='123456789'
              value={form.pageId}
              onChange={(e) => set('pageId', e.target.value)}
            />
          </div>
        )}

        {isMeta && (
          <>
            <div>
              <FieldLabel>
                Access Token{isEdit ? ' — leave blank to keep existing' : ' *'}
              </FieldLabel>
              <input
                className='input'
                type='password'
                required={!isEdit}
                placeholder={
                  isEdit ? '••••••••  (unchanged)' : 'EAABwzLixnjYBAO…'
                }
                value={form.accessToken}
                onChange={(e) => set('accessToken', e.target.value)}
                autoComplete='new-password'
              />
            </div>
            <div>
              <FieldLabel>Webhook Verify Token</FieldLabel>
              <input
                className='input'
                placeholder='my_verify_token'
                value={form.webhookVerifyToken}
                onChange={(e) => set('webhookVerifyToken', e.target.value)}
              />
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 5,
                }}
              >
                Set this same value in your Meta App webhook configuration.
              </div>
            </div>
          </>
        )}

        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            paddingTop: 4,
          }}
        >
          <button
            type='button'
            className='btn ghost'
            onClick={onCancel}
            disabled={saving}
          >
            {isEdit ? 'Cancel' : 'Back'}
          </button>
          <button type='submit' className='btn' disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Connect Platform'}
          </button>
        </div>
      </div>
    </form>
  )
}

// ─── page ──────────────────────────────────────────────────────────────────

export default function PlatformsPage() {
  const toast = useToast()

  const [platforms, setPlatforms] = useState([])
  const [agents, setAgents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  // connect / edit modal
  const [connectOpen, setConnectOpen] = useState(false)
  const [connectStep, setConnectStep] = useState(1)
  const [selectedType, setSelectedType] = useState(null)
  const [editPlatform, setEditPlatform] = useState(null)
  const [saving, setSaving] = useState(false)

  // detail drawer
  const [drawerPlatform, setDrawerPlatform] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // confirm delete
  const [confirmDelete, setConfirmDelete] = useState(null)

  // agent assign modal
  const [agentAssignPlatform, setAgentAssignPlatform] = useState(null)

  // ── data fetching ────────────────────────────────────────────────────────

  const fetchPlatforms = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await platformsApi.list()
      setPlatforms(res.data || [])
    } catch (e) {
      setError(
        (e && e.response && e.response.data && e.response.data.message) ||
          (e && e.message) ||
          'Failed to load platforms'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      // agents endpoint is optional — fail silently
      const res = await api.get('/agents', { skipAuthRedirect: true })
      const d = res.data
      setAgents(Array.isArray(d) ? d : d.data || [])
    } catch {
      // no-op
    }
  }, [])

  useEffect(() => {
    fetchPlatforms()
    fetchAgents()
  }, [fetchPlatforms, fetchAgents])

  // ── derived stats ────────────────────────────────────────────────────────

  const connectedCount = platforms.filter(
    (p) => getConnectionStatus(p) === 'connected'
  ).length
  const needsAttentionCount = platforms.filter(
    (p) => getConnectionStatus(p) !== 'connected' || !p.webhookConfigured
  ).length

  // ── modal helpers ────────────────────────────────────────────────────────

  const openConnect = () => {
    setEditPlatform(null)
    setSelectedType(null)
    setConnectStep(1)
    setConnectOpen(true)
  }

  const openEdit = (platform) => {
    setEditPlatform(platform)
    setSelectedType(platform.type)
    setConnectStep(2)
    setConnectOpen(true)
    setDrawerOpen(false)
  }

  const closeConnect = () => {
    setConnectOpen(false)
    setEditPlatform(null)
    setSelectedType(null)
    setConnectStep(1)
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (payload) => {
    setSaving(true)
    try {
      if (editPlatform) {
        const pid = editPlatform._id || editPlatform.id
        await platformsApi.update(pid, payload)
        toast.success('Platform updated')
      } else {
        const res = await platformsApi.create(payload)
        const created = res.data
        toast.success('Platform connected')
        if (payload.type === 'telegram' && created) {
          const pid = created._id || created.id
          try {
            await platformsApi.setTelegramWebhook(pid)
            toast.success('Telegram webhook configured automatically')
          } catch (webhookErr) {
            toast.error(
              'Platform connected, but webhook setup failed: ' +
                getApiErrorMessage(webhookErr, 'unknown error')
            )
          }
        }
      }
      await fetchPlatforms()
      closeConnect()
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (pid) => {
    try {
      await platformsApi.delete(pid)
      toast.success('Platform deleted')
      setPlatforms((prev) => prev.filter((p) => (p._id || p.id) !== pid))
      if (
        drawerOpen &&
        drawerPlatform &&
        (drawerPlatform._id || drawerPlatform.id) === pid
      ) {
        setDrawerOpen(false)
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Delete failed'))
    } finally {
      setConfirmDelete(null)
    }
  }

  const handleSetWebhook = async (pid) => {
    await platformsApi.setTelegramWebhook(pid)
    await fetchPlatforms()
  }

  const handleTest = async (pid) => {
    return platformsApi.test(pid)
  }

  // ── filtering ────────────────────────────────────────────────────────────

  const filtered = platforms.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (p.label || '').toLowerCase().includes(q) ||
      (p.type || '').toLowerCase().includes(q) ||
      String(getAccountId(p) || '')
        .toLowerCase()
        .includes(q)
    )
  })

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <PageHeader
        title='Connected Platforms'
        subtitle='Connect and monitor the channels used by your customers'
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className='btn ghost'
              onClick={fetchPlatforms}
              disabled={isLoading}
            >
              <RefreshCw
                size={13}
                style={{
                  marginRight: 5,
                  animation: isLoading ? 'spin 0.8s linear infinite' : 'none',
                }}
              />
              Refresh
            </button>
            <button className='btn' onClick={openConnect}>
              <Plus size={13} style={{ marginRight: 5 }} />
              Connect Platform
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      {!isLoading && platforms.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <SummaryCard label='Connected Channels' value={platforms.length} icon={Layers} />
          <SummaryCard
            label='Active'
            value={connectedCount}
            color='var(--success-600)'
            icon={Activity}
          />
          <SummaryCard
            label='Needs Attention'
            value={needsAttentionCount}
            color={
              needsAttentionCount > 0
                ? 'var(--warning-500)'
                : 'var(--text-primary)'
            }
            icon={AlertTriangle}
          />
          <SummaryCard label='Messages Today' value='—' icon={MessageCircle} />
        </div>
      )}

      {/* Search bar */}
      {!isLoading && platforms.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 300 }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              className='input'
              placeholder='Search platforms…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 60,
            color: 'var(--text-muted)',
            gap: 10,
          }}
        >
          <RefreshCw
            size={18}
            style={{ animation: 'spin 0.8s linear infinite' }}
          />
          Loading platforms…
        </div>
      ) : error ? (
        <div
          style={{
            padding: 24,
            background: 'var(--danger-50)',
            borderRadius: 10,
            color: 'var(--danger-600)',
            textAlign: 'center',
          }}
        >
          {error}
          <button
            className='btn ghost'
            style={{ marginLeft: 12 }}
            onClick={fetchPlatforms}
          >
            Retry
          </button>
        </div>
      ) : platforms.length === 0 ? (
        <EmptyState
          title='No channels connected'
          description='Connect Telegram to start receiving marketplace conversations'
          action={
            <button className='btn' onClick={openConnect}>
              <Plus size={13} style={{ marginRight: 5 }} />
              Connect Telegram
            </button>
          }
        />
      ) : (
        <div
          className='card'
          style={{
            overflow: 'hidden',
            padding: 0,
            borderRadius: 16,
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px -2px rgba(17, 24, 46, 0.02), 0 2px 6px -1px rgba(17, 24, 46, 0.02)',
            background: 'var(--surface-primary)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  background: 'var(--surface-secondary)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {[
                  'Platform',
                  'Connection Status',
                  'AI Agent',
                  'Last Activity',
                  'Webhook Health',
                  'Actions',
                ].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '14px 20px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                    }}
                  >
                    No platforms match your search
                  </td>
                </tr>
              ) : (
                filtered.map((platform, i) => {
                  const pid = platform._id || platform.id
                  const status = getConnectionStatus(platform)
                  const webhookHealth = getWebhookHealth(platform)
                  const agent = agents.find(
                    (a) => (a._id || a.id) === platform.agentId
                  )
                  const accountDisplay = maskAccountId(getAccountId(platform))
                  const isLast = i === filtered.length - 1

                  return (
                    <tr
                      key={pid || i}
                      style={{
                        borderBottom: isLast
                          ? 'none'
                          : '1px solid var(--border-subtle)',
                        transition: 'background 0.15s ease',
                        cursor: 'default',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'var(--surface-hover)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      {/* Platform */}
                      <td style={{ padding: '16px 20px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <div
                            className={`chat-prism-avatar-wrap ${platform.type || 'custom'}`}
                            style={{
                              width: 32,
                              height: 32,
                              marginTop: 0,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px -2px rgba(0,0,0,0.1)',
                            }}
                          >
                            <BrandIcon
                              type={platform.type}
                              size={16}
                              color='#ffffff'
                            />
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginBottom: 2,
                              }}
                            >
                              {platform.label || platform.type}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {accountDisplay}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Connection Status */}
                      <td style={{ padding: '16px 20px' }}>
                        <PlatformStatusBadge status={status} />
                      </td>
                      {/* AI Agent */}
                      <td style={{ padding: '16px 20px' }}>
                        {agent ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 10px',
                              borderRadius: 8,
                              background: 'var(--ai-50)',
                              color: 'var(--ai-600)',
                              fontSize: 12,
                              fontWeight: 550,
                              border: '1px solid var(--ai-100)',
                            }}
                          >
                            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--ai-500)' }}></span>
                            {agent.name}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No agent assigned
                          </span>
                        )}
                      </td>
                      {/* Last Activity */}
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {formatRelativeDate(
                            platform.lastActivity ||
                              platform.lastActivityAt ||
                              platform.updatedAt
                          )}
                        </span>
                      </td>
                      {/* Webhook Health */}
                      <td style={{ padding: '16px 20px' }}>
                        <WebhookHealthBadge health={webhookHealth} />
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className='btn ghost'
                            style={{
                              padding: '6px',
                              borderRadius: 8,
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--surface-primary)',
                              boxShadow: '0 1px 2px rgba(17, 24, 46, 0.02)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title='View details'
                            onClick={() => {
                              setDrawerPlatform(platform)
                              setDrawerOpen(true)
                            }}
                          >
                            <Eye size={14} style={{ color: 'var(--text-secondary)' }} />
                          </button>
                          <button
                            className='btn ghost'
                            style={{
                              padding: '6px',
                              borderRadius: 8,
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--surface-primary)',
                              boxShadow: '0 1px 2px rgba(17, 24, 46, 0.02)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title='Edit'
                            onClick={() => openEdit(platform)}
                          >
                            <Settings size={14} style={{ color: 'var(--text-secondary)' }} />
                          </button>
                          <button
                            className='btn ghost'
                            style={{
                              padding: '6px',
                              borderRadius: 8,
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--surface-primary)',
                              boxShadow: '0 1px 2px rgba(17, 24, 46, 0.02)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title='Delete'
                            onClick={() => setConfirmDelete(platform)}
                          >
                            <Trash2 size={14} style={{ color: 'var(--danger-500)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Connect / Edit Modal ─────────────────────────────────────────── */}
      {connectOpen && (
        <div
          className='modal'
          style={{ zIndex: 1000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConnect()
          }}
        >
          <div className='modal-card' style={{ maxWidth: 520, width: '100%' }}>
            {/* modal header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {editPlatform
                  ? 'Edit Platform'
                  : connectStep === 1
                    ? 'Select Platform Type'
                    : 'Connect ' +
                      (selectedType
                        ? selectedType.charAt(0).toUpperCase() +
                          selectedType.slice(1)
                        : '')}
              </h3>
              <button
                className='btn ghost'
                style={{ padding: '2px 8px', fontSize: 18, lineHeight: 1 }}
                onClick={closeConnect}
              >
                ×
              </button>
            </div>

            {/* modal body */}
            <div style={{ padding: 24 }}>
              {connectStep === 1 ? (
                /* Step 1 — type picker */
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {PLATFORM_TYPES.map(({ type, label, description }) => (
                    <button
                      key={type}
                      className='btn ghost'
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '12px 16px',
                        textAlign: 'left',
                        width: '100%',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 10,
                      }}
                      onClick={() => {
                        setSelectedType(type)
                        setConnectStep(2)
                      }}
                    >
                      <div
                        className={`chat-prism-avatar-wrap ${type || 'custom'}`}
                        style={{ width: 32, height: 32, marginTop: 0 }}
                      >
                        <BrandIcon type={type} size={16} color='#ffffff' />
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {label}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            marginTop: 2,
                          }}
                        >
                          {description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* Step 2 — form */
                <PlatformForm
                  type={selectedType}
                  initialData={editPlatform || {}}
                  onSubmit={handleSubmit}
                  onCancel={
                    editPlatform ? closeConnect : () => setConnectStep(1)
                  }
                  saving={saving}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ────────────────────────────────────────────────── */}
      <PlatformDetailDrawer
        platform={drawerPlatform}
        agents={agents}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={openEdit}
        onDelete={handleDelete}
        onSetWebhook={handleSetWebhook}
        onTest={handleTest}
        onAssignAgent={(p) => setAgentAssignPlatform(p)}
      />

      {/* ── Assign Agent Modal ───────────────────────────────────────────── */}
      {agentAssignPlatform && (
        <div
          className='modal'
          style={{ zIndex: 1010 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAgentAssignPlatform(null)
          }}
        >
          <div className='modal-card' style={{ maxWidth: 440, width: '100%' }}>
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                Assign AI Agent
              </h3>
              <button
                className='btn ghost'
                style={{ padding: '2px 8px', fontSize: 18, lineHeight: 1 }}
                onClick={() => setAgentAssignPlatform(null)}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Choose which AI agent should handle messages for <strong>{agentAssignPlatform.label}</strong>:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {/* Option: No Agent */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: !agentAssignPlatform.agentId ? 'var(--surface-hover)' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type='radio'
                    name='selectedAgent'
                    checked={!agentAssignPlatform.agentId}
                    onChange={() => setAgentAssignPlatform(prev => ({ ...prev, agentId: null }))}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>No Agent</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Disable AI chatbot responses on this platform</div>
                  </div>
                </label>

                {/* Option: Agents List */}
                {agents.map((ag) => {
                  const isSelected = agentAssignPlatform.agentId === (ag._id || ag.id)
                  return (
                    <label
                      key={ag._id || ag.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: isSelected ? 'var(--surface-hover)' : 'transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type='radio'
                        name='selectedAgent'
                        checked={isSelected}
                        onChange={() => setAgentAssignPlatform(prev => ({ ...prev, agentId: (ag._id || ag.id) }))}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ag.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ag.welcome_message || 'AI assistant'}</div>
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type='button'
                  className='btn ghost'
                  onClick={() => setAgentAssignPlatform(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className='btn'
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true)
                    try {
                      const pid = agentAssignPlatform._id || agentAssignPlatform.id
                      await platformsApi.update(pid, { agentId: agentAssignPlatform.agentId })
                      toast.success('AI Agent assignment updated successfully')
                      await fetchPlatforms()
                      setAgentAssignPlatform(null)
                      if (drawerPlatform && (drawerPlatform._id || drawerPlatform.id) === pid) {
                        setDrawerPlatform(prev => ({ ...prev, agentId: agentAssignPlatform.agentId }))
                      }
                    } catch (err) {
                      toast.error(getApiErrorMessage(err, 'Failed to assign agent'))
                    } finally {
                      setSaving(false)
                    }
                  }}
                >
                  {saving ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ───────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmDelete}
        title='Delete Platform'
        description={
          'Are you sure you want to delete "' +
          (confirmDelete
            ? confirmDelete.label || confirmDelete.type || 'this platform'
            : '') +
          '"? This cannot be undone.'
        }
        variant='danger'
        onConfirm={() =>
          confirmDelete && handleDelete(confirmDelete._id || confirmDelete.id)
        }
        onCancel={() => setConfirmDelete(null)}
      />

      {/* spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
