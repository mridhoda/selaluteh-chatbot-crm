import { useState, useEffect, useCallback } from 'react'
import { chatsApi } from '../api/chatsApi'

export function useChats(filters = {}) {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await chatsApi.list(filters)
      setData(res.data || [])
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load chats')
    } finally {
      setIsLoading(false)
    }
  }, [JSON.stringify(filters)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch() }, [fetch])

  return { data, isLoading, error, refetch: fetch }
}
