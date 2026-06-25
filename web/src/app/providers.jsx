import { useEffect } from 'react'
import { ToastProvider } from '../shared/components/feedback/Toast'
import { startOrderRealtimeStream, stopOrderRealtimeStream } from '../shared/services/orderRealtime'
import { registerOrderPushNotifications } from '../shared/services/webPush'

export default function Providers({ children }) {
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) return

    registerOrderPushNotifications().catch((err) => {
      console.warn('Order push notification registration failed:', err?.message || err)
    })
    startOrderRealtimeStream()

    return () => stopOrderRealtimeStream()
  }, [])

  return <ToastProvider>{children}</ToastProvider>
}
