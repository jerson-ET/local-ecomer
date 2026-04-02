import { NextRequest, NextResponse } from 'next/server'
import { createClient, getServiceClient } from '@/lib/supabase/server'

// Generar código de 5 dígitos único
function generateReferralCode() {
  return Math.floor(10000 + Math.random() * 90000).toString()
}

// Acción: Recuperar datos de afiliado
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Usar Service Role para obtener metadata completa confiable
    const serviceClient = getServiceClient()
    const { data: authUser, error: authError } = await serviceClient.auth.admin.getUserById(user.id)
    
    if (authError || !authUser.user) {
      console.error('[AFFILIATE] Error fetching user:', authError)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const metadata = authUser.user.user_metadata || {}

    // Si no tiene código, generarlo de una vez
    if (!metadata.referral_code) {
      const code = generateReferralCode()
      await serviceClient.auth.admin.updateUserById(user.id, {
        user_metadata: { ...metadata, referral_code: code }
      })
      metadata.referral_code = code
    }

    return NextResponse.json({
      referralCode: metadata.referral_code,
      nequiNumber: metadata.nequi_number || null,
      prospects: metadata.affiliate_prospects || [],
      earnings: metadata.earnings || [],
      nombre: metadata.nombre || user.user_metadata?.nombre || 'Usuario'
    })
  } catch (error) {
    console.error('[AFFILIATE] GET Error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { action, ...payload } = body

    const serviceClient = getServiceClient()
    const { data: authUser } = await serviceClient.auth.admin.getUserById(user.id)
    const metadata = authUser.user?.user_metadata || {}

    if (action === 'register_prospect') {
      const { name, whatsapp, cedula, location, referrerName } = payload
      if (!name || !whatsapp || !cedula) return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })
      
      const newProspect = {
        id: Math.random().toString(36).substring(7),
        name,
        whatsapp,
        cedula,
        location: location || 'No especificada',
        referrerName: referrerName || metadata.nombre || 'Usuario',
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      const prospects = Array.isArray(metadata.affiliate_prospects) ? metadata.affiliate_prospects : []
      
      const { error: updateErr } = await serviceClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...metadata,
          affiliate_prospects: [newProspect, ...prospects]
        }
      })

      if (updateErr) return NextResponse.json({ error: 'Error al persistir prospecto' }, { status: 500 })
      return NextResponse.json({ success: true, prospect: newProspect })
    }

    if (action === 'update_nequi') {
      const { nequiNumber } = payload
      if (!nequiNumber) return NextResponse.json({ error: 'Número requerido' }, { status: 400 })

      const { error: updateErr } = await serviceClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...metadata,
          nequi_number: nequiNumber
        }
      })

      if (updateErr) return NextResponse.json({ error: 'Error al actualizar Nequi' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('[AFFILIATE] POST Error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
