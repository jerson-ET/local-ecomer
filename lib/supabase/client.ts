/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                    CLIENTE DE SUPABASE - NAVEGADOR                           */
/*                                                                              */
/*   Propósito     : Crear cliente de Supabase para usar en el navegador        */
/*   Uso           : Componentes del lado del cliente (use client)              */
/*   Archivo       : lib/supabase/client.ts                                     */
/*                                                                              */
/*   IMPORTANTE:                                                                */
/*   - Este cliente SOLO funciona en el navegador                               */
/*   - Para Server Components usa server.ts                                     */
/*   - Usa el patrón Singleton para reutilizar la conexión                      */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────── */
/*                              IMPORTACIONES                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Función de Supabase para crear un cliente que corre en el navegador         */
/* "browser" significa que tiene acceso a cookies del navegador                 */
import { createBrowserClient } from '@supabase/ssr'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                         FUNCIÓN PARA CREAR CLIENTE                           */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Crea un cliente de Supabase para el navegador
 * ───────────────────────────────────────────────
 *
 * @returns {SupabaseClient} - Cliente de Supabase configurado
 *
 * Esta función crea una conexión con la base de datos de Supabase
 * que puede usarse en componentes del lado del cliente.
 *
 * EJEMPLO DE USO:
 *   const supabase = createClient()
 *   const { data } = await supabase.from('productos').select('*')
 */
export function createClient() {
  /* Obtener la URL del proyecto Supabase desde variables de entorno          */
  /* Esta URL se ve así: https://xxxxx.supabase.co                             */
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  /* Obtener la clave anónima (pública) de Supabase                            */
  /* Esta clave permite acceso limitado según las políticas RLS                */
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  /* Crear y retornar el cliente de Supabase                                   */
  /* createBrowserClient maneja automáticamente las cookies                    */
  return createBrowserClient(
    supabaseUrl /* URL del proyecto                                     */,
    supabaseAnonKey /* Clave anónima pública                                */
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FIN DEL ARCHIVO                                   */
/*                                                                              */
/*   Archivos relacionados:                                                     */
/*   - lib/supabase/server.ts     → Cliente para Server Components              */
/*   - lib/supabase/middleware.ts → Cliente para Middleware                     */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
