import React from 'react'
import PaymentStatusBadge from './PaymentStatusBadge'
import { Eye, ExternalLink, Copy, Send } from 'lucide-react'

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

function shortId(id) {
  if (!id) return '—'
  return id.length > 10 ? `#${id.slice(-8).toUpperCase()}` : `#${id}`
}

function SkeletonCell({ width }) {
  return (
    <td style={{ padding: '12px 14px' }}>
      <div style={{ height: 14, width, background: 'var(--surface-secondary)', borderRadius: 3 }} />
    </td>
  )
}

function SkeletonRow() {
  return (
    <tr>
      <SkeletonCell width={80} />
      <SkeletonCell width={70} />
      <SkeletonCell width={90} />
      <SkeletonCell width={70} />
      <SkeletonCell width={60} />
      <SkeletonCell width={80} />
      <SkeletonCell width={70} />
      <SkeletonCell width={60} />
      <SkeletonCell width={70} />
      <SkeletonCell width={60} />
    </tr>
  )
}

export default function PaymentsTable({ payments, isLoading, onSelect }) {
  const TH = {
    padding: '10px 14px',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-subtle)',
    whiteSpace: 'nowrap',
  }
  const TD = { padding: '12px 14px', fontSize: 13, color: 'var(--text-primary)', verticalAlign: 'middle' }

  const isPending = (p) => ['pending', 'waiting_payment', 'created'].includes((p.status || '').toLowerCase())

  if (!isLoading && (!payments || payments.length === 0)) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 24px',
        background: 'var(--surface-primary)',
        borderRadius: 10,
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>💳</div>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>
          No payment transactions yet
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Payments will appear after a customer confirms checkout.
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--surface-primary)', borderRadius: 10, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr style={{ background: 'var(--surface-secondary)' }}>
              <th style={TH}>Payment ID</th>
              <th style={TH}>Order</th>
              <th style={TH}>Customer</th>
              <th style={TH}>Outlet</th>
              <th style={TH}>Channel</th>
              <th style={TH}>Provider / Method</th>
              <th style={{ ...TH, textAlign: 'right' }}>Amount</th>
              <th style={TH}>Status</th>
              <th style={TH}>Created</th>
              <th style={{ ...TH, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : payments.map((p) => {
                  const id = p._id || p.id
                  return (
                    <tr
                      key={id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                      onClick={() => onSelect(p)}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '' }}
                    >
                      <td style={TD}>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{shortId(id)}</div>
                        {p.providerRef && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.providerRef}</div>
                        )}
                      </td>
                      <td style={TD}>
                        {p.orderId ? (
                          <div>
                            <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{shortId(p.orderId)}</div>
                            {p.orderStatus && (
                              <span className="badge" style={{ fontSize: 10, marginTop: 2, display: 'inline-block' }}>
                                {p.orderStatus}
                              </span>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={TD}>
                        <div>{p.customerName || p.customer?.name || '—'}</div>
                        {(p.customerPhone || p.customer?.phone) && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {p.customerPhone || p.customer?.phone}
                          </div>
                        )}
                      </td>
                      <td style={TD}>
                        <span style={{ fontSize: 12 }}>{p.outletName || p.outlet?.name || '—'}</span>
                      </td>
                      <td style={TD}>
                        {p.channel ? <span className="badge">{p.channel}</span> : '—'}
                      </td>
                      <td style={TD}>
                        <div style={{ fontSize: 12 }}>{p.provider || '—'}</div>
                        {p.method && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.method}</div>}
                      </td>
                      <td style={{ ...TD, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {formatIDR(p.amount)}
                      </td>
                      <td style={TD}>
                        <PaymentStatusBadge status={p.status} />
                      </td>
                      <td style={{ ...TD, color: 'var(--text-muted)', fontSize: 12 }}>
                        {formatDate(p.createdAt)}
                      </td>
                      <td style={{ ...TD, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button
                            className="btn ghost"
                            title="View details"
                            style={{ padding: '4px 8px' }}
                            onClick={() => onSelect(p)}
                          >
                            <Eye size={13} />
                          </button>
                          {p.orderId && (
                            <button
                              className="btn ghost"
                              title="Open order"
                              style={{ padding: '4px 8px' }}
                              onClick={() => window.open(`/app/orders?id=${p.orderId}`, '_blank')}
                            >
                              <ExternalLink size={13} />
                            </button>
                          )}
                          {p.paymentLink && (
                            <button
                              className="btn ghost"
                              title="Copy payment link"
                              style={{ padding: '4px 8px' }}
                              onClick={() => navigator.clipboard?.writeText(p.paymentLink)}
                            >
                              <Copy size={13} />
                            </button>
                          )}
                          {isPending(p) && (
                            <button
                              className="btn ghost"
                              title="Resend payment link"
                              style={{ padding: '4px 8px' }}
                            >
                              <Send size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
