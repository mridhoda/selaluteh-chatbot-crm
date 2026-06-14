import React from 'react'

const STATUS_MAP = {
  product: {
    active: { label: 'Active', color: 'var(--success-500)', bg: 'var(--success-50)' },
    draft: { label: 'Draft', color: 'var(--text-muted)', bg: 'var(--surface-secondary)' },
    archived: { label: 'Archived', color: 'var(--text-subtle)', bg: 'var(--surface-tertiary)' },
  },
  product_availability: {
    available: { label: 'Available', color: 'var(--success-500)', bg: 'var(--success-50)' },
    unavailable: { label: 'Unavailable', color: 'var(--warning-500)', bg: 'var(--warning-50)' },
    out_of_stock: { label: 'Out of Stock', color: 'var(--danger-500)', bg: 'var(--danger-50)' },
    partial: { label: 'Partial', color: 'var(--warning-500)', bg: 'var(--warning-50)' },
  },
  payment: {
    pending: { label: 'Pending', color: 'var(--pending-500)', bg: 'var(--pending-50)' },
    paid: { label: 'Paid', color: 'var(--success-500)', bg: 'var(--success-50)' },
    expired: { label: 'Expired', color: 'var(--text-muted)', bg: 'var(--surface-secondary)' },
    failed: { label: 'Failed', color: 'var(--danger-500)', bg: 'var(--danger-50)' },
    cancelled: { label: 'Cancelled', color: 'var(--text-muted)', bg: 'var(--surface-secondary)' },
    refunded: { label: 'Refunded', color: 'var(--info-500)', bg: 'var(--info-50)' },
  },
  order: {
    pending: { label: 'Pending', color: 'var(--pending-500)', bg: 'var(--pending-50)' },
    confirmed: { label: 'Confirmed', color: 'var(--info-500)', bg: 'var(--info-50)' },
    processing: { label: 'Processing', color: 'var(--info-500)', bg: 'var(--info-50)' },
    completed: { label: 'Completed', color: 'var(--success-500)', bg: 'var(--success-50)' },
    cancelled: { label: 'Cancelled', color: 'var(--danger-500)', bg: 'var(--danger-50)' },
    refunded: { label: 'Refunded', color: 'var(--info-500)', bg: 'var(--info-50)' },
  },
  platform: {
    connected: { label: 'Connected', color: 'var(--success-500)', bg: 'var(--success-50)' },
    disabled: { label: 'Disabled', color: 'var(--text-muted)', bg: 'var(--surface-secondary)' },
    pending_setup: { label: 'Pending Setup', color: 'var(--warning-500)', bg: 'var(--warning-50)' },
    needs_attention: { label: 'Needs Attention', color: 'var(--danger-500)', bg: 'var(--danger-50)' },
    disconnected: { label: 'Disconnected', color: 'var(--danger-500)', bg: 'var(--danger-50)' },
  },
  webhook: {
    healthy: { label: 'Healthy', color: 'var(--success-500)', bg: 'var(--success-50)' },
    no_recent_events: { label: 'No Recent Events', color: 'var(--warning-500)', bg: 'var(--warning-50)' },
    verification_failed: { label: 'Verification Failed', color: 'var(--danger-500)', bg: 'var(--danger-50)' },
    delivery_errors: { label: 'Delivery Errors', color: 'var(--danger-500)', bg: 'var(--danger-50)' },
    not_configured: { label: 'Not Configured', color: 'var(--text-muted)', bg: 'var(--surface-secondary)' },
  },
  chat: {
    open: { label: 'Open', color: 'var(--info-500)', bg: 'var(--info-50)' },
    resolved: { label: 'Resolved', color: 'var(--success-500)', bg: 'var(--success-50)' },
    escalated: { label: 'Escalated', color: 'var(--warning-500)', bg: 'var(--warning-50)' },
    ai_handling: { label: 'AI Handling', color: 'var(--ai-500)', bg: 'rgba(105, 86, 232, 0.1)' },
    human_takeover: { label: 'Human Takeover', color: 'var(--brand-500)', bg: 'rgba(244, 63, 112, 0.1)' },
  },
}

export default function StatusBadge({ domain, status, size = 'sm' }) {
  const domainMap = STATUS_MAP[domain] || {}
  const config = domainMap[status] || {
    label: status ? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown',
    color: 'var(--text-muted)',
    bg: 'var(--surface-secondary)',
  }

  const fontSize = size === 'sm' ? 11 : size === 'md' ? 12 : 13
  const dotSize = size === 'sm' ? 6 : 8
  const padding = size === 'sm' ? '2px 8px' : '4px 10px'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding,
        borderRadius: 20,
        background: config.bg,
        fontSize,
        fontWeight: 500,
        color: config.color,
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        verticalAlign: 'middle',
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  )
}
