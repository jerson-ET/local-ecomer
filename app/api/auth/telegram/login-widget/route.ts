import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await request.json()
    const { hash, ...data } = user

    /* ──────────────────────────────────────────────────────────────────── */
    /*  1. Verificar el hash del widget                                     */
    /* ──────────────────────────────────────────────────────────────────── */

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) throw new Error('Token no configurado')

    // Formar el string de verificación (alfabéticamente)
    const dataCheckArr = Object.keys(data)
      .map(key => `${key}=${data[key]}`)
      .sort()
      .join('\n')

    // Secret Key = sha256(bot_token) en binario
    const secretKey = crypto.createHash('sha256').update(botToken).digest()

    // HMAC = hmac_sha256(secretKey, dataCheckArr) hex
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckArr).digest('hex')

    if (hmac !== hash) {
      return NextResponse.json({ error: 'Firma de seguridad no válida' }, { status: 403 })
    }

    /* ──────────────────────────────────────────────────────────────────── */
    /*  2. Procesar Login/Registro                                          */
    /* ──────────────────────────────────────────────────────────────────── */

    const telegramId = user.id
    const username = user.username?.toLowerCase() || ''
    const firstName = user.first_name || ''
    const supabase = getServiceClient()

    // Buscar perfil existente
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('telegram_id', telegramId)
      .maybeSingle()

    if (profile) {
      // ✅ USUARIO EXISTENTE: Login directo
      const internalPassword = `tg_${telegramId}_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12)}`
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: internalPassword
      })

      if (authError) return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 })

      return NextResponse.json({
        success: true,
        isNewUser: false,
        session: authData.session,
        user: profile
      })
    } else {
      // 🆕 USUARIO NUEVO: Devolver datos para completar registro
      const registrationToken = Buffer.from(JSON.stringify({
        telegram_id: telegramId,
        username,
        exp: Date.now() + 10 * 60 * 1000
      })).toString('base64')

      return NextResponse.json({
        success: true,
        isNewUser: true,
        needsRegistration: true,
        registrationToken,
        telegramData: {
          telegram_id: telegramId,
          telegram_username: username,
          first_name: firstName
        }
      })
    }

  } catch (err) {
    console.error('[login-widget] Error:', err)
    return NextResponse.json({ error: 'Error al procesar login' }, { status: 500 })
  }
}
