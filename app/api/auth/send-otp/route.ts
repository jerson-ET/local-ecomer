/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*           API: ENVIAR CÓDIGO OTP — /api/auth/send-otp                       */
/*                                                                              */
/*   Genera un código de 6 dígitos y lo guarda en Supabase                     */
/*   El código expira en 5 minutos                                             */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/* Cliente con service_role para saltar RLS */
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function POST(request: Request) {
    try {
        const { phone, countryCode } = await request.json()

        if (!phone || !countryCode) {
            return NextResponse.json(
                { error: 'Teléfono e indicativo son requeridos' },
                { status: 400 }
            )
        }

        /* Limpiar número y formar el teléfono completo */
        const cleanPhone = phone.replace(/\D/g, '')
        const fullPhone = `${countryCode}${cleanPhone}`

        if (cleanPhone.length < 7 || cleanPhone.length > 15) {
            return NextResponse.json(
                { error: 'Número de teléfono inválido' },
                { status: 400 }
            )
        }

        /* Generar código de 6 dígitos */
        const code = Math.floor(100000 + Math.random() * 900000).toString()

        /* Expiración: 5 minutos desde ahora */
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

        const supabase = getAdminClient()

        /* Invalidar códigos previos de este número */
        await supabase
            .from('verification_codes')
            .update({ used: true })
            .eq('phone', fullPhone)
            .eq('used', false)

        /* Guardar nuevo código */
        const { error: insertError } = await supabase
            .from('verification_codes')
            .insert({
                phone: fullPhone,
                code,
                expires_at: expiresAt,
                used: false,
            })

        if (insertError) {
            console.error('Error guardando OTP:', insertError)
            return NextResponse.json(
                { error: 'Error al generar código. Intenta de nuevo.' },
                { status: 500 }
            )
        }

        /* ──────────────────────────────────────────────────────────────── */
        /*  AQUÍ podrías conectar un servicio SMS en el futuro:            */
        /*  await sendSMS(fullPhone, `Tu código es: ${code}`)              */
        /* ──────────────────────────────────────────────────────────────── */

        return NextResponse.json({
            success: true,
            message: 'Código enviado',
            /* ⚠️ SOLO PARA DESARROLLO — quitar en producción */
            devCode: code,
        })

    } catch (err) {
        console.error('Error en send-otp:', err)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
