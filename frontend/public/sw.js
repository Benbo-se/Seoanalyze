const VERSION = 'v2025-09-14-3';
const CACHE_NAME = `seo-analyzer-${VERSION}`;

// Install event - force immediate activation
self.addEventListener('install', event => {
  console.log('SW installing version:', VERSION);
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const assets = [
      '/',
      '/manifest.json'
    ];
    await Promise.all(assets.map(u =>
      cache.add(u).catch(() => {/* ignore 404s */})
    ));
    return self.skipWaiting();
  })());
});

// Activate event - clear old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('SW activating version:', VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - network-first for HTML and Next.js bundles
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const req = event.request;
  const accept = req.headers.get('accept') || '';
  const isHTML = accept.includes('text/html');
  const isNext = req.destination === 'script' || req.url.includes('/_next/static/');
  const isSSE = req.url.includes('/api/sse/') || accept.includes('text/event-stream');

  // Bypass SSE requests completely
  if (isSSE) {
    return;
  }

  // Network-first for HTML and Next.js bundles to ensure fresh code
  if (isHTML || isNext) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(response => {
          // Clone response before using it
          const responseToCache = response.clone();
          // Cache successful responses
          if (response.ok && !isHTML) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(req, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache on network error
          return caches.match(req);
        })
    );
  }
  // Cache-first for other static assets
  else {
    event.respondWith(
      caches.match(req).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(req).then(response => {
          // Clone response before using it
          const responseToCache = response.clone();
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(req, responseToCache);
            });
          }
          return response;
        });
      })
    );
  }
});

// Background Sync for analysis requests (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'analysis-sync') {
      console.log('Background sync triggered for analysis');
      // Handle background sync logic here if needed
    }
  });
}

// Message handling for manual cache refresh
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});