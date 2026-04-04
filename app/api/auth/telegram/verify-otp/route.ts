/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*     API: VERIFICAR OTP DE TELEGRAM + LOGIN/REGISTRO                         */
/*                                                                              */
/*   POST /api/auth/telegram/verify-otp                                        */
/*   Body: { telegram_username: string, code: string }                         */
/*                                                                              */
/*   Flujo:                                                                    */
/*   1. Verifica que el código OTP sea correcto y no haya expirado             */
/*   2. Si el usuario ya existe → crea sesión                                  */
/*   3. Si es nuevo → devuelve flag needsRegistration: true                    */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const telegramUsername = String(body?.telegram_username || '').replace('@', '').trim().toLowerCase()
    const code = String(body?.code || '').trim()

    if (!telegramUsername || !code) {
      return NextResponse.json(
        { error: 'Usuario de Telegram y código son requeridos' },
        { status: 400 }
      )
    }

    if (code.length !== 6) {
      return NextResponse.json(
        { error: 'El código debe tener 6 dígitos' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    /* ──────────────────────────────────────────────────────────────────── */
    /*  1. Obtener telegram_id del usuario                                  */
    /* ──────────────────────────────────────────────────────────────────── */

    // Primero intentar por profile existente
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, telegram_id, telegram_username, name, email, role')
      .eq('telegram_username', telegramUsername)
      .maybeSingle()

    // Si no, buscar en tabla temporal del bot
    const { data: botUser } = await supabase
      .from('telegram_bot_users')
      .select('telegram_id, username, first_name')
      .eq('username', telegramUsername)
      .maybeSingle()

    const telegramId = existingProfile?.telegram_id || botUser?.telegram_id

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Usuario de Telegram no encontrado. Inicia @Localecomerbot primero.' },
        { status: 404 }
      )
    }

    /* ──────────────────────────────────────────────────────────────────── */
    /*  2. Verificar el código OTP                                          */
    /* ──────────────────────────────────────────────────────────────────── */

    const { data: otpRecord, error: otpError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('telegram_id', telegramId)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Código incorrecto o expirado. Solicita uno nuevo.' },
        { status: 400 }
      )
    }

    // Marcar código como usado
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', otpRecord.id)

    /* ──────────────────────────────────────────────────────────────────── */
    /*  3. Si el usuario YA existe → crear sesión                           */
    /* ──────────────────────────────────────────────────────────────────── */

    if (existingProfile) {
      // Generar un custom token para iniciar sesión vía Supabase
      // Usamos signInWithPassword con una contraseña interna generada
      const internalPassword = `tg_${telegramId}_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12)}`

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: existingProfile.email,
        password: internalPassword,
      })

      if (signInError) {
        console.error('[verify-otp] Error signin:', signInError)
        return NextResponse.json(
          { error: 'Error iniciando sesión. Contacta soporte.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        isNewUser: false,
        session: {
          access_token: signInData.session?.access_token,
          refresh_token: signInData.session?.refresh_token,
        },
        user: {
          id: existingProfile.id,
          name: existingProfile.name,
          email: existingProfile.email,
          role: existingProfile.role,
        },
      })
    }

    /* ──────────────────────────────────────────────────────────────────── */
    /*  4. Si es usuario NUEVO → indicar que necesita registrarse           */
    /* ──────────────────────────────────────────────────────────────────── */

    return NextResponse.json({
      success: true,
      isNewUser: true,
      needsRegistration: true,
      telegramData: {
        telegram_id: telegramId,
        telegram_username: telegramUsername,
        first_name: botUser?.first_name || '',
      },
      // Token temporal para completar registro (expira en 10 min)
      registrationToken: Buffer.from(
        JSON.stringify({
          telegram_id: telegramId,
          username: telegramUsername,
          exp: Date.now() + 10 * 60 * 1000,
        })
      ).toString('base64'),
    })
  } catch (err) {
    console.error('[verify-otp] Error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
