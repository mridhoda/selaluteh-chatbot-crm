self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_err) {
    data = { title: 'Notifikasi baru', body: event.data ? event.data.text() : '' };
  }

  event.waitUntil((async () => {
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    clientList.forEach((client) => client.postMessage({ type: 'push-order', payload: data }));

    if (clientList.some((client) => client.visibilityState === 'visible')) return;

    await self.registration.showNotification(data.title || 'Notifikasi baru', {
      body: data.body || '',
      icon: '/logo-selalu-kopi.png',
      badge: '/logo-selalu-kopi.png',
      // Each push is independent so Android can alert again for a new order.
      tag: `${data.type || 'selaluteh-notification'}:${data.orderId || Date.now()}:${data.createdAt || Date.now()}`,
      renotify: true,
      vibrate: [100, 60, 140],
      data: {
        url: data.url || '/app/kitchen',
        orderId: data.orderId || null,
        workspaceId: data.workspaceId || null,
      },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
    const targetUrl = new URL(event.notification.data?.url || '/app/kitchen', self.location.origin).href;

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
