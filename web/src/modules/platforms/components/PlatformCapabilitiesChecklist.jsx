import React from 'react'
import { Check, X, AlertTriangle } from 'lucide-react'

const ICON_SIZE = 14

function CapRow({ label, status, note }) {
  const icon =
    status === 'yes' ? (
      <Check size={ICON_SIZE} style={{ color: 'var(--success-500)', flexShrink: 0 }} />
    ) : status === 'warn' ? (
      <AlertTriangle size={ICON_SIZE} style={{ color: 'var(--warning-500)', flexShrink: 0 }} />
    ) : (
      <X size={ICON_SIZE} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    )

  return (
    <div style={{ display: 'flex', gap: 10, padding: '5px 0', alignItems: 'flex-start' }}>
      <div style={{ marginTop: 2 }}>{icon}</div>
      <div>
        <span
          style={{
            fontSize: 13,
            color: status === 'no' ? 'var(--text-muted)' : 'var(--text-primary)',
          }}
        >
          {label}
        </span>
        {note && (
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{note}</div>
        )}
      </div>
    </div>
  )
}

export default function PlatformCapabilitiesChecklist({ type, webhookConfigured }) {
  const isTelegram = type === 'telegram'
  const connected = !!webhookConfigured

  return (
    <div>
      <CapRow label="Receive messages" status={connected ? 'yes' : 'no'} />
      <CapRow label="Send messages" status={connected ? 'yes' : 'no'} />
      <CapRow
        label="Inline buttons / product browse"
        status={isTelegram && connected ? 'yes' : 'no'}
        note={!isTelegram ? 'Telegram only' : undefined}
      />
      <CapRow
        label="Cart flow"
        status={isTelegram ? 'warn' : 'no'}
        note={isTelegram ? 'Available — commerce backend required' : 'Telegram only'}
      />
      <CapRow
        label="Checkout flow"
        status={isTelegram ? 'warn' : 'no'}
        note={isTelegram ? 'Available — commerce backend required' : 'Telegram only'}
      />
      <CapRow
        label="Payment-link delivery"
        status="warn"
        note="Requires payment gateway"
      />
      <CapRow
        label="Order notifications"
        status="warn"
        note="Requires orders backend"
      />
    </div>
  )
}
