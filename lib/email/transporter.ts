/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*          TRANSPORTER DE EMAIL — Gmail SMTP via Nodemailer                    */
/*                                                                              */
/*   Configura y exporta el transporter de Gmail para enviar correos            */
/*   Usa "App Password" de Google (requiere 2FA activo en la cuenta)           */
/*                                                                              */
/*   Variables de entorno requeridas:                                           */
/*     GMAIL_USER     → tu-correo@gmail.com                                    */
/*     GMAIL_APP_PASS → contraseña de aplicación de 16 caracteres               */
/*                                                                              */
/*   Límites de Gmail:                                                          */
/*     - Cuenta normal: ~500 emails/día                                         */
/*     - Google Workspace: ~2000 emails/día                                     */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import nodemailer from 'nodemailer'

/* ── Crear transporter de Gmail ── */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
    },
})

export default transporter

/* ── Helper para verificar conexión ── */
export async function verifyEmailConnection(): Promise<boolean> {
    try {
        await transporter.verify()
        console.log('✅ Conexión SMTP con Gmail verificada')
        return true
    } catch (error) {
        console.error('❌ Error de conexión SMTP:', error)
        return false
    }
}
