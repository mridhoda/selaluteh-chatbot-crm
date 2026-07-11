import api from '../api/httpClient'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isWebPushSupported() {
  const secureContext = typeof window !== 'undefined' && (window.isSecureContext || ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname))
  return secureContext
    && typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

export async function requestWebPushPermission() {
  if (!isWebPushSupported() || Notification.permission !== 'default') {
    return Notification.permission
  }
  return Notification.requestPermission()
}

export async function registerOrderPushNotifications({ requestPermission = false } = {}) {
  if (!isWebPushSupported()) return { enabled: false, reason: 'unsupported' }

  const configRes = await api.get('/api/push/public-key')
  const config = configRes.data || {}
  if (!config.enabled || !config.publicKey) return { enabled: false, reason: 'server_not_configured' }

  if (Notification.permission === 'denied') return { enabled: false, reason: 'permission_denied' }

  if (Notification.permission !== 'granted' && !requestPermission) return { enabled: false, reason: 'permission_required' }
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()

  if (permission !== 'granted') return { enabled: false, reason: 'permission_not_granted' }

  let registration = await registerPushServiceWorker()

  const applicationServerKey = urlBase64ToUint8Array(config.publicKey)

  // Always unsubscribe stale subscription so a fresh one is created bound to
  // the current browser session and VAPID key.
  const existing = await registration.pushManager.getSubscription()
  if (existing) await existing.unsubscribe().catch(() => {})

  const subscription = await subscribePush(registration, applicationServerKey)

  await api.post('/api/push/subscriptions', { subscription: subscription.toJSON() })
  return { enabled: true }
}

if (typeof window !== 'undefined') {
  window.registerOrderPushNotifications = async (options = { requestPermission: true }) => {
    const result = await registerOrderPushNotifications(options)
    console.log('Order push notification registration result:', result)
    return result
  }
}

async function subscribePush(registration, applicationServerKey) {
  try {
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    })
  } catch (err) {
    throw new Error(`Push browser gagal membuat subscription: ${err.message}`, { cause: err })
  }
}

async function registerPushServiceWorker() {
  await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  const activeRegistration = await navigator.serviceWorker.ready
  if (!activeRegistration.active) throw new Error('Service worker tidak aktif. Refresh halaman lalu coba lagi.')
  return activeRegistration
}
