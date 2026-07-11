import { useEffect } from 'react'
import { ToastProvider } from '../shared/components/feedback/Toast'
import { startOrderRealtimeStream, stopOrderRealtimeStream } from '../shared/services/orderRealtime'

export default function Providers({ children }) {
  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token')
    if (!token) return

    startOrderRealtimeStream()

    return () => stopOrderRealtimeStream()
  }, [])

  return <ToastProvider>{children}</ToastProvider>
}
