const CACHE_NAME = 'aksa-v1';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
];
const ENTRY_CACHE_LIMIT = 50;

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Offline.html may not exist yet, continue
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for entries, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Cache-first for _next/static/* (immutable assets)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for /entry/*, /language/*, /collection/* (HTML + data)
  if (
    url.pathname.match(/^\/entry\//) ||
    url.pathname.match(/^\/language\//) ||
    url.pathname.match(/^\/collection\//) ||
    url.pathname.match(/^\/profile\//) ||
    url.pathname.match(/^\/suara\//)
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
              // LRU: remove oldest entries if cache exceeds limit
              cache.keys().then((keys) => {
                if (keys.length > ENTRY_CACHE_LIMIT) {
                  cache.delete(keys[0]);
                }
              });
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, fall back to cached
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Network-first for everything else with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background sync placeholder (future: save offline entries)
self.addEventListener('sync', (event) => {
  // Placeholder for future offline submission queue
});
