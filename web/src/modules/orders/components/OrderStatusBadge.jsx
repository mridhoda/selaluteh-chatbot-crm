import React from 'react'

export default function OrderStatusBadge({ status }) {
  const styles = {
    new: 'bg-[var(--info-50)] text-[var(--info-600)] border border-[var(--info-200)]',
    preparing:
      'bg-[var(--warning-50)] text-[var(--warning-600)] border border-[var(--warning-200)]',
    ready:
      'bg-[var(--ai-50)] text-[var(--ai-600)] border border-[var(--ai-200)]',
    completed:
      'bg-[var(--success-50)] text-[var(--success-600)] border border-[var(--success-100)]',
    cancelled:
      'bg-[var(--danger-50)] text-[var(--danger-600)] border border-[var(--danger-100)]',
  }

  const labels = {
    new: 'New',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  const s = status ? status.toLowerCase() : 'new'
  const styleClass = styles[s] || styles.new
  const label = labels[s] || status

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${styleClass}`}
    >
      <span className='text-[6px]'>●</span> {label}
    </span>
  )
}
