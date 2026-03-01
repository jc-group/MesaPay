const STATIC_CACHE = "mesapay-static-v2";
const RUNTIME_CACHE = "mesapay-runtime-v2";
const API_CACHE = "mesapay-api-v1";
const OFFLINE_URL = "/offline";

const STATIC_ASSETS = [OFFLINE_URL, "/manifest.webmanifest", "/icon.svg", "/icons/icon-192.png"];

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || networkPromise || caches.match(OFFLINE_URL);
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    return cached || caches.match(OFFLINE_URL);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  const isNavigation = event.request.mode === "navigate";
  const isSameOriginAsset =
    requestUrl.origin === self.location.origin &&
    (requestUrl.pathname.startsWith("/_next/") ||
      requestUrl.pathname.startsWith("/icons/") ||
      requestUrl.pathname.endsWith(".css") ||
      requestUrl.pathname.endsWith(".js") ||
      requestUrl.pathname.endsWith(".svg") ||
      requestUrl.pathname.endsWith(".png"));

  const isPublicApi =
    (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith("/api/")) ||
    (requestUrl.hostname === "localhost" &&
      requestUrl.port === "3001" &&
      (requestUrl.pathname.startsWith("/api/") || requestUrl.pathname === "/health"));

  if (isNavigation) {
    event.respondWith(networkFirst(event.request, RUNTIME_CACHE));
    return;
  }

  if (isPublicApi) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  if (isSameOriginAsset) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
