import { NextResponse } from 'next/server'

/**
 * POST /api/migrate-marketplace
 * Ejecuta la migración de la columna show_in_marketplace de forma segura.
 * Solo se puede ejecutar una vez; si la columna ya existe, no hace nada.
 */
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Variables de entorno no configuradas' }, { status: 500 })
    }

    // Ejecutar el SQL directamente usando la API REST de Supabase (rpc o sql endpoint)
    const sql = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'products'
            AND column_name = 'show_in_marketplace'
        ) THEN
          ALTER TABLE public.products ADD COLUMN show_in_marketplace boolean DEFAULT true;
          RAISE NOTICE 'Columna show_in_marketplace creada exitosamente';
        ELSE
          RAISE NOTICE 'La columna show_in_marketplace ya existe';
        END IF;
      END
      $$;
    `

    const res = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    })

    // Si rpc no funciona, intentamos con el endpoint SQL directo de la Management API
    if (!res.ok) {
      // Alternativa: usar la Supabase JS client con service role para hacer un query directo
      const { createServerClient } = await import('@supabase/ssr')
      const supabase = createServerClient(supabaseUrl, serviceKey, {
        cookies: { getAll() { return [] }, setAll() {} }
      })

      // Intentar con rpc si existe una función, sino intentar insertar y ver si la columna existe
      const { error: testError } = await supabase
        .from('products')
        .select('show_in_marketplace')
        .limit(1)

      if (testError && testError.message.includes('show_in_marketplace')) {
        // La columna definitivamente no existe - necesitamos que el usuario la cree manualmente
        return NextResponse.json({
          error: 'La columna no existe. Debes ejecutar este SQL en el editor de Supabase:',
          sql: "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_in_marketplace boolean DEFAULT true; NOTIFY pgrst, 'reload schema';",
          status: 'MIGRATION_NEEDED'
        }, { status: 422 })
      }

      // Si no hubo error, la columna ya existe
      return NextResponse.json({ 
        success: true, 
        message: 'La columna show_in_marketplace ya existe en la base de datos.',
        status: 'ALREADY_EXISTS'
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migración ejecutada exitosamente.',
      status: 'MIGRATED'
    })

  } catch (error: any) {
    console.error('[MIGRATE] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
