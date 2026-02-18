/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                    MIDDLEWARE DE SUPABASE - SESIÓN                           */
/*                                                                              */
/*   Propósito     : Actualizar la sesión del usuario en cada petición          */
/*   Uso           : Llamado desde middleware.ts en la raíz                     */
/*   Archivo       : lib/supabase/middleware.ts                                 */
/*                                                                              */
/*   FUNCIONALIDADES:                                                           */
/*   1. Verificar si el usuario está autenticado                                */
/*   2. Renovar tokens de sesión si están por expirar                           */
/*   3. Proteger rutas privadas                                                 */
/*   4. Redirigir usuarios no autenticados                                      */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────────────────────────────── */
/*                              IMPORTACIONES                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Función de Supabase para crear cliente en el servidor                        */
import { createServerClient } from '@supabase/ssr'

/* Tipos y funciones de Next.js para manejar peticiones y respuestas            */
/* NextRequest: La petición HTTP entrante                                       */
/* NextResponse: La respuesta HTTP que enviamos de vuelta                       */
import { NextResponse, type NextRequest } from 'next/server'


/* ─────────────────────────────────────────────────────────────────────────── */
/*                      DEFINICIÓN DE RUTAS PROTEGIDAS                          */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Lista de rutas que requieren que el usuario esté autenticado                 */
/* Si un usuario no logueado intenta acceder, será redirigido al login          */
const PROTECTED_ROUTES = [
    '/dashboard',      /* Panel de control del vendedor                         */
    '/mi-tienda',      /* Gestión de la tienda del vendedor                     */
    '/productos',      /* Gestión de productos del vendedor                     */
    '/promociones',    /* Gestión de promociones                                */
    '/configuracion',  /* Configuración de la cuenta                            */
    '/wallet',         /* Billetera/saldo del usuario                           */
]

/* Lista de rutas que solo pueden ver usuarios NO autenticados                  */
/* Si un usuario logueado intenta acceder, será redirigido al dashboard         */
const AUTH_ROUTES = [
    '/login',          /* Página de inicio de sesión                            */
    '/register',       /* Página de registro de cuenta                          */
    '/forgot-password',/* Página para recuperar contraseña                      */
]


/* ─────────────────────────────────────────────────────────────────────────── */
/*                      FUNCIÓN PRINCIPAL: ACTUALIZAR SESIÓN                    */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Actualiza la sesión del usuario y protege rutas
 * ─────────────────────────────────────────────────
 * 
 * @param   {NextRequest} request - La petición HTTP entrante
 * @returns {Promise<NextResponse>} - La respuesta con cookies actualizadas
 * 
 * FLUJO DE EJECUCIÓN:
 *   1. Verificar si Supabase está configurado
 *   2. Crear cliente de Supabase para el middleware
 *   3. Obtener la sesión actual del usuario
 *   4. Verificar permisos según la ruta
 *   5. Retornar respuesta con cookies actualizadas
 */
export async function updateSession(request: NextRequest) {

    /* ─────────────────────────────────────────────────────────────────────── */
    /*              PASO 1: VERIFICAR CONFIGURACIÓN DE SUPABASE                 */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* Obtener variables de entorno de Supabase                                  */
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    /* Si Supabase no está configurado, dejar pasar la petición sin verificar    */
    /* Esto permite desarrollar sin tener Supabase configurado                   */
    if (!supabaseUrl || !supabaseAnonKey) {
        /* Retornar respuesta normal sin modificar                               */
        return NextResponse.next({
            request: { headers: request.headers },
        })
    }

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                 PASO 2: CREAR RESPUESTA BASE                             */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* Crear una respuesta de Next.js que podemos modificar                      */
    /* Copiamos las cookies de la petición original                              */
    let supabaseResponse = NextResponse.next({
        request,
    })

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                 PASO 3: CREAR CLIENTE DE SUPABASE                        */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* Crear cliente de Supabase para el middleware                              */
    /* Este cliente puede leer y escribir cookies                                */
    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {

                /* Función para obtener todas las cookies de la petición         */
                getAll() {
                    return request.cookies.getAll()
                },

                /* Función para guardar cookies en la respuesta                   */
                /* Actualiza tanto la petición como la respuesta                  */
                setAll(cookiesToSet) {
                    /* Primero, guardar cookies en la petición                    */
                    /* Esto permite que las rutas downstream las vean             */
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    )

                    /* Crear nueva respuesta con las cookies actualizadas         */
                    supabaseResponse = NextResponse.next({
                        request,
                    })

                    /* Guardar cookies en la respuesta para el navegador          */
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    )
                },
            },
        },
    )

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                  PASO 4: OBTENER SESIÓN DEL USUARIO                      */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* IMPORTANTE: No usar getSession() aquí                                     */
    /* getUser() es más seguro porque verifica el token con el servidor          */
    /* getSession() solo lee el token local sin verificar                        */

    /* Obtener el usuario actual (si hay uno logueado)                           */
    const {
        data: { user },  /* El objeto usuario (null si no hay sesión)            */
    } = await supabase.auth.getUser()

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                  PASO 5: OBTENER RUTA ACTUAL                             */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* Extraer la ruta de la URL de la petición                                  */
    /* Ejemplo: de "https://sitio.com/dashboard" extraemos "/dashboard"          */
    const pathname = request.nextUrl.pathname

    /* ─────────────────────────────────────────────────────────────────────── */
    /*            PASO 6: VERIFICAR ACCESO A RUTAS PROTEGIDAS                   */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* Verificar si la ruta actual está en la lista de rutas protegidas          */
    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
        pathname.startsWith(route)
    )

    /* Si es una ruta protegida y el usuario NO está logueado                    */
    if (isProtectedRoute && !user) {

        /* Crear URL del login con la ruta original como parámetro               */
        /* Esto permite redirigir de vuelta después del login                    */
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        redirectUrl.searchParams.set('redirect', pathname)

        /* Redirigir al usuario al login                                         */
        return NextResponse.redirect(redirectUrl)
    }

    /* ─────────────────────────────────────────────────────────────────────── */
    /*          PASO 7: VERIFICAR ACCESO A RUTAS DE AUTENTICACIÓN               */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* Verificar si la ruta actual está en la lista de rutas de auth             */
    const isAuthRoute = AUTH_ROUTES.some(route =>
        pathname.startsWith(route)
    )

    /* Si es una ruta de auth y el usuario YA está logueado                      */
    if (isAuthRoute && user) {

        /* Crear URL del dashboard                                               */
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'

        /* Redirigir al usuario al dashboard                                     */
        return NextResponse.redirect(redirectUrl)
    }

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                  PASO 8: RETORNAR RESPUESTA                              */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* Retornar la respuesta con las cookies de sesión actualizadas              */
    /* El navegador guardará estas cookies automáticamente                       */
    return supabaseResponse
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FIN DEL ARCHIVO                                   */
/*                                                                              */
/*   RESUMEN DE PROTECCIONES:                                                   */
/*   ┌────────────────────┬────────────────┬───────────────────────────┐       */
/*   │ Tipo de Ruta       │ Usuario        │ Acción                    │       */
/*   ├────────────────────┼────────────────┼───────────────────────────┤       */
/*   │ Protegida          │ No logueado    │ Redirigir a /login        │       */
/*   │ Protegida          │ Logueado       │ Permitir acceso           │       */
/*   │ Auth (login)       │ No logueado    │ Permitir acceso           │       */
/*   │ Auth (login)       │ Logueado       │ Redirigir a /dashboard    │       */
/*   │ Pública            │ Cualquiera     │ Permitir acceso           │       */
/*   └────────────────────┴────────────────┴───────────────────────────┘       */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
