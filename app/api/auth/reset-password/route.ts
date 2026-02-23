/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*   API: RECUPERAR CONTRASEÑA — /api/auth/reset-password                      */
/*                                                                              */
/*   Permite cambiar la contraseña después de verificar OTP                    */
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
        const { phone, countryCode, newPassword } = await request.json()

        if (!phone || !countryCode || !newPassword) {
            return NextResponse.json(
                { error: 'Todos los campos son requeridos' },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            )
        }

        const cleanPhone = phone.replace(/\D/g, '')
        const fullPhone = `${countryCode}${cleanPhone}`
        const email = `${fullPhone.replace('+', '')}@localecomer.app`

        const supabase = getAdminClient()

        /* Verificar que el teléfono fue verificado recientemente */
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

        const verifiedAt = new Date(verifiedCode.created_at)
        const now = new Date()
        const diffMinutes = (now.getTime() - verifiedAt.getTime()) / (1000 * 60)

        if (diffMinutes > 10) {
            return NextResponse.json(
                { error: 'La verificación expiró. Solicita un nuevo código.' },
                { status: 400 }
            )
        }

        /* Buscar usuario por email */
        const { data: users } = await supabase.auth.admin.listUsers()
        const user = users?.users?.find((u) => u.email === email)

        if (!user) {
            return NextResponse.json(
                { error: 'No se encontró una cuenta con este número' },
                { status: 404 }
            )
        }

        /* Actualizar contraseña */
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        )

        if (updateError) {
            console.error('Error actualizando contraseña:', updateError)
            return NextResponse.json(
                { error: 'Error al actualizar la contraseña' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: '¡Contraseña actualizada! Ya puedes iniciar sesión.',
        })

    } catch (err) {
        console.error('Error en reset-password:', err)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
