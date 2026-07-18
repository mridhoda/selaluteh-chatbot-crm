import { useCallback, useEffect, useState } from 'react'
import { phase5ApiClient } from '../api/phase5ApiClient'
import { sanitizePublicOrder } from '../utils/cartIntentModel'

export function usePublicOrderStatus(publicOrderToken) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    try {
      const result = await phase5ApiClient.public.getPublicOrder(publicOrderToken)
      setOrder(sanitizePublicOrder(result))
    } catch {
      setError('Pesanan tidak ditemukan atau token kedaluwarsa.')
    } finally {
      setLoading(false)
    }
  }, [publicOrderToken])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!publicOrderToken) return

    // Simple bounded polling for public guest user (10s intervals for status change)
    // ponytail: upgrade to WebSockets/SSE if real-time push is critical for guests.
    const interval = setInterval(() => {
      // Don't show global loading state during polling updates
      phase5ApiClient.public.getPublicOrder(publicOrderToken)
        .then((result) => {
          const sanitized = sanitizePublicOrder(result)
          setOrder((prev) => {
            if (!prev || prev.status !== sanitized.status || prev.paymentStatus !== sanitized.paymentStatus) {
              return sanitized
            }
            return prev
          })
        })
        .catch(() => {})
    }, 8000)

    return () => clearInterval(interval)
  }, [publicOrderToken])

  return { order, loading, error, refresh }
}
