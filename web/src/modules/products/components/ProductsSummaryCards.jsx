import React, { useMemo } from 'react'

function SummaryCard({ label, value, description, isLoading, accentColor }) {
  return (
    <div
      style={{
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: '16px 20px',
        flex: '1 1 160px',
        minWidth: 0,
        borderTop: accentColor ? `3px solid ${accentColor}` : '3px solid transparent',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          fontWeight: 600,
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
        }}
      >
        {label}
      </div>
      {isLoading ? (
        <>
          <div
            style={{
              height: 30,
              width: 56,
              background: 'var(--surface-secondary)',
              borderRadius: 6,
              marginBottom: 6,
              animation: 'pulse 1.4s ease infinite',
            }}
          />
          <div
            style={{
              height: 12,
              width: 100,
              background: 'var(--surface-secondary)',
              borderRadius: 4,
              animation: 'pulse 1.4s ease infinite',
            }}
          />
        </>
      ) : (
        <>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {value}
          </div>
          {description && (
            <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{description}</div>
          )}
        </>
      )}
    </div>
  )
}

export default function ProductsSummaryCards({ products = [], isLoading }) {
  const stats = useMemo(() => {
    const total = products.length
    const active = products.filter((p) => p.status === 'active').length
    const draft = products.filter((p) => p.status === 'draft').length
    const archived = products.filter((p) => p.status === 'archived').length

    const unavailable = products.filter((p) => {
      const av = p.availabilityStatus || p.availability
      return av === 'unavailable' || av === 'out_of_stock'
    }).length

    const needsAttention = products.filter((p) => {
      const av = p.availabilityStatus || p.availability
      return av === 'partial' || av === 'out_of_stock'
    }).length

    return { total, active, draft, archived, unavailable, needsAttention }
  }, [products])

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <SummaryCard
          label="Total Products"
          value={stats.total}
          description="All catalog items"
          isLoading={isLoading}
        />
        <SummaryCard
          label="Active"
          value={stats.active}
          description="Visible to customers"
          isLoading={isLoading}
          accentColor="var(--success-500)"
        />
        <SummaryCard
          label="Unavailable / OOS"
          value={stats.unavailable}
          description="Not available for order"
          isLoading={isLoading}
          accentColor="var(--warning-500)"
        />
        <SummaryCard
          label="Needs Attention"
          value={stats.needsAttention}
          description="Partial or out of stock"
          isLoading={isLoading}
          accentColor="var(--danger-500)"
        />
      </div>
    </>
  )
}
