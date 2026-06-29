const CACHE_NAME = "adhd-timer-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://cdn-icons-png.flaticon.com/512/3565/3565432.png"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn("Service Worker pre-caching warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event with network-falling-back-to-cache and dynamic caching
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache successful basic responses
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request).then((res) => {
          if (res) return res;
          // Fallback for navigation requests
          if (e.request.mode === "navigate") {
            return caches.match("./index.html") || caches.match("./");
          }
        });
      })
  );
});
