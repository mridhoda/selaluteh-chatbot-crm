import React from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

const EVENT_LABELS = {
  payment_created: 'Payment created',
  link_generated: 'Payment link generated',
  webhook_received: 'Webhook received',
  signature_verified: 'Signature verified',
  provider_status_mapped: 'Provider status mapped',
  order_marked_paid: 'Order marked as paid',
  notification_sent: 'Notification sent',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch { return dateStr }
}

function SkeletonEvent({ isLast }) {
  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-secondary)', flexShrink: 0 }} />
        {!isLast && <div style={{ width: 2, flex: 1, background: 'var(--border-subtle)', marginTop: 4 }} />}
      </div>
      <div style={{ flex: 1, paddingTop: 4 }}>
        <div style={{ height: 12, width: 140, background: 'var(--surface-secondary)', borderRadius: 3, marginBottom: 8 }} />
        <div style={{ height: 10, width: 100, background: 'var(--surface-secondary)', borderRadius: 3 }} />
      </div>
    </div>
  )
}

export default function PaymentEventTimeline({ events, isLoading }) {
  if (isLoading) {
    return (
      <div style={{ padding: '8px 0' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonEvent key={i} isLast={i === 3} />
        ))}
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
        No events recorded yet.
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1
        const success = event.result !== 'fail' && event.result !== 'error'
        return (
          <div key={event._id || idx} style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: success ? 'var(--success-50)' : 'var(--danger-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {success
                  ? <CheckCircle size={14} style={{ color: 'var(--success-600)' }} />
                  : <XCircle size={14} style={{ color: 'var(--danger-500)' }} />}
              </div>
              {!isLast && <div style={{ width: 2, flex: 1, background: 'var(--border-subtle)', marginTop: 4 }} />}
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>
                {EVENT_LABELS[event.type] || event.type || 'Unknown event'}
              </div>
              {event.providerEventId && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                  ref: {event.providerEventId}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {formatDate(event.timestamp || event.createdAt)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
