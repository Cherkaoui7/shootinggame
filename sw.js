/* ============================================================
   sw.js — Service worker: makes the game fully offline-capable.
   Strategy:
   - Precache all core assets on install (cache-first afterwards).
   - Runtime-cache the Google Fonts stylesheet and font files
     (stale-while-revalidate) so even typography works offline.
   ============================================================ */
const CACHE_NAME = 'void-protocol-v1';

// All same-origin assets the game needs. The page is cached at runtime too,
// but listed here so the very first offline launch still works after one load.
const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './icon.svg',
  './main.js',
  './input.js',
  './audio.js',
  './player.js',
  './enemies.js',
  './boss.js',
  './upgrades.js',
  './render.js',
  './ui.js',
  './storage.js'
];

// SECURITY: same-origin only — cache.put is never fed arbitrary network bodies.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      // SECURITY: only delete caches this app owns (namespaced prefix)
      Promise.all(
        names.filter((n) => n.startsWith('void-protocol-') && n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // SECURITY: only handle safe, read-only GET requests from this origin
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Google Fonts (stylesheet + font files): stale-while-revalidate so they
  // are available offline after the first online visit.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Same-origin: cache-first, falling back to network, then to index.html
  // so a refresh while offline never breaks the app shell.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        }).catch(() => caches.match('./index.html'));
      })
    );
  }
  // SECURITY: cross-origin requests other than fonts are left untouched (no caching, no replay)
});
