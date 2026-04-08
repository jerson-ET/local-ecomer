import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Código inválido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const upperCode = code.toUpperCase().trim()

    // No se puede usar propio código
    if (user.user_metadata?.referral_code === upperCode) {
      return NextResponse.json({ valid: false, error: 'No puedes usar tu propio código' })
    }

    const serviceClient = getServiceClient()

    // Verificar si existe y pertenece a alguien
    const { data, error } = await serviceClient
      .from('referral_codes')
      .select('user_id, status')
      .eq('code', upperCode)
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Código no encontrado' })
    }

    if (data.status !== 'assigned' || !data.user_id) {
      return NextResponse.json({ valid: false, error: 'Código inactivo o no asignado aún' })
    }

    // 1. Lock the code into User A's metadata so they can never change it
    const userAMeta = user.user_metadata || {};
    
    // Ensure User A has a referral_code to display in the MLM tree
    const userAReferralCode = userAMeta.referral_code || Math.floor(10000 + Math.random() * 90000).toString();

    // Actualizamos a User A (quien escribe el código)
    await serviceClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...userAMeta,
        referred_by: upperCode,
        referral_code: userAReferralCode
      }
    });

    // 2. Add User A uniquely to User B's (the referrer) network tree
    const { data: userBData } = await serviceClient.auth.admin.getUserById(data.user_id);
    if (userBData?.user) {
       const userBMeta = userBData.user.user_metadata || {};
       const prospects = Array.isArray(userBMeta.affiliate_prospects) ? userBMeta.affiliate_prospects : [];
       
       // Verificar que User A no esté repetido
       if (!prospects.some((p: any) => p.id === user.id)) {
         const newProspect = {
           id: user.id,
           name: userAMeta.nombre || user.email?.split('@')[0] || 'Invitado',
           whatsapp: userAMeta.whatsapp || '',
           status: 'pending', // Pending payment validation
           referralCode: userAReferralCode, // His own code so the referrer sees it
           createdAt: new Date().toISOString()
         }
         await serviceClient.auth.admin.updateUserById(data.user_id, {
           user_metadata: {
             ...userBMeta,
             affiliate_prospects: [newProspect, ...prospects]
           }
         });
       }
    }

    // Código válido
    return NextResponse.json({ valid: true, message: '¡Felicidades! Código enlazado fijamente. Tu tarifa especial de $25.000 COP está activa.' })

  } catch (err: any) {
    console.error('Error in validate-code:', err)
    return NextResponse.json({ valid: false, error: 'Error del servidor' }, { status: 500 })
  }
}
