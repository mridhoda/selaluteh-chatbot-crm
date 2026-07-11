import { useEffect } from 'react'
import { ToastProvider } from '../shared/components/feedback/Toast'
import { startOrderRealtimeStream, stopOrderRealtimeStream, unlockOrderChime } from '../shared/services/orderRealtime'

export default function Providers({ children }) {
  useEffect(() => {
    const unlock = () => unlockOrderChime()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token')
    if (!token) return

    startOrderRealtimeStream()

    return () => stopOrderRealtimeStream()
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined
    const onPushMessage = (event) => {
      const data = event.data?.payload
      if (!data || !['order.created', 'order.paid', 'test'].includes(data.type)) return
      window.dispatchEvent(new CustomEvent(data.type === 'test' ? 'push:test' : data.type, { detail: data }))
      if (data.type !== 'test') window.dispatchEvent(new CustomEvent('order:updated', { detail: data }))
    }
    navigator.serviceWorker.addEventListener('message', onPushMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onPushMessage)
  }, [])

  return <ToastProvider>{children}</ToastProvider>
}
