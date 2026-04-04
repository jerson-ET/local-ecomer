/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*       TELEGRAM BOT — Librería de conexión con la API de Telegram            */
/*                                                                              */
/*   Propósito   : Enviar mensajes OTP, notificaciones y gestionar comandos    */
/*   Uso         : API Routes del servidor (NUNCA en el cliente)               */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────── */
/*                            CONFIGURACIÓN                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

/* ─────────────────────────────────────────────────────────────────────────── */
/*                              TIPOS                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: { id: number; type: string }
  date: number
  text?: string
  photo?: Array<{ file_id: string; file_unique_id: string; width: number; height: number }>
  caption?: string
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                      FUNCIONES DE ENVÍO DE MENSAJES                         */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Envía un mensaje de texto a un chat de Telegram
 */
export async function sendMessage(chatId: number | string, text: string, options?: {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  reply_markup?: unknown
}) {
  const response = await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || 'HTML',
      reply_markup: options?.reply_markup,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    console.error('[Telegram Bot] Error enviando mensaje:', err)
    return null
  }

  return response.json()
}

/**
 * Envía un código OTP al usuario por Telegram
 */
export async function sendOTPMessage(chatId: number, code: string) {
  const text = `🔐 <b>Código de Verificación LocalEcomer</b>\n\n` +
    `Tu código es: <code>${code}</code>\n\n` +
    `⏱ Este código expira en <b>5 minutos</b>.\n` +
    `⚠️ No compartas este código con nadie.`

  return sendMessage(chatId, text)
}

/**
 * Envía una bienvenida al nuevo usuario en Telegram
 */
export async function sendWelcomeMessage(chatId: number, userName: string) {
  const text = `🎉 <b>¡Bienvenido a LocalEcomer, ${userName}!</b>\n\n` +
    `Tu cuenta ha sido creada exitosamente.\n\n` +
    `Puedo ayudarte con:\n` +
    `📦 /subir — Subir un producto (envíame la foto + descripción)\n` +
    `🏪 /mitienda — Ver tu tienda\n` +
    `👥 /invitar — Generar link de invitación\n` +
    `💰 /ganancias — Ver comisiones de referidos\n` +
    `❓ /ayuda — Ayuda general\n\n` +
    `¡Empieza a vender hoy! 🚀`

  return sendMessage(chatId, text)
}

/**
 * Envía el link de invitación del usuario
 */
export async function sendReferralLink(chatId: number, referralCode: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localecomer.com'
  const link = `${appUrl}?ref=${referralCode}`

  const text = `👥 <b>Tu Link de Invitación</b>\n\n` +
    `Comparte este enlace y gana <b>$5.000 COP</b> cada vez que un invitado pague su membresía:\n\n` +
    `🔗 ${link}\n\n` +
    `Tu código: <code>${referralCode}</code>\n\n` +
    `💡 <i>Reenvía este mensaje a emprendedores que quieran vender online.</i>`

  return sendMessage(chatId, text)
}

/**
 * Envía notificación de pago de referido
 */
export async function sendReferralPaymentNotification(chatId: number, referredName: string, amount: number) {
  const text = `💰 <b>¡Comisión Recibida!</b>\n\n` +
    `Tu invitado <b>${referredName}</b> pagó su membresía.\n` +
    `Se han acreditado <b>$${(amount / 100).toLocaleString('es-CO')}</b> COP a tu billetera.\n\n` +
    `Sigue invitando para ganar más 🚀`

  return sendMessage(chatId, text)
}

/**
 * Obtener información de un usuario por su username 
 * (No disponible directamente en Telegram Bot API, se resuelve cuando el usuario interactúa con el bot)
 */

/* ─────────────────────────────────────────────────────────────────────────── */
/*                    FUNCIONES DE CONFIGURACIÓN DEL BOT                       */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Configura el webhook del bot para recibir actualizaciones
 */
export async function setWebhook(url: string) {
  const response = await fetch(`${TELEGRAM_API_BASE}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      allowed_updates: ['message'],
      drop_pending_updates: true,
    }),
  })

  return response.json()
}

/**
 * Obtiene información sobre el webhook actual
 */
export async function getWebhookInfo() {
  const response = await fetch(`${TELEGRAM_API_BASE}/getWebhookInfo`)
  return response.json()
}

/**
 * Genera un código OTP aleatorio de 6 dígitos
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Genera un código de referido único basado en el nombre
 */
export function generateReferralCode(name: string): string {
  const clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-zA-Z0-9]/g, '')   // solo alfanumérico
    .substring(0, 8)
    .toUpperCase()
  const random = Math.floor(10 + Math.random() * 90) // 2 dígitos
  return `${clean}${random}`
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FIN DEL ARCHIVO                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
