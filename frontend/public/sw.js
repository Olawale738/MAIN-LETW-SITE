/* LETW service worker — minimal offline shell.
 * Strategy:
 *   - Static assets (CSS/JS/images served from same origin): cache-first.
 *   - Page navigations: network-first, falls back to cached /offline.html.
 *   - API calls and external resources: bypassed (always network).
 */
const CACHE = 'letw-shell-v2';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/NewLETWlogo.png', '/manifest.json'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Bypass: cross-origin requests, API calls, websockets
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/')) return;
    if (url.pathname.startsWith('/uploads/')) return;
    if (url.pathname.startsWith('/_next/data/')) return;

    // Page navigations: network-first → cached HTML → offline shell
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); return res; })
                .catch(() => caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL)))
        );
        return;
    }

    // Static assets: cache-first, update in background
    if (url.pathname.startsWith('/_next/static/') || /\.(css|js|png|jpg|jpeg|svg|webp|woff2?|ttf|ico)$/i.test(url.pathname)) {
        event.respondWith(
            caches.match(req).then((cached) => {
                const network = fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); return res; }).catch(() => cached);
                return cached || network;
            })
        );
    }
});
