import React, { useEffect, useRef } from 'react'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant,
  onConfirm,
  onCancel,
  isLoading,
}) {
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleKey = (e) => {
      if (e.key === 'Escape' && !isLoading) onCancel()
    }

    document.addEventListener('keydown', handleKey)
    const timeout = setTimeout(() => cancelRef.current?.focus(), 50)

    return () => {
      document.removeEventListener('keydown', handleKey)
      clearTimeout(timeout)
    }
  }, [open, onCancel, isLoading])

  if (!open) return null

  const isDanger = confirmVariant === 'danger'

  const confirmButtonStyle = isDanger
    ? {
        background: 'var(--danger-500)',
        color: '#fff',
        border: '1px solid var(--danger-600)',
        borderRadius: 7,
        padding: '7px 16px',
        fontSize: 13,
        fontWeight: 500,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.7 : 1,
      }
    : {}

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel()
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-desc' : undefined}
        style={{
          background: 'var(--surface-primary)',
          borderRadius: 12,
          padding: '24px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.22)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <h2
          id="confirm-dialog-title"
          style={{
            margin: '0 0 8px',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h2>

        {description && (
          <p
            id="confirm-dialog-desc"
            style={{
              margin: '0 0 24px',
              fontSize: 14,
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            marginTop: description ? 0 : 24,
          }}
        >
          <button
            ref={cancelRef}
            className="btn ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>

          <button
            className={isDanger ? undefined : 'btn'}
            style={isDanger ? confirmButtonStyle : {}}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Loading…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
