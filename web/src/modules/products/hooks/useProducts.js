import { useState, useEffect, useCallback } from 'react'
import { productsApi } from '../api/productsApi'

export function useProducts(filters = {}) {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await productsApi.list(filters)
      const result = res.data
      if (Array.isArray(result)) {
        setData(result)
      } else {
        setData(result.data || [])
        setPagination((prev) => result.meta || prev)
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }, [JSON.stringify(filters)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, isLoading, error, refetch: fetch, pagination }
}

export function useMutateProduct() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)

  const mutate = useCallback(async (fn) => {
    setIsPending(true)
    setError(null)
    try {
      const res = await fn()
      return res.data
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Operation failed'
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsPending(false)
    }
  }, [])

  return { mutate, isPending, error }
}
