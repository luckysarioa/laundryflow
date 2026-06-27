// ==========================================================
// Service Worker LaundryFlow — App Shell caching (offline capability).
// Sesuai PRD poin 7: aplikasi tetap bisa dibuka meski koneksi melambat.
//
// Strategi: cache-first untuk app shell (HTML/JS/CSS statis),
// network-first untuk data API (selalu ambil terbaru saat online).
// ==========================================================

const CACHE_VERSION = "laundryflow-v2";
const APP_SHELL = [
  "/",
  "/login",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Hanya tangani GET.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Navigasi halaman (HTML) → network-first, fallback ke cache/offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((m) => m || caches.match("/"))),
    );
    return;
  }

  // Aset statis (same-origin) → cache-first.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached
          ? cached
          : fetch(request).then((res) => {
              const copy = res.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
              return res;
            }),
      ),
    );
  }
  // Request lintas-origin (mis. API backend) → biarkan default (network).
});
