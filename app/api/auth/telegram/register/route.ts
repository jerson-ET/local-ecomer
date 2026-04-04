/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*     API: COMPLETAR REGISTRO CON TELEGRAM                                    */
/*                                                                              */
/*   POST /api/auth/telegram/register                                          */
/*   Body: {                                                                   */
/*     registrationToken: string,                                              */
/*     storeName: string,                                                      */
/*     email: string,           (para facturas)                                */
/*     referralCode?: string    (código de quien lo invitó)                    */
/*   }                                                                         */
/*                                                                              */
/*   Flujo:                                                                    */
/*   1. Decodifica y valida el registrationToken                               */
/*   2. Crea usuario en Supabase Auth                                          */
/*   3. Crea profile con telegram_id y referral_code propio                   */
/*   4. Crea la tienda del vendedor                                            */
/*   5. Vincula referido si se proporcionó código de invitación                */
/*   6. Activa trial de 7 días                                                 */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/server'
import { generateReferralCode, sendWelcomeMessage } from '@/lib/telegram/bot'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationToken, storeName, email, referralCode } = body

    /* ──────────────────────────────────────────────────────────────────── */
    /*  1. Validar el token de registro                                     */
    /* ──────────────────────────────────────────────────────────────────── */

    if (!registrationToken || !storeName || !email) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      )
    }

    let tokenData: { telegram_id: number; username: string; exp: number }
    try {
      tokenData = JSON.parse(Buffer.from(registrationToken, 'base64').toString())
    } catch {
      return NextResponse.json(
        { error: 'Token de registro inválido. Vuelve a verificar tu código.' },
        { status: 400 }
      )
    }

    if (Date.now() > tokenData.exp) {
      return NextResponse.json(
        { error: 'Tu sesión de registro expiró. Solicita un nuevo código OTP.' },
        { status: 400 }
      )
    }

    const { telegram_id, username } = tokenData
    const supabase = getServiceClient()

    /* ──────────────────────────────────────────────────────────────────── */
    /*  2. Verificar que no exista ya este usuario                          */
    /* ──────────────────────────────────────────────────────────────────── */

    const { data: exists } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegram_id)
      .maybeSingle()

    if (exists) {
      return NextResponse.json(
        { error: 'Ya tienes una cuenta. Usa "Iniciar Sesión" en lugar de registrarte.' },
        { status: 409 }
      )
    }

    /* ──────────────────────────────────────────────────────────────────── */
    /*  3. Verificar código de referido si fue proporcionado                 */
    /* ──────────────────────────────────────────────────────────────────── */

    let referrerId: string | null = null

    if (referralCode) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('referral_code', referralCode.toUpperCase().trim())
        .maybeSingle()

      if (!referrer) {
        return NextResponse.json(
          { error: 'El código de invitación no existe. Verifica y vuelve a intentar.' },
          { status: 400 }
        )
      }

      referrerId = referrer.id
    }

    /* ──────────────────────────────────────────────────────────────────── */
    /*  4. Crear usuario en Supabase Auth                                   */
    /* ──────────────────────────────────────────────────────────────────── */

    // Contraseña interna (el usuario nunca la usa, entra por OTP de Telegram)
    const internalPassword = `tg_${telegram_id}_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12)}`

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: internalPassword,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        telegram_id,
        telegram_username: username,
        name: storeName,
      },
    })

    if (authError || !authUser.user) {
      console.error('[register] Error creando auth user:', authError)

      if (authError?.message?.includes('already')) {
        return NextResponse.json(
          { error: 'Este correo electrónico ya está registrado.' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Error creando la cuenta. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    const userId = authUser.user.id

    /* ──────────────────────────────────────────────────────────────────── */
    /*  5. Crear profile + generar código de referido propio                 */
    /* ──────────────────────────────────────────────────────────────────── */

    const myReferralCode = generateReferralCode(storeName)
    const trialExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        name: storeName,
        role: 'seller',
        telegram_id,
        telegram_username: username,
        referral_code: myReferralCode,
        referred_by: referrerId,
        subscription_status: 'trial',
        subscription_expires_at: trialExpires.toISOString(),
        wallet_balance: 0,
      })

    if (profileError) {
      console.error('[register] Error creando profile:', profileError)
      // Cleanup: eliminar el auth user creado
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Error creando tu perfil. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    /* ──────────────────────────────────────────────────────────────────── */
    /*  6. Crear la tienda del vendedor                                     */
    /* ──────────────────────────────────────────────────────────────────── */

    const slug = storeName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const { error: storeError } = await supabase
      .from('stores')
      .insert({
        user_id: userId,
        name: storeName,
        slug: slug + '-' + Math.floor(Math.random() * 999),
        description: `Tienda de ${storeName}`,
        is_active: true,
        plan: 'free',
      })

    if (storeError) {
      console.error('[register] Error creando tienda:', storeError)
      // No es crítico, el usuario puede crearla después
    }

    /* ──────────────────────────────────────────────────────────────────── */
    /*  7. Vincular en red de referidos (si aplica)                         */
    /* ──────────────────────────────────────────────────────────────────── */

    if (referrerId && referralCode) {
      await supabase
        .from('referral_network')
        .insert({
          referrer_id: referrerId,
          referred_id: userId,
          referral_code_used: referralCode.toUpperCase().trim(),
          commission_amount: 500000, // $5,000 COP en centavos
          status: 'active',
        })
    }

    /* ──────────────────────────────────────────────────────────────────── */
    /*  8. Enviar bienvenida por Telegram                                   */
    /* ──────────────────────────────────────────────────────────────────── */

    await sendWelcomeMessage(telegram_id, storeName)

    /* ──────────────────────────────────────────────────────────────────── */
    /*  9. Iniciar sesión automáticamente                                   */
    /* ──────────────────────────────────────────────────────────────────── */

    const { data: signInData } = await supabase.auth.signInWithPassword({
      email,
      password: internalPassword,
    })

    return NextResponse.json({
      success: true,
      message: '¡Cuenta creada exitosamente!',
      session: {
        access_token: signInData.session?.access_token,
        refresh_token: signInData.session?.refresh_token,
      },
      user: {
        id: userId,
        name: storeName,
        email,
        referral_code: myReferralCode,
        subscription_status: 'trial',
        subscription_expires_at: trialExpires.toISOString(),
      },
    })
  } catch (err) {
    console.error('[register] Error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
