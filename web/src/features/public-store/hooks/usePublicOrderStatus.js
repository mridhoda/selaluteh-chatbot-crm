import { useCallback, useEffect, useState } from 'react'
import { publicStoreApi } from '../api/publicStoreApi'

export function usePublicOrderStatus(publicOrderToken) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const result = await publicStoreApi.getPublicOrder(publicOrderToken)
      setOrder(result)
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
