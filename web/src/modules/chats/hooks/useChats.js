import { useState, useEffect, useCallback, useRef } from 'react'
import { chatsApi } from '../api/chatsApi'

export function useChats(filters = {}) {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const pollingRef = useRef(null)
  const loadingRef = useRef(false)

  const fetch = useCallback(
    async (silent = false) => {
      if (loadingRef.current) return
      loadingRef.current = true
      if (!silent) setIsLoading(true)
      setError(null)
      try {
        const res = await chatsApi.list(filters)
        setData(res.data || [])
      } catch (e) {
        if (!silent) {
          setError(
            e?.response?.data?.message || e.message || 'Failed to load chats'
          )
        }
      } finally {
        loadingRef.current = false
        if (!silent) setIsLoading(false)
      }
    },
    [JSON.stringify(filters)]
  ) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => {
    pollingRef.current = setInterval(() => fetch(true), 3000)
    return () => clearInterval(pollingRef.current)
  }, [fetch])

  return { data, isLoading, error, refetch: () => fetch(false) }
}
