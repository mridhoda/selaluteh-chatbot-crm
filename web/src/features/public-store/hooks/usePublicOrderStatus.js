import { useCallback, useEffect, useState } from 'react'
import { phase5ApiClient } from '../api/phase5ApiClient'
import { sanitizePublicOrder } from '../utils/cartIntentModel'

export function usePublicOrderStatus(publicOrderToken) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    setLoading(true)
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

  return { order, loading, error, refresh }
}
