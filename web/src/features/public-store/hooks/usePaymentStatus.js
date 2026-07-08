import { useCallback, useEffect, useRef, useState } from 'react'
import { phase5ApiClient } from '../api/phase5ApiClient'
import { getNextPaymentPollingDelay, normalizePaymentStatus, shouldStopPaymentPolling } from '../utils/cartIntentModel'

export function usePaymentStatus(paymentId, { poll = true, intervalMs = 5000, rateLimitedIntervalMs = 30000, maxPolls = 24 } = {}) {
  const [payment, setPayment] = useState(null)
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pollCount, setPollCount] = useState(0)
  const timerRef = useRef(null)
  const pollCountRef = useRef(0)

  const refresh = useCallback(async () => {
    if (!paymentId) return null
    setError('')
    setLoading(true)
    try {
      const result = normalizePaymentStatus(await phase5ApiClient.public.getPaymentStatus(paymentId))
      setPayment(result)
      pollCountRef.current += 1
      setPollCount(pollCountRef.current)
      setStatus(result.paymentStatus)
      return result
    } catch {
      setError('Gagal mengecek status pembayaran.')
      return null
    } finally {
      setLoading(false)
    }
  }, [paymentId])

  useEffect(() => {
    let mounted = true
    async function tick() {
      const result = await refresh()
      const nextDelay = getNextPaymentPollingDelay(result?.paymentStatus, { intervalMs, rateLimitedIntervalMs })
      if (!mounted || !poll || nextDelay === null || pollCountRef.current >= maxPolls) return
      timerRef.current = window.setTimeout(tick, nextDelay)
    }
    tick()
    return () => {
      mounted = false
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [intervalMs, maxPolls, poll, rateLimitedIntervalMs, refresh])

  return { payment, status, loading, error, refresh, pollCount, stopped: shouldStopPaymentPolling(status) || pollCount >= maxPolls }
}
