/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*         API: VERIFICAR CÓDIGO OTP — /api/auth/verify-otp                    */
/*                                                                              */
/*   Verifica que el código ingresado sea correcto y no haya expirado          */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function POST(request: Request) {
    try {
        const { phone, countryCode, code } = await request.json()

        if (!phone || !countryCode || !code) {
            return NextResponse.json(
                { error: 'Todos los campos son requeridos' },
                { status: 400 }
            )
        }

        const cleanPhone = phone.replace(/\D/g, '')
        const fullPhone = `${countryCode}${cleanPhone}`

        const supabase = getAdminClient()

        /* Buscar código válido (no usado y no expirado) */
        const { data, error } = await supabase
            .from('verification_codes')
            .select('*')
            .eq('phone', fullPhone)
            .eq('code', code)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error || !data) {
            return NextResponse.json(
                { error: 'Código inválido o expirado' },
                { status: 400 }
            )
        }

        /* Marcar código como usado */
        await supabase
            .from('verification_codes')
            .update({ used: true })
            .eq('id', data.id)

        return NextResponse.json({
            success: true,
            message: 'Código verificado correctamente',
            verifiedPhone: fullPhone,
        })

    } catch (err) {
        console.error('Error en verify-otp:', err)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
