import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

let idCounter = 0

const CONFIGS = {
  success: {
    icon: CheckCircle,
    color: 'var(--success-500)',
    border: 'var(--success-500)',
  },
  error: {
    icon: XCircle,
    color: 'var(--danger-500)',
    border: 'var(--danger-500)',
  },
  warning: {
    icon: AlertTriangle,
    color: 'var(--warning-500)',
    border: 'var(--warning-500)',
  },
  info: {
    icon: Info,
    color: 'var(--info-500, #3b82f6)',
    border: 'var(--info-500, #3b82f6)',
  },
}

function Toast({ id, type, message, onDismiss }) {
  const cfg = CONFIGS[type] || CONFIGS.success
  const Icon = cfg.icon

  return (
    <div
      role='alert'
      aria-live='assertive'
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '11px 14px',
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${cfg.border}`,
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.14)',
        fontSize: 13,
        color: 'var(--text-primary)',
        animation: 'toast-in 0.18s ease',
        maxWidth: 360,
        width: '100%',
      }}
    >
      <Icon
        size={16}
        style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}
      />
      <span style={{ flex: 1, lineHeight: 1.5 }}>{message}</span>
      <button
        onClick={() => onDismiss(id)}
        aria-label='Dismiss notification'
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          padding: 2,
          borderRadius: 4,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    clearTimeout(timersRef.current[id])
    delete timersRef.current[id]
  }, [])

  const add = useCallback(
    (type, message) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, type, message }])
      timersRef.current[id] = setTimeout(() => dismiss(id), 3000)
    },
    [dismiss]
  )

  const lastOrderNoticeRef = useRef(new Map())
  useEffect(() => {
    const showOrderToast = (event) => {
      const data = event.detail || {}
      const key = `${data.type || event.type}:${data.orderId || data.order?.id || ''}`
      const now = Date.now()
      if (lastOrderNoticeRef.current.get(key) > now - 3000) return
      lastOrderNoticeRef.current.set(key, now)
      add('info', data.body || data.title || 'Ada pesanan baru masuk.')
    }

    window.addEventListener('order:created', showOrderToast)
    window.addEventListener('order:paid', showOrderToast)
    window.addEventListener('push:test', showOrderToast)
    return () => {
      window.removeEventListener('order:created', showOrderToast)
      window.removeEventListener('order:paid', showOrderToast)
      window.removeEventListener('push:test', showOrderToast)
    }
  }, [add])

  const value = {
    success: (msg) => add('success', msg),
    error: (msg) => add('error', msg),
    warning: (msg) => add('warning', msg),
    info: (msg) => add('info', msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live='polite'
        aria-label='Notifications'
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 9999,
          width: '90vw',
          maxWidth: 360,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast
              id={t.id}
              type={t.type}
              message={t.message}
              onDismiss={dismiss}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
