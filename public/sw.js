const CACHE_NAME = "rokado-erp-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/dashboard",
  "/vouchers",
  "/ledgers",
  "/reports/balance-sheet",
  "/settings"
];

// On install, cache primary app routes
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[PWA] Caching layout routes & core shells");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate handler - purge old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[PWA] Purging outdated cache key:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch handler - cache-first with network fallback strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip POST/PUT operations and API writes (must route online or hit SQLite directly via node server)
  if (request.method !== "GET" || request.url.includes("/api/") || request.url.includes("chrome-extension")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached resource immediately, fetch in background to sync (stale-while-revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {
            // ignore network failure when offline
          });
        return cachedResponse;
      }

      // Network fallback
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // If completely offline and page shell exists, return base index cache
          if (request.mode === "navigate") {
            return caches.match("/");
          }
        });
    })
  );
});
