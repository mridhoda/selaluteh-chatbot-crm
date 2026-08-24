import { useCallback, useEffect, useState } from 'react'
import { phase5ApiClient } from '../api/phase5ApiClient'
import { sanitizePublicOrder } from '../utils/cartIntentModel'
import { getApiBase } from '../../../shared/api/apiBase'

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

  // Push updates via the public per-order SSE channel -- fast path on top of
  // the 8s poll above, which stays running unconditionally as the safety net
  // (brief requirement: polling must not be gated behind connection state).
  useEffect(() => {
    if (!publicOrderToken || typeof EventSource === 'undefined') return

    const url = new URL(`/api/v1/public/orders/${publicOrderToken}/stream`, getApiBase())
    const stream = new EventSource(url.toString())

    const onUpdate = (event) => {
      let data
      try {
        data = JSON.parse(event.data || '{}')
      } catch {
        return
      }
      const sanitized = sanitizePublicOrder({ order: data })
      setOrder((prev) => {
        // Stale/out-of-order discard: keep whichever is actually newer.
        if (prev?.updatedAt && sanitized?.updatedAt && new Date(sanitized.updatedAt) <= new Date(prev.updatedAt)) {
          return prev
        }
        return sanitized
      })
    }
    stream.addEventListener('order.updated', onUpdate)
    stream.addEventListener('order.cancelled', onUpdate)
    stream.onerror = () => {} // silent -- native EventSource auto-reconnects, poll above already covers the gap

    return () => stream.close()
  }, [publicOrderToken])

  return { order, loading, error, refresh }
}
