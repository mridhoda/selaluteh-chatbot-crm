import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

export default function CancelOrderModal({
  isOpen,
  order,
  onClose,
  onConfirm,
  isSubmitting,
}) {
  const [reason, setReason] = useState('')

  if (!isOpen || !order) return null

  const trimmedReason = reason.trim()
  const isValid = trimmedReason.length >= 5

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isValid) {
      onConfirm(trimmedReason)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-all duration-200">
      <div className="bg-[var(--surface-primary)] rounded-2xl p-6 max-w-md w-full shadow-[0_16px_40px_rgba(17,24,46,0.14)] border border-[var(--border-subtle)] flex flex-col gap-4.5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)]">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Cancel Order
          </h3>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] p-1 rounded-full hover:bg-[var(--surface-secondary)] transition focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Warning Copy */}
        <div className="text-xs text-[var(--text-secondary)] flex flex-col gap-1.5 bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700">
          <span className="font-bold">Batalkan pesanan ini hanya jika memang bermasalah.</span>
          <span>
            Alasan pembatalan wajib diisi untuk order <strong className="font-extrabold">{order.orderIdDisplay || order.orderNumber || order.id}</strong> dari <strong className="font-extrabold">{order.customerName || order.contactId?.name}</strong>.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[var(--text-secondary)]">
              Cancellation reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter cancellation reason (minimum 5 characters)..."
              rows={4}
              required
              disabled={isSubmitting}
              className="w-full border border-[var(--border-subtle)] rounded-xl p-3 text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--brand-500)] focus:shadow-[0_0_0_3px_var(--focus-brand-ring)] bg-[var(--surface-secondary)] resize-none"
            />
            <div className="text-[10px] text-[var(--text-muted)] text-right">
              {trimmedReason.length}/5 characters minimum
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-[var(--border-subtle)] text-xs font-semibold rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-4 py-2 bg-[var(--danger-50)] text-[var(--danger-600)] border border-[var(--danger-100)] hover:border-[var(--danger-500)] hover:bg-rose-100 transition duration-150 text-xs font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
