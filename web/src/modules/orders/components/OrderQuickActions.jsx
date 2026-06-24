import React, { useState } from 'react'

/**
 * Status-aware Quick Actions panel.
 * Only shows the valid next-step buttons based on the current order status,
 * following the server-side state machine.
 *
 * Valid transitions (from order-types.js):
 *  new / accepted / PENDING_PAYMENT / AWAITING_OUTLET_APPROVAL  → preparing
 *  accepted / APPROVED                                          → preparing
 *  preparing                                                    → ready
 *  ready / READY_FOR_PICKUP                                     → completed
 *  cancelled / completed / rejected                             → (terminal, no transitions)
 */

const TERMINAL_STATUSES = new Set(['completed', 'cancelled', 'rejected', 'COMPLETED', 'CANCELLED', 'REJECTED'])

// Which status buttons to show per current status
const NEXT_ACTIONS = {
  new: ['preparing'],
  PENDING_PAYMENT: ['preparing'],
  PAYMENT_PROCESSING: ['preparing'],
  AWAITING_OUTLET_APPROVAL: ['preparing'],
  accepted: ['preparing'],
  APPROVED: ['preparing'],
  preparing: ['ready'],
  PREPARING: ['ready'],
  ready: ['completed'],
  READY_FOR_PICKUP: ['completed'],
  completed: [],
  COMPLETED: [],
  cancelled: [],
  CANCELLED: [],
  rejected: [],
  REJECTED: [],
}

const ACTION_CONFIG = {
  preparing: {
    label: 'Mark Preparing',
    className:
      'flex-1 bg-[var(--warning-50)] text-[var(--warning-600)] py-2 rounded-lg text-xs font-semibold border border-[var(--warning-200)] hover:bg-[var(--warning-100)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]',
  },
  ready: {
    label: 'Mark Ready',
    className:
      'flex-1 bg-[var(--ai-50)] text-[var(--ai-600)] py-2 rounded-lg text-xs font-semibold border border-[var(--ai-200)] hover:bg-[var(--ai-100)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ai-ring)]',
  },
  completed: {
    label: 'Complete',
    className:
      'flex-1 bg-[var(--success-50)] text-[var(--success-600)] py-2 rounded-lg text-xs font-semibold border border-[var(--success-100)] hover:bg-[var(--success-100)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]',
  },
}

export default function OrderQuickActions({
  order,
  onStatusChange,
  onCancelClick,
  onOpenChat,
  onResendPayment,
}) {
  const [loadingStatus, setLoadingStatus] = useState(null)

  if (!order) return null

  const currentStatus = order.status || 'new'
  const isTerminal = TERMINAL_STATUSES.has(currentStatus)
  const nextActions = NEXT_ACTIONS[currentStatus] ?? []

  const handleStatusClick = async (newStatus) => {
    setLoadingStatus(newStatus)
    try {
      await onStatusChange(newStatus)
    } finally {
      setLoadingStatus(null)
    }
  }

  return (
    <div>
      <p className='text-[11px] font-bold text-[var(--text-primary)] mb-3'>
        Quick Actions
      </p>

      {/* Messaging Row */}
      <div className='flex gap-2 mb-3'>
        <button
          onClick={onOpenChat}
          className='flex-1 flex items-center justify-center gap-2 border border-[var(--border-subtle)] text-[var(--text-secondary)] py-2 rounded-lg text-sm font-medium hover:border-[var(--brand-200)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-600)] bg-[var(--surface-primary)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
          title='Buka chat customer di CRM'
        >
          <svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
          </svg>
          <span>Open Chat</span>
        </button>
        <button
          onClick={onResendPayment}
          className='flex-1 flex items-center justify-center gap-2 border border-[var(--border-subtle)] text-[var(--text-secondary)] py-2 rounded-lg text-sm font-medium hover:border-[var(--border-default)] hover:bg-[var(--surface-secondary)] bg-[var(--surface-primary)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
          title='Kirim ulang notifikasi status ke customer via WhatsApp'
        >
          <svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <line x1='22' y1='2' x2='11' y2='13' />
            <polygon points='22 2 15 22 11 13 2 9 22 2' />
          </svg>
          <span>Resend Link</span>
        </button>
      </div>

      {/* Status Transitions Row — context-aware based on current status */}
      {nextActions.length > 0 && (
        <div className='flex gap-2 mb-3'>
          {nextActions.map((action) => {
            const cfg = ACTION_CONFIG[action]
            if (!cfg) return null
            const isLoading = loadingStatus === action
            return (
              <button
                key={action}
                onClick={() => handleStatusClick(action)}
                disabled={isLoading}
                className={`${cfg.className} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <span className='inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1' />
                ) : null}
                {cfg.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Show info for terminal states */}
      {isTerminal && (
        <div className='mb-3 text-center text-[11px] text-[var(--text-muted)] bg-[var(--surface-secondary)] rounded-lg py-2 px-3 border border-[var(--border-subtle)]'>
          {currentStatus === 'completed' || currentStatus === 'COMPLETED'
            ? '✅ Order sudah selesai'
            : currentStatus === 'cancelled' || currentStatus === 'CANCELLED'
              ? '🚫 Order telah dibatalkan'
              : '❌ Order telah ditolak'}
        </div>
      )}

      {/* Cancel Action — hidden for terminal statuses */}
      {!isTerminal && (
        <button
          onClick={onCancelClick}
          className='w-full bg-[var(--surface-primary)] text-[var(--danger-600)] py-2 rounded-lg text-sm font-semibold border border-[var(--danger-100)] hover:bg-[var(--danger-50)] hover:border-[var(--danger-500)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
        >
          Cancel Order
        </button>
      )}
    </div>
  )
}
