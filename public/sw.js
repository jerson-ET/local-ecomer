/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                    SERVICE WORKER - LOCAL ECOMER PWA                         */
/*                                                                              */
/*   Estrategia: Network-first con cache fallback                              */
/*   - Cachea assets estáticos para funcionamiento offline                      */
/*   - Las páginas siempre intentan red primero, luego cache                    */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'localecomer-v1'
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
]

/* ── Instalación: Cachear assets estáticos ─────────────────────────────── */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS)
        })
    )
    self.skipWaiting()
})

/* ── Activación: Limpiar caches viejas ─────────────────────────────────── */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        })
    )
    self.clients.claim()
})

/* ── Fetch: Network-first con fallback a cache ─────────────────────────── */
self.addEventListener('fetch', (event) => {
    const { request } = event

    // Skip non-GET requests
    if (request.method !== 'GET') return

    // Skip chrome-extension and other non-http requests
    if (!request.url.startsWith('http')) return

    // For navigation requests (HTML pages) → Network first
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the latest version
                    const responseClone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone)
                    })
                    return response
                })
                .catch(() => {
                    // Offline fallback
                    return caches.match(request).then((cached) => {
                        return cached || caches.match('/')
                    })
                })
        )
        return
    }

    // For static assets (JS, CSS, images) → Cache first, then network
    if (
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'image' ||
        request.destination === 'font'
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                const fetchPromise = fetch(request)
                    .then((response) => {
                        const responseClone = response.clone()
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone)
                        })
                        return response
                    })
                    .catch(() => cached)

                return cached || fetchPromise
            })
        )
        return
    }

    // Everything else → Network with cache fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                return response
            })
            .catch(() => {
                return caches.match(request)
            })
    )
})
