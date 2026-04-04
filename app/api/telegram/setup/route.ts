/* ═══════════════════════════════════════════════════════════════════════════ */
/*     API: CONFIGURAR WEBHOOK DEL BOT DE TELEGRAM                            */
/*                                                                              */
/*   GET /api/telegram/setup                                                   */
/*   Configura el webhook del bot para que apunte a nuestra API.               */
/*   SOLO EJECUTAR UNA VEZ o al cambiar de dominio.                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server'
import { setWebhook, getWebhookInfo } from '@/lib/telegram/bot'

export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localecomer.com'
    const webhookUrl = `${appUrl}/api/telegram/webhook`

    // Configurar el webhook
    const result = await setWebhook(webhookUrl)

    // Obtener info actual
    const info = await getWebhookInfo()

    return NextResponse.json({
      message: 'Webhook configurado',
      webhook_url: webhookUrl,
      result,
      current_info: info,
    })
  } catch (err) {
    console.error('[telegram/setup] Error:', err)
    return NextResponse.json(
      { error: 'Error configurando webhook' },
      { status: 500 }
    )
  }
}
