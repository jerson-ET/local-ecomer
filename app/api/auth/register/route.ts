/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*       API: REGISTRO CON TELÉFONO VERIFICADO — /api/auth/register            */
/*                                                                              */
/*   Registra al usuario en Supabase Auth + tabla profiles                     */
/*   Solo funciona después de verificar OTP                                    */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: Request) {
  try {
    const { nombre, phone, countryCode, password } = await request.json()

    if (!nombre || !phone || !countryCode || !password) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const cleanPhone = phone.replace(/\D/g, '')
    const fullPhone = `${countryCode}${cleanPhone}`

    /* Usar email ficticio basado en teléfono para Supabase Auth */
    const email = `${fullPhone.replace('+', '')}@localecomer.app`

    const supabase = getAdminClient()

    /* Verificar que el teléfono fue verificado (código usado recientemente) */
    const { data: verifiedCode } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone', fullPhone)
      .eq('used', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!verifiedCode) {
      return NextResponse.json(
        { error: 'Primero debes verificar tu número de teléfono' },
        { status: 400 }
      )
    }

    /* Verificar que la verificación fue reciente (máximo 10 minutos) */
    const verifiedAt = new Date(verifiedCode.created_at)
    const now = new Date()
    const diffMinutes = (now.getTime() - verifiedAt.getTime()) / (1000 * 60)

    if (diffMinutes > 10) {
      return NextResponse.json(
        { error: 'La verificación expiró. Solicita un nuevo código.' },
        { status: 400 }
      )
    }

    /* 1. Crear usuario en Supabase Auth */
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true /* Confirmar automáticamente */,
      user_metadata: {
        nombre,
        telefono: fullPhone,
        country_code: countryCode,
      },
    })

    if (signUpError) {
      if (
        signUpError.message.includes('already been registered') ||
        signUpError.message.includes('already exists')
      ) {
        return NextResponse.json(
          { error: 'Este número ya está registrado. Inicia sesión.' },
          { status: 409 }
        )
      }
      console.error('Error signup:', signUpError)
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    /* 2. Guardar perfil en tabla profiles */
    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        nombre,
        telefono: fullPhone,
        country_code: countryCode,
        phone_verified: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: '¡Cuenta creada exitosamente!',
      email /* Para que el frontend pueda hacer login automático */,
    })
  } catch (err) {
    console.error('Error en register:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
