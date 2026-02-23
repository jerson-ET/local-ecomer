/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*       API: ENVIAR CÓDIGO OTP POR EMAIL — /api/auth/send-email-otp           */
/*                                                                              */
/*   Genera un código de 6 dígitos, lo guarda en tabla email_verification_codes */
/*   y lo envía al correo del usuario usando Gmail SMTP (Nodemailer)           */
/*                                                                              */
/*   Límite: Gmail permite ~500 emails/día con cuenta normal                    */
/*   Para 80 emails/día estamos cómodamente dentro del límite                   */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import transporter from '@/lib/email/transporter'
import { otpRegistrationTemplate, otpRecoveryTemplate } from '@/lib/email/templates'

/* Cliente con service_role para saltar RLS */
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/* ── Rate limiting simple en memoria ── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(email: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(email)

    if (!entry || now > entry.resetAt) {
        /* Nueva ventana de 1 hora */
        rateLimitMap.set(email, { count: 1, resetAt: now + 60 * 60 * 1000 })
        return true
    }

    if (entry.count >= 5) {
        /* Máximo 5 códigos por hora por email */
        return false
    }

    entry.count++
    return true
}

export async function POST(request: Request) {
    try {
        const { email, nombre, type = 'registration' } = await request.json()

        /* ── Validaciones ── */
        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Correo electrónico inválido' },
                { status: 400 }
            )
        }

        /* ── Rate limiting ── */
        if (!checkRateLimit(email)) {
            return NextResponse.json(
                { error: 'Demasiados intentos. Espera 1 hora.' },
                { status: 429 }
            )
        }

        /* ── Verificar que Gmail está configurado ── */
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
            console.error('❌ GMAIL_USER o GMAIL_APP_PASS no configurados en .env.local')
            return NextResponse.json(
                { error: 'Servicio de correo no configurado. Contacta al administrador.' },
                { status: 500 }
            )
        }

        /* ── Generar código de 6 dígitos ── */
        const code = Math.floor(100000 + Math.random() * 900000).toString()

        /* ── Expiración: 5 minutos ── */
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

        const supabase = getAdminClient()

        /* ── Invalidar códigos previos de este email ── */
        await supabase
            .from('email_verification_codes')
            .update({ used: true })
            .eq('email', email.toLowerCase())
            .eq('used', false)

        /* ── Guardar nuevo código ── */
        const { error: insertError } = await supabase
            .from('email_verification_codes')
            .insert({
                email: email.toLowerCase(),
                code,
                type,  /* 'registration' o 'recovery' */
                expires_at: expiresAt,
                used: false,
            })

        if (insertError) {
            console.error('Error guardando código:', insertError)
            return NextResponse.json(
                { error: 'Error al generar código. Intenta de nuevo.' },
                { status: 500 }
            )
        }

        /* ── Seleccionar plantilla según tipo ── */
        const htmlContent = type === 'recovery'
            ? otpRecoveryTemplate(code)
            : otpRegistrationTemplate(code, nombre || 'Usuario')

        const subject = type === 'recovery'
            ? `🔐 Código de recuperación — ${process.env.NEXT_PUBLIC_APP_NAME || 'LocalEcomer'}`
            : `✅ Código de verificación — ${process.env.NEXT_PUBLIC_APP_NAME || 'LocalEcomer'}`

        /* ── Enviar correo con Gmail SMTP ── */
        await transporter.sendMail({
            from: `"${process.env.NEXT_PUBLIC_APP_NAME || 'LocalEcomer'}" <${process.env.GMAIL_USER}>`,
            to: email,
            subject,
            html: htmlContent,
        })

        console.log(`📧 Código enviado a ${email} (tipo: ${type})`)

        return NextResponse.json({
            success: true,
            message: `Código enviado a ${email}`,
        })

    } catch (err: any) {
        console.error('Error en send-email-otp:', err)

        /* ── Mensajes de error más útiles ── */
        if (err.code === 'EAUTH') {
            return NextResponse.json(
                { error: 'Error de autenticación con Gmail. Verifica GMAIL_USER y GMAIL_APP_PASS.' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { error: 'Error al enviar el correo. Intenta de nuevo.' },
            { status: 500 }
        )
    }
}
