/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                         MIDDLEWARE DE AUTENTICACIÓN                          */
/*                                                                              */
/*   Propósito     : Intercepta TODAS las peticiones HTTP entrantes             */
/*   Función       : Verifica la sesión del usuario y actualiza cookies         */
/*   Ejecuta       : Antes de que la petición llegue a las páginas              */
/*   Archivo       : middleware.ts (raíz del proyecto)                          */
/*                                                                              */
/*   IMPORTANTE:                                                                */
/*   - Este archivo DEBE estar en la raíz del proyecto                          */
/*   - Next.js lo detecta automáticamente                                       */
/*   - Se ejecuta en el Edge Runtime (muy rápido)                               */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────── */
/*                              IMPORTACIONES                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Tipo de Next.js para peticiones entrantes                                    */
/* Contiene información como URL, headers, cookies, etc.                        */
import { type NextRequest } from 'next/server'

/* Función que actualiza la sesión del usuario en Supabase                      */
/* Verifica si el usuario está logueado y renueva el token si es necesario      */
import { updateSession } from '@/lib/supabase/middleware'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                           FUNCIÓN DEL MIDDLEWARE                             */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Función middleware principal
 * ────────────────────────────
 *
 * @param   {NextRequest} request - La petición HTTP entrante del navegador
 * @returns {Promise<Response>}   - La respuesta modificada con cookies actualizadas
 *
 * FLUJO:
 *   1. Usuario hace click en una página
 *   2. El navegador envía una petición HTTP
 *   3. Esta función intercepta la petición
 *   4. updateSession verifica/actualiza la sesión
 *   5. La petición continúa hacia la página
 */
export async function middleware(request: NextRequest) {
  /* Llamar a la función que actualiza la sesión de Supabase                  */
  /* Esta función:                                                             */
  /*   - Lee las cookies de la petición                                        */
  /*   - Verifica si el token de sesión es válido                              */
  /*   - Renueva el token si está por expirar                                  */
  /*   - Retorna la respuesta con las cookies actualizadas                     */
  return await updateSession(request)
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                         CONFIGURACIÓN DEL MATCHER                            */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Configuración de qué rutas debe interceptar el middleware
 * ─────────────────────────────────────────────────────────
 *
 * El "matcher" define un patrón regex para filtrar peticiones.
 * Solo las peticiones que coinciden con el patrón pasan por el middleware.
 *
 * RUTAS EXCLUIDAS (no pasan por el middleware):
 *   - /_next/static   → Archivos estáticos de Next.js (JS, CSS)
 *   - /_next/image    → Imágenes optimizadas por Next.js
 *   - /favicon.ico    → Icono del sitio web
 *   - /archivos.ext   → Imágenes (svg, png, jpg, jpeg, gif, webp)
 *
 * RUTAS INCLUIDAS (sí pasan por el middleware):
 *   - Todas las demás rutas (páginas, API, etc.)
 */
export const config = {
  /* Arreglo de patrones para hacer match con las rutas                        */
  matcher: [
    /* Expresión regular que captura todas las rutas EXCEPTO:                */
    /*   - Archivos estáticos de Next.js                                     */
    /*   - Archivos de imagen                                                */
    /*   - Favicon                                                           */
    /* El (?!...) es un "negative lookahead" que excluye esos patrones       */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FIN DEL ARCHIVO                                   */
/*                                                                              */
/*   Próximos pasos:                                                            */
/*   - Revisar lib/supabase/middleware.ts para la lógica de sesión              */
/*   - Agregar protección de rutas (rutas privadas vs públicas)                 */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
