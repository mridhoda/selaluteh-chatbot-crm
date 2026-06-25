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
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

export async function registerOrderPushNotifications() {
  if (!isWebPushSupported()) return { enabled: false, reason: 'unsupported' }

  const configRes = await api.get('/api/push/public-key')
  const config = configRes.data || {}
  if (!config.enabled || !config.publicKey) return { enabled: false, reason: 'server_not_configured' }

  if (Notification.permission === 'denied') return { enabled: false, reason: 'permission_denied' }

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission()

  if (permission !== 'granted') return { enabled: false, reason: 'permission_not_granted' }

  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  await navigator.serviceWorker.ready

  const applicationServerKey = urlBase64ToUint8Array(config.publicKey)
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await subscribePush(registration, applicationServerKey)
  }

  await api.post('/api/push/subscriptions', { subscription: subscription.toJSON() })
  return { enabled: true }
}

if (typeof window !== 'undefined') {
  window.registerOrderPushNotifications = async () => {
    const result = await registerOrderPushNotifications()
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
    const existing = await registration.pushManager.getSubscription().catch(() => null)
    if (existing) await existing.unsubscribe().catch(() => null)

    try {
      return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })
    } catch (retryErr) {
      throw new Error(
        `${retryErr.message}. Push subscribe failed after retry. Ensure the app is opened on HTTPS or localhost and clear old site data if the browser kept a stale push subscription.`,
        { cause: retryErr },
      )
    }
  }
}
