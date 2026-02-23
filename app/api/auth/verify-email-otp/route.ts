/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*     API: VERIFICAR CÓDIGO EMAIL OTP — /api/auth/verify-email-otp            */
/*                                                                              */
/*   Verifica que el código de 6 dígitos sea correcto y no haya expirado       */
/*   Si es tipo 'registration', crea el usuario en Supabase Auth + profile     */
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
        const { email, code, type = 'registration', nombre, password } = await request.json()

        /* ── Validaciones ── */
        if (!email || !code) {
            return NextResponse.json(
                { error: 'Correo y código son requeridos' },
                { status: 400 }
            )
        }

        if (code.length < 6) {
            return NextResponse.json(
                { error: 'El código debe tener 6 dígitos' },
                { status: 400 }
            )
        }

        const supabase = getAdminClient()

        /* ── Buscar código válido (no usado y no expirado) ── */
        const { data, error } = await supabase
            .from('email_verification_codes')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('code', code)
            .eq('type', type)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error || !data) {
            return NextResponse.json(
                { error: 'Código inválido o expirado. Solicita uno nuevo.' },
                { status: 400 }
            )
        }

        /* ── Marcar código como usado ── */
        await supabase
            .from('email_verification_codes')
            .update({ used: true })
            .eq('id', data.id)

        /* ── Si es registro, crear usuario en Supabase Auth ── */
        if (type === 'registration' && password) {
            /* Verificar si usuario ya existe */
            const { data: existingUsers } = await supabase.auth.admin.listUsers()
            const userExists = existingUsers?.users?.some(
                u => u.email?.toLowerCase() === email.toLowerCase()
            )

            if (userExists) {
                return NextResponse.json(
                    { error: 'Este correo ya está registrado. Inicia sesión.' },
                    { status: 409 }
                )
            }

            /* Crear usuario con email ya confirmado */
            const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
                email: email.toLowerCase(),
                password,
                email_confirm: true,  /* Ya verificamos con nuestro código */
                user_metadata: {
                    nombre: nombre || '',
                },
            })

            if (signUpError) {
                console.error('Error creando usuario:', signUpError)
                return NextResponse.json(
                    { error: signUpError.message },
                    { status: 400 }
                )
            }

            /* Guardar perfil */
            if (authData.user) {
                await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: email.toLowerCase(),
                    nombre: nombre || '',
                    role: 'buyer',
                    email_verified: true,
                })
            }

            return NextResponse.json({
                success: true,
                message: '¡Cuenta creada y verificada exitosamente!',
                type: 'registration',
                email: email.toLowerCase(),
            })
        }

        /* ── Si es recuperación, solo confirmamos que el código es válido ── */
        if (type === 'recovery') {
            return NextResponse.json({
                success: true,
                message: 'Código verificado. Ahora puedes cambiar tu contraseña.',
                type: 'recovery',
                email: email.toLowerCase(),
            })
        }

        /* ── Respuesta genérica ── */
        return NextResponse.json({
            success: true,
            message: 'Código verificado correctamente',
            email: email.toLowerCase(),
        })

    } catch (err) {
        console.error('Error en verify-email-otp:', err)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
