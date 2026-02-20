const CACHE_VERSION = 'v1.4.0';
const CACHE_NAME = `aetheron-${CACHE_VERSION}`;
const RUNTIME_CACHE = `aetheron-runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './index.min.js',
  './charts.min.js',
  './monitor.js',
  './performance-monitor.js',
  './marketing-launch.js',
  './shared-utils.js',
  './critical.min.css',
  './shared-mobile-polish.css',
  './global-announcements.js',
  './announcements.json',
  './referral-leaderboard.json',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: 'CACHE_READY' }),
        );
      }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              return caches.delete(cacheName);
            }
            return null;
          }),
        ),
      )
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }));
      }),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (!event.request.url.startsWith('http')) {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isHtmlRequest =
    event.request.mode === 'navigate' ||
    event.request.headers.get('accept')?.includes('text/html');
  const isSameOrigin = requestUrl.origin === self.location.origin;

  // Handle external requests differently
  if (!isSameOrigin && !requestUrl.hostname.includes('cdn')) {
    // Cache external API calls for 5 minutes
    if (
      requestUrl.hostname.includes('polygon-rpc.com') ||
      requestUrl.hostname.includes('polygonscan.com') ||
      requestUrl.hostname.includes('quickswap.exchange')
    ) {
      event.respondWith(
        caches.open('api-cache').then((cache) => {
          return cache.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              // Check if cache is still fresh (5 minutes)
              const cacheTime = new Date(
                cachedResponse.headers.get('sw-cache-time'),
              );
              const now = new Date();
              if (now - cacheTime < 5 * 60 * 1000) {
                return cachedResponse;
              }
            }

            return fetch(event.request).then((response) => {
              if (response.status === 200) {
                // Clone response and add custom header for cache freshness
                try {
                  const headers = new Headers(response.headers);
                  headers.set('sw-cache-time', new Date().toISOString());
                  response
                    .clone()
                    .blob()
                    .then((blob) => {
                      const cachedResponse = new Response(blob, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: headers,
                      });
                      cache.put(event.request, cachedResponse);
                    });
                } catch (e) {
                  console.warn('Failed to clone response for caching', e);
                }
              }
              return response;
            });
          });
        }),
      );
      return;
    }
    return;
  }

  // Handle HTML requests with network-first strategy
  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            try {
              const cache = await caches.open(RUNTIME_CACHE);
              await cache.put(event.request, responseClone);
            } catch (e) {
              console.warn('Failed to cache HTML response', e);
            }
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  // Handle static assets with cache-first strategy
  const isStaticAsset = /\.(css|js|png|jpg|jpeg|svg|woff|woff2|webp)$/i.test(
    requestUrl.pathname,
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Serve from cache if available
        if (cachedResponse) {
          // Update cache in background
          fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, response.clone());
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }
        // If not cached, fetch from network and cache
        return fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response.clone());
              });
              return response;
            }
            // Fallback to offline if fetch fails
            return caches.match('./offline.html');
          })
          .catch(() => caches.match('./offline.html'));
      }),
    );
    return;
  }

  // Default cache-first strategy with background update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      });

      return cachedResponse || fetchPromise;
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
