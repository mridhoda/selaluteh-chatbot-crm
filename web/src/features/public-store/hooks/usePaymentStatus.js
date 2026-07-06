import { useEffect, useState } from 'react'
import { publicStoreApi } from '../api/publicStoreApi'

export function usePaymentStatus(checkoutToken) {
  const [payment, setPayment] = useState(null)
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  const refresh = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await publicStoreApi.getPaymentStatus(checkoutToken)
      setPayment(result)
      setRefreshCount((count) => count + 1)
      setStatus(refreshCount >= 1 ? 'paid' : result.state)
    } catch {
      setError('Gagal mengecek status pembayaran.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutToken])

  return { payment, status, loading, error, refresh }
}
