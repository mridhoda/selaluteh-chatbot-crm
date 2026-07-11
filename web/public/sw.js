self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_err) {
    data = { title: 'Notifikasi baru', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Notifikasi baru';
  const options = {
    body: data.body || '',
    icon: '/logo-selalu-kopi.png',
    badge: '/logo-selalu-kopi.png',
    tag: data.type && data.orderId ? `${data.type}:${data.orderId}` : data.type || 'selaluteh-notification',
    data: {
      url: data.url || '/orders',
      orderId: data.orderId || null,
      workspaceId: data.workspaceId || null,
    },
    requireInteraction: data.type === 'order.created',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/orders', self.location.origin).href;

  event.waitUntil((async () => {
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) return client.navigate(targetUrl);
        return;
      }
    }
    if (clients.openWindow) return clients.openWindow(targetUrl);
  })());
});
