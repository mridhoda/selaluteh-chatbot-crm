import { getApiBase } from '../api/apiBase'

function getToken() {
  return sessionStorage.getItem('token') || localStorage.getItem('token') || ''
}

let orderStream = null
let audioContext = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null
  audioContext ||= new AudioContext()
  return audioContext
}

export function unlockOrderChime() {
  const context = getAudioContext()
  if (context?.state === 'suspended') context.resume().catch(() => {})
}

export function playOrderChime() {
  if (document.visibilityState !== 'visible') return
  const context = getAudioContext()
  if (!context || context.state !== 'running') return

  const now = context.currentTime
  ;[0, 0.16].forEach((offset, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(index === 0 ? 880 : 1175, now + offset)
    gain.gain.setValueAtTime(0.0001, now + offset)
    gain.gain.exponentialRampToValueAtTime(0.16, now + offset + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.13)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(now + offset)
    oscillator.stop(now + offset + 0.14)
  })
}

export function startOrderRealtimeStream() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return { started: false, reason: 'unsupported' }
  }
  if (orderStream) return { started: false, reason: 'already_started' }

  const token = getToken()
  if (!token) return { started: false, reason: 'missing_token' }

  const url = new URL('/api/realtime/orders', getApiBase())
  url.searchParams.set('token', token)

  orderStream = new EventSource(url.toString())

  orderStream.addEventListener('ready', () => {
    console.log('Order realtime stream connected')
  })

  orderStream.addEventListener('order.created', (event) => {
    const data = JSON.parse(event.data || '{}')
    showOrderNotification(data)
    window.dispatchEvent(new CustomEvent('order:created', { detail: data }))
  })

  orderStream.addEventListener('order.paid', (event) => {
    const data = JSON.parse(event.data || '{}')
    showOrderNotification(data)
    window.dispatchEvent(new CustomEvent('order:paid', { detail: data }))
    window.dispatchEvent(new CustomEvent('order:updated', { detail: data }))
  })

  orderStream.addEventListener('order.updated', (event) => {
    const data = JSON.parse(event.data || '{}')
    window.dispatchEvent(new CustomEvent('order:updated', { detail: data }))
  })

  orderStream.addEventListener('payment.paid', (event) => {
    const data = JSON.parse(event.data || '{}')
    window.dispatchEvent(new CustomEvent('payment:paid', { detail: data }))
    window.dispatchEvent(new CustomEvent('payment:updated', { detail: data }))
    window.dispatchEvent(new CustomEvent('order:updated', { detail: data }))
  })

  orderStream.addEventListener('payment.updated', (event) => {
    const data = JSON.parse(event.data || '{}')
    window.dispatchEvent(new CustomEvent('payment:updated', { detail: data }))
    window.dispatchEvent(new CustomEvent('order:updated', { detail: data }))
  })

  orderStream.onerror = () => {
    console.warn('Order realtime stream disconnected; browser will retry automatically')
  }

  return { started: true }
}

export function stopOrderRealtimeStream() {
  if (!orderStream) return
  orderStream.close()
  orderStream = null
}

function showOrderNotification(data) {
  if (document.visibilityState === 'visible') return
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(data.title || 'Pesanan baru masuk', {
      body: data.body || 'Ada pesanan baru dari platform pelanggan.',
      tag: data.orderId ? `order.created:${data.orderId}` : 'order.created',
      data,
    })
  } catch (err) {
    console.warn('Failed to show order notification:', err?.message || err)
  }
}

if (typeof window !== 'undefined') {
  window.startOrderRealtimeStream = startOrderRealtimeStream
  window.stopOrderRealtimeStream = stopOrderRealtimeStream
}
