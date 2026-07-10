import React from 'react'

export default function OrderQuickActions({
  order,
  onOpenChat,
  onResendPayment,
  onPrintReceipt,
  isPrintDisabled,
}) {
  if (!order) return null

  return (
    <div>
      <p className='text-[11px] font-bold text-[var(--text-muted)] mb-2.5 flex items-center gap-1.5'>
        <span>⚡</span>
        <span>Quick Actions</span>
      </p>

      {/* Action Row */}
      <div className='grid grid-cols-3 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)]'>
        <button
          onClick={onOpenChat}
          className='flex items-center justify-center gap-1.5 border-r border-[var(--border-subtle)] text-[var(--text-secondary)] py-2.5 text-xs font-semibold hover:bg-[var(--brand-50)] hover:text-[var(--brand-600)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
          title='Buka chat customer di CRM'
        >
          <svg viewBox='0 0 24 24' className='w-3.5 h-3.5' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
          </svg>
          <span>Open Chat</span>
        </button>
        
        <button
          onClick={onResendPayment}
          className='flex items-center justify-center gap-1.5 border-r border-[var(--border-subtle)] text-[var(--text-secondary)] py-2.5 text-xs font-semibold hover:bg-[var(--surface-secondary)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
          title='Kirim ulang notifikasi status ke customer via WhatsApp'
        >
          <svg viewBox='0 0 24 24' className='w-3.5 h-3.5' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <line x1='22' y1='2' x2='11' y2='13' />
            <polygon points='22 2 15 22 11 13 2 9 22 2' />
          </svg>
          <span>Resend Link</span>
        </button>

        <button
          onClick={onPrintReceipt}
          disabled={isPrintDisabled}
          className='flex items-center justify-center gap-1.5 text-[var(--text-secondary)] py-2.5 text-xs font-semibold hover:bg-[var(--surface-secondary)] transition duration-150 cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] disabled:opacity-45 disabled:cursor-not-allowed'
          title='Cetak Struk Thermal'
        >
          <svg viewBox='0 0 24 24' className='w-3.5 h-3.5' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <polyline points='6 9 6 2 18 2 18 9' />
            <path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2' />
            <rect x='6' y='14' width='12' height='8' />
          </svg>
          <span>Print</span>
        </button>
      </div>
    </div>
  )
}
