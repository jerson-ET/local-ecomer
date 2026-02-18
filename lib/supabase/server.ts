/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                     CLIENTE DE SUPABASE - SERVIDOR                           */
/*                                                                              */
/*   Propósito     : Crear cliente de Supabase para Server Components           */
/*   Uso           : Páginas del servidor, API Routes, Server Actions           */
/*   Archivo       : lib/supabase/server.ts                                     */
/*                                                                              */
/*   IMPORTANTE:                                                                */
/*   - Este cliente SOLO funciona en el servidor de Next.js                     */
/*   - Maneja cookies de forma segura en el servidor                            */
/*   - Cada petición crea una nueva instancia (no singleton)                    */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────────────────────────────── */
/*                              IMPORTACIONES                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Función de Supabase para crear cliente en el servidor                        */
/* "ssr" significa Server-Side Rendering                                        */
import { createServerClient } from '@supabase/ssr'

/* Función de Next.js para acceder a las cookies en el servidor                 */
/* Solo funciona en Server Components, no en middleware                         */
import { cookies } from 'next/headers'


/* ─────────────────────────────────────────────────────────────────────────── */
/*                         FUNCIÓN PARA CREAR CLIENTE                           */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Crea un cliente de Supabase para el servidor
 * ─────────────────────────────────────────────
 * 
 * @returns {Promise<SupabaseClient>} - Cliente de Supabase configurado
 * 
 * Esta función crea una conexión con Supabase que puede usarse
 * en Server Components, API Routes y Server Actions.
 * 
 * EJEMPLO DE USO:
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('usuarios').select('*')
 * 
 * NOTA: Es async porque necesita esperar por las cookies
 */
export async function createClient() {

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                        OBTENER ALMACÉN DE COOKIES                        */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* Obtener el almacén de cookies de Next.js                                  */
    /* Esto permite leer y escribir cookies de forma segura                      */
    const cookieStore = await cookies()

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                       OBTENER VARIABLES DE ENTORNO                       */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* URL del proyecto de Supabase                                              */
    /* Ejemplo: https://xxxxx.supabase.co                                        */
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

    /* Clave anónima (pública) para acceso limitado                              */
    /* Las políticas RLS controlan qué puede hacer esta clave                    */
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    /* ─────────────────────────────────────────────────────────────────────── */
    /*                      CREAR Y RETORNAR EL CLIENTE                         */
    /* ─────────────────────────────────────────────────────────────────────── */

    /* Crear cliente de Supabase con manejo personalizado de cookies             */
    return createServerClient(
        supabaseUrl,      /* URL del proyecto Supabase                           */
        supabaseAnonKey,  /* Clave anónima pública                               */
        {
            /* Configuración de cookies para el servidor                         */
            cookies: {

                /* ─────────────────────────────────────────────────────────── */
                /*                   FUNCIÓN: OBTENER TODAS                      */
                /* ─────────────────────────────────────────────────────────── */

                /* Obtiene todas las cookies de la petición actual               */
                /* Supabase llama esta función para verificar la sesión          */
                getAll() {
                    return cookieStore.getAll()
                },

                /* ─────────────────────────────────────────────────────────── */
                /*                   FUNCIÓN: GUARDAR TODAS                      */
                /* ─────────────────────────────────────────────────────────── */

                /* Guarda múltiples cookies en la respuesta                      */
                /* Supabase llama esta función para actualizar la sesión         */
                /* @param {Array} cookiesToSet - Cookies a guardar               */
                setAll(cookiesToSet) {
                    try {
                        /* Iterar sobre cada cookie que Supabase quiere guardar  */
                        for (const { name, value, options } of cookiesToSet) {
                            /* Guardar cada cookie con su nombre, valor y opciones */
                            cookieStore.set(name, value, options)
                        }
                    } catch {
                        /* Si falla, es porque estamos en un Server Component     */
                        /* que no puede modificar cookies (solo leer)             */
                        /* Esto es normal y se puede ignorar                      */
                    }
                },
            },
        }
    )
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FIN DEL ARCHIVO                                   */
/*                                                                              */
/*   Archivos relacionados:                                                     */
/*   - lib/supabase/client.ts     → Cliente para el navegador                   */
/*   - lib/supabase/middleware.ts → Cliente para Middleware                     */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
