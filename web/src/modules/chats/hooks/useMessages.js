import { useState, useEffect, useCallback, useRef } from 'react'
import { chatsApi } from '../api/chatsApi'

export function useMessages(chatId) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const pollingRef = useRef(null)
  const loadingRef = useRef(false)

  const fetch = useCallback(async (silent = false) => {
    if (!chatId) return
    if (loadingRef.current && !silent) return
    if (!silent) { setIsLoading(true) }
    loadingRef.current = true
    try {
      const res = await chatsApi.getMessages(chatId)
      setMessages(res.data || [])
      setError(null)
    } catch (e) {
      if (!silent) setError(e?.response?.data?.message || e.message)
    } finally {
      loadingRef.current = false
      if (!silent) setIsLoading(false)
    }
  }, [chatId])

  // Initial load
  useEffect(() => {
    if (!chatId) { setMessages([]); return }
    fetch(false)
  }, [chatId, fetch])

  // Polling every 3s
  useEffect(() => {
    if (!chatId) return
    pollingRef.current = setInterval(() => fetch(true), 3000)
    return () => clearInterval(pollingRef.current)
  }, [chatId, fetch])

  return { messages, isLoading, error, refetch: () => fetch(false) }
}
