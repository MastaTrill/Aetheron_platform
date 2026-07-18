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
