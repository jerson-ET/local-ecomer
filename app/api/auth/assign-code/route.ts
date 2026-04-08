import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Usamos el Service Role para poder saltarnos el RLS al actualizar auth.users y acceder a la bodega
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si ya tiene código asignado en auth
    if (user.user_metadata?.referral_code) {
      return NextResponse.json({ success: true, code: user.user_metadata.referral_code, message: 'Ya tiene código' })
    }

    const serviceClient = getServiceClient()

    // Buscar y asegurar exclusividad de un código en la tabla referral_codes.
    // Para evitar condición de carrera (race condition), podemos intentar encontrar el primero "available"
    // y tratar de asignarlo directamente en SQL. Como estamos en REST, buscamos uno y marcamos status.
    
    const { data: availableCode, error: fetchError } = await serviceClient
      .from('referral_codes')
      .select('code')
      .eq('status', 'available')
      .limit(1)
      .maybeSingle()

    if (fetchError || !availableCode) {
      console.error('[ASSIGN_CODE] No hay códigos disponibles o hubo error', fetchError)
      return NextResponse.json({ error: 'No hay códigos disponibles en la bodega' }, { status: 500 })
    }

    const code = availableCode.code

    // Intentar marcarlo como 'assigned' y setear el user_id
    const { data: updatedCode, error: updateCodeError } = await serviceClient
      .from('referral_codes')
      .update({
        status: 'assigned',
        user_id: user.id,
        email: user.email,
        assigned_at: new Date().toISOString()
      })
      .eq('code', code)
      .eq('status', 'available') // Optimistic locking
      .select()

    if (updateCodeError || !updatedCode || updatedCode.length === 0) {
      // Hubo una colisión o error. Fallamos y dejamos que el cliente intente de nuevo.
      return NextResponse.json({ error: 'Colisión al asignar código, por favor intenta de nuevo.' }, { status: 409 })
    }

    // Si tuvo éxito, actualizar user_metadata
    const currentMeta = user.user_metadata || {}
    const { error: metaError } = await serviceClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...currentMeta,
        referral_code: code
      }
    })

    if (metaError) {
      console.error('[ASSIGN_CODE] Código reservado pero falló actualizar metadata:', metaError)
      // Opcional: Revertir asignación de código
      // await serviceClient.from('referral_codes').update({ status: 'available', user_id: null, email: null }).eq('code', code);
      return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
    }

    return NextResponse.json({ success: true, code })

  } catch (err: any) {
    console.error('Error in assign-code:', err)
    return NextResponse.json({ error: 'Error interno del servidor', details: err.message }, { status: 500 })
  }
}
