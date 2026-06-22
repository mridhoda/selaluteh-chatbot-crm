import React from 'react'

export default function OrderQuickActions({
  order,
  onStatusChange,
  onCancelClick,
  onOpenChat,
  onResendPayment,
}) {
  if (!order) return null

  return (
    <div>
      <p className='text-[11px] font-bold text-[var(--text-primary)] mb-3'>
        Quick Actions
      </p>

      {/* Messaging Row */}
      <div className='flex gap-2 mb-3'>
        <button
          onClick={onOpenChat}
          className='flex-1 flex items-center justify-center gap-2 border border-[var(--border-subtle)] text-[var(--text-secondary)] py-2 rounded-lg text-sm font-medium hover:border-[var(--border-default)] hover:bg-[var(--surface-secondary)] bg-[var(--surface-primary)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
        >
          <span>💬</span>
          <span>Open Chat</span>
        </button>
        <button
          onClick={onResendPayment}
          className='flex-1 flex items-center justify-center gap-2 border border-[var(--border-subtle)] text-[var(--text-secondary)] py-2 rounded-lg text-sm font-medium hover:border-[var(--border-default)] hover:bg-[var(--surface-secondary)] bg-[var(--surface-primary)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
        >
          <span>↗️</span>
          <span>Resend Link</span>
        </button>
      </div>

      {/* Status Transitions Row */}
      <div className='flex gap-2 mb-3'>
        <button
          onClick={() => onStatusChange('preparing')}
          className='flex-1 bg-[var(--warning-50)] text-[var(--warning-600)] py-2 rounded-lg text-xs font-semibold border border-[var(--warning-200)] hover:bg-[var(--warning-100)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
        >
          Mark Preparing
        </button>
        <button
          onClick={() => onStatusChange('ready')}
          className='flex-1 bg-[var(--ai-50)] text-[var(--ai-600)] py-2 rounded-lg text-xs font-semibold border border-[var(--ai-200)] hover:bg-[var(--ai-100)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ai-ring)]'
        >
          Mark Ready
        </button>
        <button
          onClick={() => onStatusChange('completed')}
          className='flex-1 bg-[var(--success-50)] text-[var(--success-600)] py-2 rounded-lg text-xs font-semibold border border-[var(--success-100)] hover:bg-[var(--success-100)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
        >
          Complete
        </button>
      </div>

      {/* Cancel Action */}
      <button
        onClick={onCancelClick}
        className='w-full bg-[var(--surface-primary)] text-[var(--danger-600)] py-2 rounded-lg text-sm font-semibold border border-[var(--danger-100)] hover:bg-[var(--danger-50)] hover:border-[var(--danger-500)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
      >
        Cancel Order
      </button>
    </div>
  )
}
