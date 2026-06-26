import { getApiBase } from '../api/apiBase'

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || ''
}

let orderStream = null

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
