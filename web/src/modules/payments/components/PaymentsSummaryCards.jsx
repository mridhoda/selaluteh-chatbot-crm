import React, { useMemo } from 'react'
import { Banknote, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

function formatIDR(amount) {
  if (!amount && amount !== 0) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

function SummaryCard({ icon: Icon, label, value, color, isLoading }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 140, padding: '16px 18px' }}>
      {isLoading ? (
        <>
          <div style={{ width: 80, height: 12, borderRadius: 4, background: 'var(--surface-secondary)', marginBottom: 12 }} />
          <div style={{ width: 100, height: 22, borderRadius: 4, background: 'var(--surface-secondary)' }} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Icon size={14} style={{ color }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
        </>
      )}
    </div>
  )
}

export default function PaymentsSummaryCards({ payments, isLoading }) {
  const stats = useMemo(() => {
    if (!payments?.length) return { totalCollected: 0, pending: 0, paid: 0, failed: 0, needsAttention: 0 }
    return payments.reduce((acc, p) => {
      const s = (p.status || '').toLowerCase()
      if (['paid', 'settled', 'capture', 'success'].includes(s)) {
        acc.totalCollected += p.amount || 0
        acc.paid++
      } else if (['pending', 'waiting_payment', 'created'].includes(s)) {
        acc.pending++
      } else if (['failed', 'expired', 'cancelled', 'cancel', 'deny', 'failure'].includes(s)) {
        acc.failed++
      }
      if (p.amountMismatch || p.requiresAttention) acc.needsAttention++
      return acc
    }, { totalCollected: 0, pending: 0, paid: 0, failed: 0, needsAttention: 0 })
  }, [payments])

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
      <SummaryCard icon={Banknote} label="Total Collected" value={formatIDR(stats.totalCollected)} color="var(--success-600)" isLoading={isLoading} />
      <SummaryCard icon={Clock} label="Pending" value={stats.pending} color="var(--warning-500)" isLoading={isLoading} />
      <SummaryCard icon={CheckCircle2} label="Paid Transactions" value={stats.paid} color="var(--success-600)" isLoading={isLoading} />
      <SummaryCard icon={XCircle} label="Failed / Expired" value={stats.failed} color="var(--danger-500)" isLoading={isLoading} />
      <SummaryCard icon={AlertTriangle} label="Needs Attention" value={stats.needsAttention} color="var(--warning-500)" isLoading={isLoading} />
    </div>
  )
}
