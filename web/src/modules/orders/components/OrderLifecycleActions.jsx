import React from 'react'

const ACTION_LABELS = {
  mark_ready: 'Mark as Ready',
  ready: 'Mark as Ready',
  mark_completed: 'Completed',
  complete: 'Completed',
  cancel_order: 'Cancel Order',
  cancel: 'Cancel Order',
}

const ACTION_LOADING_LABELS = {
  mark_ready: 'Marking as Ready...',
  ready: 'Marking as Ready...',
  mark_completed: 'Completing...',
  complete: 'Completing...',
  cancel_order: 'Cancelling...',
  cancel: 'Cancelling...',
}

const ACTION_STYLES = {
  mark_ready: 'bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100',
  ready: 'bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100',
  mark_completed: 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100',
  complete: 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100',
}

const ACTION_ICONS = {
  mark_ready: '✓',
  ready: '✓',
  mark_completed: '✓',
  complete: '✓',
}

export default function OrderLifecycleActions({
  order,
  inFlightAction,
  onSubmitAction,
  onCancelClick,
}) {
  if (!order) return null

  const allowedActions = (order.allowedActions || []).filter((action) => (
    action === 'mark_ready' ||
    action === 'ready' ||
    action === 'mark_completed' ||
    action === 'complete' ||
    action === 'cancel_order' ||
    action === 'cancel'
  ))
  
  // Separate cancel from other lifecycle actions
  const lifecycleActions = allowedActions.filter(action => action !== 'cancel_order' && action !== 'cancel')
  const hasCancel = allowedActions.includes('cancel_order') || allowedActions.includes('cancel')

  const isTerminal =
    order.status === 'completed' ||
    order.status === 'COMPLETED' ||
    order.status === 'cancelled' ||
    order.status === 'CANCELLED' ||
    order.status === 'rejected' ||
    order.status === 'REJECTED'
  const isPaid = String(order.paymentStatus || order.payment_status || '').toLowerCase() === 'paid'

  const renderEmptyState = () => {
    if (isTerminal) {
      if (order.status === 'completed' || order.status === 'COMPLETED') {
        return <div className="text-xs text-[var(--text-muted)] italic">Order sudah selesai.</div>
      }
      if (order.status === 'cancelled' || order.status === 'CANCELLED') {
        return <div className="text-xs text-[var(--text-muted)] italic">Order telah dibatalkan.</div>
      }
      return <div className="text-xs text-[var(--text-muted)] italic">Order telah ditolak.</div>
    }
    if (!isPaid) {
      return (
        <div className="space-y-0.5 text-xs text-[var(--text-muted)]">
          <div className="font-semibold text-[var(--text-secondary)]">Menunggu pembayaran.</div>
          <div>Aksi kitchen akan tersedia setelah pembayaran terverifikasi.</div>
        </div>
      )
    }
    return <div className="text-xs text-[var(--text-muted)] italic">Tidak ada aksi lanjutan untuk order ini.</div>
  }

  return (
    <div className="space-y-2.5">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
          <span className="text-[13px]">🍴</span>
          <span>Order Status</span>
        </div>
      </div>

      {allowedActions.length === 0 ? (
        <div className="rounded-lg bg-[var(--surface-secondary)] px-3 py-2 text-center text-xs font-medium">
          {renderEmptyState()}
        </div>
      ) : (
        <div className="space-y-2.5">
          {lifecycleActions.length > 0 && (
            <div className={lifecycleActions.length === 1 ? "w-full" : "grid grid-cols-2 gap-3"}>
              {lifecycleActions.map((action) => {
                const label = ACTION_LABELS[action] || action
                const style = ACTION_STYLES[action] || 'bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]'
                const isLoading = inFlightAction === action
                const isAnyLoading = Boolean(inFlightAction)

                return (
                  <button
                    key={action}
                    type="button"
                    disabled={isAnyLoading}
                    onClick={() => onSubmitAction(action)}
                    className={`w-full min-h-10 rounded-lg px-3 py-2 text-xs font-extrabold transition duration-150 flex items-center justify-center gap-1.5 shadow-sm ${style} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[9px] leading-none">
                        {ACTION_ICONS[action] || '✓'}
                      </span>
                    )}
                    <span>{isLoading ? ACTION_LOADING_LABELS[action] : label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {hasCancel && (
            <div className="relative flex items-center justify-center pt-1">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-[var(--border-subtle)]" />
              <button
                type="button"
                disabled={Boolean(inFlightAction)}
                onClick={() => onCancelClick(allowedActions.includes('cancel_order') ? 'cancel_order' : 'cancel')}
                className="relative z-10 bg-[var(--surface-primary)] px-4 py-0.5 text-[10px] font-bold text-rose-500 transition duration-150 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-rose-300 text-[9px] leading-none">!</span>
                  {inFlightAction === 'cancel_order' || inFlightAction === 'cancel'
                    ? ACTION_LOADING_LABELS[allowedActions.includes('cancel_order') ? 'cancel_order' : 'cancel']
                    : 'Cancel Order'}
                </span>
                <span className="mt-0.5 block text-[8px] font-semibold text-[var(--text-muted)]">Only if needed</span>
              </button>
            </div>
          )}
          </div>
        )}
    </div>
  )
}
