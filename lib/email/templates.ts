/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*          PLANTILLAS DE EMAIL — HTML bonito para los correos                  */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'LocalEcomer'

/* ── Template de verificación de registro ── */
export function otpRegistrationTemplate(code: string, nombre: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Verificación</title>
</head>
<body style="margin:0; padding:0; background-color:#0a0a0a; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a; padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%); border-radius:16px; overflow:hidden; border:1px solid rgba(138,43,226,0.3);">
                    
                    <!-- Header con gradiente -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#8a2be2,#00d4ff); padding:30px 40px; text-align:center;">
                            <h1 style="margin:0; color:#fff; font-size:24px; font-weight:700; letter-spacing:1px;">
                                🛒 ${APP_NAME}
                            </h1>
                            <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px;">
                                Verificación de cuenta
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido -->
                    <tr>
                        <td style="padding:40px;">
                            <p style="color:#e0e0e0; font-size:16px; margin:0 0 10px;">
                                ¡Hola <strong style="color:#00d4ff;">${nombre}</strong>! 👋
                            </p>
                            <p style="color:#b0b0b0; font-size:14px; margin:0 0 30px; line-height:1.6;">
                                Gracias por registrarte en ${APP_NAME}. Usa el siguiente código para verificar tu correo electrónico:
                            </p>

                            <!-- Código OTP -->
                            <div style="background:rgba(138,43,226,0.15); border:2px solid rgba(138,43,226,0.4); border-radius:12px; padding:25px; text-align:center; margin:0 0 30px;">
                                <p style="margin:0 0 8px; color:#b0b0b0; font-size:12px; text-transform:uppercase; letter-spacing:2px;">
                                    Tu código de verificación
                                </p>
                                <p style="margin:0; color:#00d4ff; font-size:36px; font-weight:700; letter-spacing:12px; font-family:'Courier New',monospace;">
                                    ${code}
                                </p>
                            </div>

                            <p style="color:#888; font-size:13px; margin:0 0 5px;">
                                ⏰ Este código expira en <strong style="color:#feca57;">5 minutos</strong>.
                            </p>
                            <p style="color:#888; font-size:13px; margin:0;">
                                🔒 Si no solicitaste este código, ignora este correo.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 40px 30px; border-top:1px solid rgba(255,255,255,0.05); text-align:center;">
                            <p style="margin:0; color:#555; font-size:12px;">
                                © ${new Date().getFullYear()} ${APP_NAME} — Tu centro comercial digital
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
}

/* ── Template de recuperación de contraseña ── */
export function otpRecoveryTemplate(code: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar Contraseña</title>
</head>
<body style="margin:0; padding:0; background-color:#0a0a0a; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a; padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%); border-radius:16px; overflow:hidden; border:1px solid rgba(138,43,226,0.3);">

                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#e74c3c,#f39c12); padding:30px 40px; text-align:center;">
                            <h1 style="margin:0; color:#fff; font-size:24px; font-weight:700; letter-spacing:1px;">
                                🔐 ${APP_NAME}
                            </h1>
                            <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px;">
                                Recuperar contraseña
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido -->
                    <tr>
                        <td style="padding:40px;">
                            <p style="color:#e0e0e0; font-size:16px; margin:0 0 10px;">
                                Solicitud de recuperación 🔑
                            </p>
                            <p style="color:#b0b0b0; font-size:14px; margin:0 0 30px; line-height:1.6;">
                                Recibimos una solicitud para restablecer tu contraseña. Usa este código:
                            </p>

                            <!-- Código OTP -->
                            <div style="background:rgba(231,76,60,0.15); border:2px solid rgba(231,76,60,0.4); border-radius:12px; padding:25px; text-align:center; margin:0 0 30px;">
                                <p style="margin:0 0 8px; color:#b0b0b0; font-size:12px; text-transform:uppercase; letter-spacing:2px;">
                                    Código de recuperación
                                </p>
                                <p style="margin:0; color:#f39c12; font-size:36px; font-weight:700; letter-spacing:12px; font-family:'Courier New',monospace;">
                                    ${code}
                                </p>
                            </div>

                            <p style="color:#888; font-size:13px; margin:0 0 5px;">
                                ⏰ Este código expira en <strong style="color:#feca57;">5 minutos</strong>.
                            </p>
                            <p style="color:#888; font-size:13px; margin:0;">
                                🔒 Si no solicitaste restablecer tu contraseña, ignora este correo.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 40px 30px; border-top:1px solid rgba(255,255,255,0.05); text-align:center;">
                            <p style="margin:0; color:#555; font-size:12px;">
                                © ${new Date().getFullYear()} ${APP_NAME} — Tu centro comercial digital
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
}
