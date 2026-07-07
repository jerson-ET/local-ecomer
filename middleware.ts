import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const pathname = url.pathname

  // Evitar interceptar archivos estáticos, api routes o recursos internos de Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return await updateSession(request)
  }

  // Definir dominios base del marketplace
  const baseDomains = [
    'localhost:3000',
    'localhost:3001',
    'localhost:3002',
    '127.0.0.1:3000',
    '127.0.0.1:3001',
    'localecomer.store',
    'www.localecomer.store',
    'local-ecomer.vercel.app'
  ]

  const isBaseDomain = baseDomains.some(domain => hostname.toLowerCase() === domain)

  if (!isBaseDomain) {
    // Es un dominio personalizado. Buscamos a qué tienda pertenece
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            },
          },
        })

        // Limpiar el hostname de www. si el usuario lo configuró sin él
        const cleanHost = hostname.replace(/^www\./, '').toLowerCase()

        // Buscar en Supabase la tienda que tenga este custom_domain
        const { data: store } = await supabase
          .from('stores')
          .select('slug')
          .or(`custom_domain.eq.${cleanHost},custom_domain.eq.${hostname.toLowerCase()}`)
          .eq('is_active', true)
          .maybeSingle()

        if (store?.slug) {
          // Reescribimos la ruta internamente hacia la tienda del usuario
          // Si el pathname es '/' se reescribe a '/tienda/slug'
          // Si el pathname es '/productos/123' se reescribe a '/tienda/slug/productos/123' (si aplica en tu ruteo de tienda)
          const newPathname = `/tienda/${store.slug}${pathname === '/' ? '' : pathname}`
          
          const rewriteUrl = new URL(newPathname, request.url)
          
          // Preservar la sesión actualizando cookies de sesión de Supabase
          const response = NextResponse.rewrite(rewriteUrl)
          
          // Copiar cookies actualizadas por Supabase a la respuesta de reescritura
          const sessionResponse = await updateSession(request)
          sessionResponse.cookies.getAll().forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value)
          })

          return response
        }
      } catch (err) {
        console.error('[MIDDLEWARE] Error resolviendo dominio personalizado:', err)
      }
    }
  }

  // Flujo normal (marketplace principal o fallback)
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
