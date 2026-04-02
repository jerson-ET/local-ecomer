/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                    SERVICE WORKER - LOCAL ECOMER PWA                         */
/*                                                                              */
/*   Estrategia: Network-first SIEMPRE                                         */
/*   - Siempre intenta descargar la versión más reciente                       */
/*   - Solo usa cache cuando no hay conexión a internet                        */
/*   - El cache se actualiza automáticamente con cada request exitoso           */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

// ⚡ Cambiar este número fuerza actualización del SW en cada deploy
const CACHE_VERSION = 2
const CACHE_NAME = `localecomer-v${CACHE_VERSION}`

/* ── Instalación: Activar inmediatamente ───────────────────────────────── */
self.addEventListener('install', (event) => {
  // Activar el nuevo SW inmediatamente sin esperar
  self.skipWaiting()
})

/* ── Activación: Limpiar TODOS los caches viejos ──────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Eliminando cache viejo:', name)
            return caches.delete(name)
          })
      )
    })
  )
  // Tomar control de todas las pestañas abiertas inmediatamente
  self.clients.claim()
})

/* ── Fetch: SIEMPRE Network-first ──────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip non-http requests (chrome-extension, etc.)
  if (!request.url.startsWith('http')) return

  // Skip API calls - no cachear datos dinámicos
  if (request.url.includes('/api/')) return

  // Skip Supabase requests
  if (request.url.includes('supabase.co')) return

  // ESTRATEGIA: Network First para TODO
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Solo cachear respuestas exitosas
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Sin internet → usar cache como fallback
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // Si es una navegación y no hay cache, mostrar la página principal
          if (request.mode === 'navigate') {
            return caches.match('/')
          }
          return new Response('Offline', { status: 503 })
        })
      })
  )
})

/* ── Mensaje: Forzar actualización desde la app ────────────────────────── */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name))
    })
  }
})
