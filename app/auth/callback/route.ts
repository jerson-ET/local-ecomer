import { NextResponse } from 'next/server'
// Asegurarse de importar createClient desde la librería de utils del proyecto local
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // si el parámetro "next" existe, usarlo como URL base, de lo contrario ir a dashboard
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirigir correctamente a la URL final, ya sea remota o localhost
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Enviar a la aplicación a una vista principal con un error si falló la carga
  return NextResponse.redirect(`${origin}/?error=AuthCallbackError`)
}
