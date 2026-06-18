import React, { useEffect, useState } from 'react'
import DetailDrawer from '../../../shared/components/ui/DetailDrawer'
import PaymentStatusBadge from './PaymentStatusBadge'
import PaymentEventTimeline from './PaymentEventTimeline'
import { paymentsApi } from '../api/paymentsApi'
import { Copy, ExternalLink, Send } from 'lucide-react'

function formatIDR(amount) {
  if (!amount && amount !== 0) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}

function maskUrl(url) {
  if (!url) return '—'
  try {
    const u = new URL(url)
    const tail = u.pathname.slice(-14)
    return `${u.origin}/…${tail}`
  } catch { return url.slice(0, 32) + '…' }
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '7px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{
        fontSize: 13,
        color: 'var(--text-primary)',
        fontWeight: 500,
        textAlign: 'right',
        fontFamily: mono ? 'monospace' : undefined,
        wordBreak: mono ? 'break-all' : undefined,
      }}>
        {value}
      </span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-muted)',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottom: '2px solid var(--border-subtle)',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function PaymentDetailDrawer({ payment, open, onClose, onResendLink, onOpenOrder }) {
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open || !payment?._id) {
      setEvents([])
      return
    }
    setEventsLoading(true)
    paymentsApi.getEvents(payment._id)
      .then(res => setEvents(res.data?.events || res.data || []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false))
  }, [open, payment?._id])

  const isPending = ['pending', 'waiting_payment', 'created'].includes((payment?.status || '').toLowerCase())
  const isExpired = payment?.expiresAt && new Date(payment.expiresAt) < new Date()

  const handleCopyLink = () => {
    if (!payment?.paymentLink) return
    navigator.clipboard?.writeText(payment.paymentLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!payment) return null

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title="Payment Detail"
      subtitle={payment._id || payment.id}
    >
      <div style={{ padding: '0 4px' }}>

        {/* A. Payment Summary */}
        <Section title="Payment Summary">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatIDR(payment.amount)}
            </span>
            <PaymentStatusBadge status={payment.status} />
          </div>
          <InfoRow label="Provider" value={payment.provider || '—'} />
          <InfoRow label="Method" value={payment.method || '—'} />
          <InfoRow label="Created" value={formatDate(payment.createdAt)} />
          <InfoRow label="Expires" value={formatDate(payment.expiresAt)} />
          <InfoRow label="Paid at" value={formatDate(payment.paidAt)} />
          <InfoRow label="Provider ref" value={payment.providerRef || '—'} mono />
        </Section>

        {/* B. Customer & Outlet */}
        <Section title="Customer & Outlet">
          <InfoRow label="Customer" value={payment.customerName || payment.customer?.name || '—'} />
          <InfoRow
            label="Contact"
            value={payment.customerPhone || payment.customer?.phone || payment.customer?.email || '—'}
          />
          <InfoRow label="Channel" value={payment.channel || '—'} />
          <InfoRow label="Outlet" value={payment.outletName || payment.outlet?.name || '—'} />
        </Section>

        {/* C. Related Order */}
        {payment.orderId && (
          <Section title="Related Order">
            <InfoRow label="Order ID" value={payment.orderId} mono />
            <InfoRow label="Order status" value={payment.orderStatus || '—'} />
            <InfoRow label="Order total" value={formatIDR(payment.orderTotal)} />
            {payment.itemsCount != null && (
              <InfoRow label="Items" value={payment.itemsCount} />
            )}
            {onOpenOrder && (
              <button
                className="btn ghost"
                style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                onClick={() => onOpenOrder(payment.orderId)}
              >
                <ExternalLink size={13} /> Open Order
              </button>
            )}
          </Section>
        )}

        {/* D. Payment Link */}
        {payment.paymentLink && (
          <Section title="Payment Link">
            <div style={{
              padding: '8px 12px',
              background: 'var(--surface-secondary)',
              borderRadius: 6,
              border: '1px solid var(--border-subtle)',
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'var(--text-muted)',
              marginBottom: 8,
              wordBreak: 'break-all',
            }}>
              {maskUrl(payment.paymentLink)}
            </div>
            {isExpired && (
              <div style={{ fontSize: 12, color: 'var(--danger-500)', marginBottom: 8 }}>
                ⚠ This payment link has expired.
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn ghost"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                onClick={handleCopyLink}
              >
                <Copy size={13} /> {copied ? 'Copied!' : 'Copy Link'}
              </button>
              {isPending && onResendLink && (
                <button
                  className="btn ghost"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                  onClick={() => onResendLink(payment)}
                >
                  <Send size={13} /> Resend Link
                </button>
              )}
            </div>
          </Section>
        )}

        {/* E. Event Timeline */}
        <Section title="Event Timeline">
          <PaymentEventTimeline events={events} isLoading={eventsLoading} />
        </Section>
      </div>
    </DetailDrawer>
  )
}
