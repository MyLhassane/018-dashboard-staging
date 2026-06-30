const CACHE = "fifa2026-v3";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.url.startsWith("chrome-extension://")) return;

  const isNavigation = request.mode === "navigate";

  event.respondWith(
    isNavigation
      ? fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }).catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
      : caches.match(request).then((cached) => {
          if (cached) {
            fetch(request).then((response) => {
              if (response && response.status === 200) {
                const copy = response.clone();
                caches.open(CACHE).then((cache) => cache.put(request, copy));
              }
            }).catch(() => {});
            return cached;
          }
          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }).catch(() => new Response("Offline", { status: 503 }));
        })
  );
});
