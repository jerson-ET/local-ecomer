'use client'

import { useState } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Botón Flotante de Recarga — Limpia cache y recarga la app                */
/*  Aparece como un botón discreto que al tocarlo:                           */
/*  1. Limpia todos los caches del Service Worker                            */
/*  2. Desregistra el SW viejo                                               */
/*  3. Recarga la página con contenido fresco                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ReloadButton() {
  const [isReloading, setIsReloading] = useState(false)

  const handleReload = async () => {
    if (isReloading) return
    setIsReloading(true)

    try {
      // 1. Limpiar todos los caches
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))
      }

      // 2. Decirle al SW que limpie todo
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        registration.active?.postMessage('CLEAR_CACHE')
        
        // Desregistrar el SW para obtener uno fresco
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((r) => r.unregister()))
      }

      // 3. Recargar con contenido fresco (bypass cache)
      setTimeout(() => {
        window.location.reload()
      }, 300)
    } catch (err) {
      console.error('Error al limpiar cache:', err)
      // Recargar de todas formas
      window.location.reload()
    }
  }

  return (
    <button
      onClick={handleReload}
      disabled={isReloading}
      className="fixed top-4 right-4 z-[100] pointer-events-auto"
      aria-label="Actualizar aplicación"
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '1.5px solid rgba(255,255,255,0.12)',
        background: 'rgba(8,8,15,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="url(#reload-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          animation: isReloading ? 'spin 0.6s linear infinite' : 'none',
        }}
      >
        <defs>
          <linearGradient id="reload-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <path d="M21.5 2v6h-6" />
        <path d="M2.5 22v-6h6" />
        <path d="M3.5 12a9 9 0 0 1 14.7-5.7L21.5 8" />
        <path d="M20.5 12a9 9 0 0 1-14.7 5.7L2.5 16" />
      </svg>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  )
}
