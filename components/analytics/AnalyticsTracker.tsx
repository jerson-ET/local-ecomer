'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ANALYTICS TRACKER                                                         */
/*  Rastrea la actividad del usuario dentro de LocalEcomer:                   */
/*  - Páginas visitadas                                                       */
/*  - Tiempo en cada página                                                   */
/*  - Acciones (subir productos, clics en botones, etc.)                      */
/*  - Duración de sesión                                                      */
/*  - Tiempo entre acciones                                                   */
/*                                                                             */
/*  Solo se activa si el usuario aceptó cookies.                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function generateSessionId(): string {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics-session-id')
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem('analytics-session-id', sessionId)
  }
  return sessionId
}

function getCookieConsent(): string {
  return localStorage.getItem('cookie-consent') || 'unknown'
}

async function sendEvent(eventData: Record<string, unknown>) {
  try {
    const consent = getCookieConsent()
    if (consent !== 'accepted') return // Solo trackear si aceptó cookies

    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...eventData,
        sessionId: getSessionId(),
        cookieConsent: consent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        language: navigator.language,
        referrer: document.referrer,
      }),
    })
  } catch {
    // Silenciar errores de analytics para no afectar UX
  }
}

// ═══ Función pública para trackear acciones desde cualquier componente ═══
export function trackAction(action: string, details?: string) {
  sendEvent({
    eventType: 'action',
    page: window.location.pathname,
    action,
    details,
  })
}

// ═══ Hook para trackear acciones específicas ═══
export function useTrackAction() {
  return useCallback((action: string, details?: string) => {
    trackAction(action, details)
  }, [])
}

// ═══ Componente principal de tracking ═══
export default function AnalyticsTracker() {
  const pathname = usePathname()
  const pageEntryTime = useRef<number>(Date.now())
  const lastActionTime = useRef<number>(Date.now())
  const isFirstRender = useRef(true)

  // Trackear inicio de sesión
  useEffect(() => {
    const consent = getCookieConsent()
    if (consent !== 'accepted') return

    sendEvent({
      eventType: 'session_start',
      page: window.location.pathname,
    })

    // Trackear cuando el usuario cierra la pestaña
    const handleBeforeUnload = () => {
      const duration = Date.now() - pageEntryTime.current
      // Usar sendBeacon para enviar datos antes de cerrar
      const data = JSON.stringify({
        eventType: 'session_end',
        sessionId: getSessionId(),
        page: window.location.pathname,
        duration,
        cookieConsent: consent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        language: navigator.language,
      })
      navigator.sendBeacon('/api/analytics', data)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Trackear cambio de página
  useEffect(() => {
    const consent = getCookieConsent()
    if (consent !== 'accepted') return

    if (isFirstRender.current) {
      isFirstRender.current = false
    }

    // Calcular tiempo en la página anterior
    const now = Date.now()
    const duration = now - pageEntryTime.current
    const timeSinceLastAction = now - lastActionTime.current

    // Enviar page_view
    sendEvent({
      eventType: 'page_view',
      page: pathname,
      duration,
      details: `Tiempo desde última acción: ${Math.round(timeSinceLastAction / 1000)}s`,
    })

    pageEntryTime.current = now
    lastActionTime.current = now
  }, [pathname])

  // Trackear clics en botones importantes
  useEffect(() => {
    const consent = getCookieConsent()
    if (consent !== 'accepted') return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const button = target.closest('button, a, [role="button"]') as HTMLElement | null
      
      if (!button) return

      const text = button.textContent?.trim().substring(0, 80) || ''
      const href = button.getAttribute('href') || ''
      const id = button.id || ''

      // Solo trackear botones con texto significativo
      if (text.length < 2) return

      const now = Date.now()
      const timeSinceLastAction = now - lastActionTime.current
      lastActionTime.current = now

      sendEvent({
        eventType: 'action',
        page: pathname,
        action: 'button_click',
        details: JSON.stringify({
          text,
          href,
          id,
          timeSinceLastAction: `${Math.round(timeSinceLastAction / 1000)}s`,
        }),
      })
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname])

  // No renderiza nada visible
  return null
}
