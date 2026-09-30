/* Fish Paradise service worker.
 * - Static build assets: cache-first (they are content-hashed).
 * - Pages: network-first, falling back to the last cached copy, then to /offline.
 * - Public catalogue API: network-first with the last successful response kept for offline browsing.
 * Never caches authenticated or mutating requests (cart, orders, admin, auth, webhooks).
 */
const VERSION = 'fp-v1';
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const DATA = `${VERSION}-data`;
const OFFLINE_URL = '/offline';
const PRECACHE = [OFFLINE_URL, '/', '/shop', '/manifest.webmanifest', '/pwa-icon/192'];
const PUBLIC_API = ['/api/catalogue', '/api/shop', '/api/products/'];
const PRIVATE_PAGES = ['/admin', '/checkout', '/payment', '/pay/', '/orders', '/account', '/login', '/cart'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = (await cache.match(request)) || (fallbackUrl && (await caches.match(fallbackUrl)));
    if (cached) return cached;
    throw new Error('offline');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/pwa-icon/')) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  if (PUBLIC_API.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(networkFirst(request, DATA));
    return;
  }

  if (request.mode === 'navigate') {
    const isPrivate = PRIVATE_PAGES.some((p) => url.pathname === p || url.pathname.startsWith(p));
    event.respondWith(
      isPrivate
        ? fetch(request).catch(() => caches.match(OFFLINE_URL))
        : networkFirst(request, PAGES, OFFLINE_URL),
    );
  }
});
