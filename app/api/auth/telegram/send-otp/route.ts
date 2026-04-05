/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*     API: ENVIAR OTP POR TELEGRAM                                            */
/*                                                                              */
/*   POST /api/auth/telegram/send-otp                                          */
/*   Body: { telegram_username: string }                                       */
/*                                                                              */
/*   Flujo:                                                                    */
/*   1. El usuario ingresa su @username de Telegram en la web                  */
/*   2. Buscamos si ya interactuó con nuestro bot (tiene telegram_id)          */
/*   3. Generamos código OTP de 6 dígitos                                      */
/*   4. Lo guardamos en verification_codes                                     */
/*   5. Se lo enviamos por el Bot de Telegram                                  */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/server'
import { sendOTPMessage, generateOTP } from '@/lib/telegram/bot'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const phoneNumber = String(body?.phone || '').replace(/[^\d+]/g, '')

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Ingresa tu número de celular' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    /* ──────────────────────────────────────────────────────────────────── */
    /*  1. Buscar si el usuario ya tiene telegram_id registrado            */
    /* ──────────────────────────────────────────────────────────────────── */

    // Primero buscamos en la base de datos del bot por el número de teléfono
    const { data: botUser } = await supabase
      .from('telegram_bot_users')
      .select('telegram_id, username, first_name')
      .eq('phone_number', phoneNumber)
      .maybeSingle()

    const telegramId = botUser?.telegram_id

    if (!telegramId) {
      return NextResponse.json(
        {
          error: 'No encontramos tu número. Primero abre @Localecomerbot en Telegram, presiona /start y dale a "Compartir Mi Número".',
          needsBot: true,
        },
        { status: 404 }
      )
    }

    /* ──────────────────────────────────────────────────────────────────── */
    /*  2. Generar y guardar código OTP                                     */
    /* ──────────────────────────────────────────────────────────────────── */

    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutos

    // Invalidar códigos anteriores
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('telegram_id', telegramId)
      .eq('used', false)

    // Insertar nuevo código
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        telegram_id: telegramId,
        code: otpCode,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

    if (insertError) {
      console.error('[send-otp] Error guardando código:', insertError)
      return NextResponse.json(
        { error: 'Error generando el código. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    /* ──────────────────────────────────────────────────────────────────── */
    /*  3. Enviar OTP por Telegram                                          */
    /* ──────────────────────────────────────────────────────────────────── */

    const sent = await sendOTPMessage(telegramId, otpCode)

    if (!sent) {
      return NextResponse.json(
        { error: 'No pudimos enviar el código por Telegram. Verifica que no hayas bloqueado al bot.' },
        { status: 500 }
      )
    }

    // Verificamos si existe un perfil para saber si es nuevo usuario
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      message: 'Código enviado a tu Telegram',
      isExistingUser: !!existingProfile,
    })
  } catch (err) {
    console.error('[send-otp] Error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
