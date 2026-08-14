// One-time retirement worker: remove every legacy Aetheron cache and release all clients.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name)))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({ type: 'AETHERON_CACHE_RETIRED' });
      if ('navigate' in client) await client.navigate(`${client.url.split('?')[0]}?site=base-live-v2`);
    }
    await self.registration.unregister();
  })());
});

self.addEventListener('fetch', () => {
  // Deliberately do not intercept. Every request goes to the current production deployment.
});

// Push notification event listener
self.addEventListener('push', (event) => {
  let data = {
    title: 'Aetheron Platform',
    body: 'New update available on Aetheron.',
    icon: './apple-touch-icon.png',
    badge: './favicon.ico',
    url: './',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || './apple-touch-icon.png',
    badge: data.badge || './favicon.ico',
    data: {
      url: data.url || './',
      timestamp: Date.now(),
    },
    vibrate: [100, 50, 100],
    actions: data.actions || [
      { action: 'open', title: 'Open Aetheron' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return null;
    }),
  );
});

