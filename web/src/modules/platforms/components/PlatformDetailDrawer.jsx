import React, { useState } from 'react'
import { Copy, TestTube, Trash2, RotateCcw } from 'lucide-react'
import DetailDrawer from '../../../shared/components/ui/DetailDrawer'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import { useToast } from '../../../shared/components/feedback/Toast'
import BrandIcon from '../../../shared/components/brand/BrandIcon'
import PlatformCapabilitiesChecklist from './PlatformCapabilitiesChecklist'
import WebhookHealthBadge from './WebhookHealthBadge'
import PlatformStatusBadge from './PlatformStatusBadge'
import api from '../../../shared/api/httpClient'

function Section({ title, children }) {
  return (
    <div
      style={{
        padding: '14px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function DataRow({ label, children, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {children || (
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
            {value || '—'}
          </span>
        )}
      </div>
    </div>
  )
}

function maskId(id) {
  if (!id) return '—'
  const s = String(id)
  if (s.length <= 8) return '••••' + s.slice(-4)
  return s.slice(0, 4) + '•••' + s.slice(-4)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(d) {
  if (!d) return 'Never'
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

export default function PlatformDetailDrawer({
  platform,
  agents = [],
  open,
  onClose,
  onEdit,
  onDelete,
  onSetWebhook,
  onTest,
}) {
  const toast = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [testing, setTesting] = useState(false)
  const [settingWebhook, setSettingWebhook] = useState(false)

  if (!platform) return null

  const pid = platform._id || platform.id
  const isTelegram = platform.type === 'telegram'
  const agent = agents.find((a) => (a._id || a.id) === platform.agentId)
  const connectionStatus =
    platform.token || (platform.credentials && platform.credentials.accessToken)
      ? 'connected'
      : 'pending_setup'
  const webhookHealth = platform.webhookConfigured ? 'healthy' : 'unconfigured'

  const accountId =
    platform.accountId ||
    platform.botId ||
    (platform.credentials &&
      (platform.credentials.phoneNumberId || platform.credentials.pageId)) ||
    null

  const apiBaseUrl = api.defaults.baseURL || window.location.origin
  const webhookPath =
    platform.type === 'whatsapp' || platform.type === 'instagram'
      ? 'meta'
      : platform.type
  const webhookUrl =
    platform.webhookUrl || `${apiBaseUrl}/webhook/${webhookPath}`

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success((label || 'Value') + ' copied!'),
      () => toast.error('Copy failed')
    )
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const result = await onTest(pid)
      if (result && result.data && result.data.supported === false) {
        toast.info('Connection test not supported for this platform type')
      } else {
        toast.success(result.data?.message || 'Connection test passed')
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Test failed'))
    } finally {
      setTesting(false)
    }
  }

  const handleSetWebhook = async () => {
    setSettingWebhook(true)
    try {
      await onSetWebhook(pid)
      toast.success('Webhook configured successfully')
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to set webhook'))
    } finally {
      setSettingWebhook(false)
    }
  }

  const handleConfirmDelete = async () => {
    setConfirmDelete(false)
    await onDelete(pid)
    onClose()
  }

  const titleEl = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        className={`chat-prism-avatar-wrap ${platform.type || 'custom'}`}
        style={{ width: 24, height: 24, marginTop: 0 }}
      >
        <BrandIcon type={platform.type} size={12} color='#ffffff' />
      </div>
      <span>{platform.label || platform.type || 'Platform'}</span>
    </div>
  )

  return (
    <>
      <DetailDrawer
        open={open}
        onClose={onClose}
        title={titleEl}
        subtitle={
          platform.type
            ? platform.type.charAt(0).toUpperCase() + platform.type.slice(1)
            : ''
        }
      >
        <div style={{ padding: '0 24px 24px' }}>
          {/* A. Account Details */}
          <Section title='Account Details'>
            <DataRow label='Platform type' value={platform.type || '—'} />
            <DataRow label='Display label' value={platform.label || '—'} />
            <DataRow label='Account / Bot ID'>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                {maskId(accountId)}
              </span>
              {accountId && (
                <button
                  className='btn ghost'
                  style={{ padding: '1px 5px' }}
                  onClick={() => copyText(String(accountId), 'Account ID')}
                >
                  <Copy size={11} />
                </button>
              )}
            </DataRow>
            <DataRow label='Bot token'>
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  letterSpacing: 2,
                }}
              >
                ••••••••
              </span>
            </DataRow>
            <DataRow
              label='Connected since'
              value={formatDate(platform.createdAt || platform.connectedAt)}
            />
            <DataRow
              label='Last activity'
              value={formatDateTime(
                platform.lastActivity ||
                  platform.lastActivityAt ||
                  platform.updatedAt
              )}
            />
            <DataRow label='Status'>
              <PlatformStatusBadge status={connectionStatus} />
            </DataRow>
          </Section>

          {/* B. Agent Assignment */}
          <Section title='AI Agent Assignment'>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: agent ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {agent ? agent.name : 'No agent assigned'}
              </span>
              {onEdit && (
                <button
                  className='btn ghost'
                  style={{ fontSize: 12, padding: '3px 8px' }}
                  onClick={() => onEdit(platform)}
                >
                  {agent ? 'Change' : 'Assign'}
                </button>
              )}
            </div>
          </Section>

          {/* C. Outlet Routing */}
          <Section title='Outlet Routing'>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Workspace-wide channel — customer selects outlet during commerce
              flow.
            </p>
          </Section>

          {/* D. Webhook Status */}
          <Section title='Webhook Status'>
            <DataRow label='Health'>
              <WebhookHealthBadge health={webhookHealth} />
            </DataRow>
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginBottom: 5,
                }}
              >
                Webhook URL
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--surface-secondary)',
                  borderRadius: 6,
                  padding: '6px 10px',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {webhookUrl}
                </span>
                <button
                  className='btn ghost'
                  style={{ padding: '1px 5px', flexShrink: 0 }}
                  onClick={() => copyText(webhookUrl, 'Webhook URL')}
                >
                  <Copy size={11} />
                </button>
              </div>
              {webhookUrl.includes('localhost') && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--warning-600)',
                    marginTop: 5,
                    lineHeight: 1.4,
                  }}
                >
                  ⚠️ Ganti <strong>localhost:5000</strong> dengan URL Cloudflare
                  Tunnel (misal:{' '}
                  <code>
                    https://frequent-managing-dietary-mud.trycloudflare.com/webhook/
                    {webhookPath}
                  </code>
                  ) saat didaftarkan di portal eksternal.
                </div>
              )}
            </div>
            <DataRow
              label='Verification'
              value={platform.webhookConfigured ? 'Verified' : 'Not verified'}
            />
            <DataRow
              label='Last webhook event'
              value={formatDateTime(platform.lastWebhookAt)}
            />
          </Section>

          {/* E. Commerce Capabilities */}
          <Section title='Commerce Capabilities'>
            <PlatformCapabilitiesChecklist
              type={platform.type}
              webhookConfigured={platform.webhookConfigured}
            />
          </Section>

          {/* Actions */}
          <div
            style={{
              paddingTop: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {isTelegram && (
              <button
                className='btn'
                onClick={handleSetWebhook}
                disabled={settingWebhook}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <RotateCcw size={13} style={{ marginRight: 6 }} />
                {settingWebhook ? 'Setting webhook…' : 'Set / Refresh Webhook'}
              </button>
            )}
            <button
              className='btn ghost'
              onClick={handleTest}
              disabled={testing}
              style={{
                width: '100%',
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <TestTube size={13} style={{ marginRight: 6 }} />
              {testing ? 'Testing…' : 'Test Connection'}
            </button>
            {onEdit && (
              <button
                className='btn ghost'
                onClick={() => onEdit(platform)}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Edit Configuration
              </button>
            )}
            <button
              className='btn ghost'
              onClick={() => setConfirmDelete(true)}
              style={{
                width: '100%',
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--danger-600)',
              }}
            >
              <Trash2 size={13} style={{ marginRight: 6 }} />
              Delete Platform
            </button>
          </div>
        </div>
      </DetailDrawer>

      <ConfirmDialog
        open={confirmDelete}
        title='Delete Platform'
        description={
          'Are you sure you want to delete "' +
          (platform.label || platform.type || 'this platform') +
          '"? This action cannot be undone and will disconnect all associated conversations.'
        }
        variant='danger'
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
