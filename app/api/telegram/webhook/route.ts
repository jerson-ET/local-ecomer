/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*     API: WEBHOOK DEL BOT DE TELEGRAM                                        */
/*                                                                              */
/*   POST /api/telegram/webhook                                                */
/*                                                                              */
/*   Recibe las actualizaciones del bot de Telegram.                           */
/*   Cuando un usuario le escribe al bot, Telegram nos envía el mensaje aquí.  */
/*                                                                              */
/*   Comandos soportados:                                                      */
/*   /start    — Registra al usuario en la tabla temporal del bot               */
/*   /invitar  — Envía al usuario su link de referido                          */
/*   /mitienda — Envía el link directo a su tienda                             */
/*   /ganancias — Muestra resumen de comisiones                                */
/*   /ayuda    — Mostrar lista de comandos                                     */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/server'
import {
  sendMessage,
  sendReferralLink,
  type TelegramUpdate,
} from '@/lib/telegram/bot'

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()
    const message = update.message

    if (!message || !message.from) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const telegramId = message.from.id
    const username = message.from.username || ''
    const firstName = message.from.first_name || ''
    const text = message.text?.trim() || ''

    const supabase = getServiceClient()

    /* ──────────────────────────────────────────────────────────────────── */
    /*  Guardar/actualizar usuario en telegram_bot_users                    */
    /*  (tabla temporal para vincular username ↔ telegram_id)              */
    /* ──────────────────────────────────────────────────────────────────── */

    await supabase
      .from('telegram_bot_users')
      .upsert(
        {
          telegram_id: telegramId,
          username: username.toLowerCase(),
          first_name: firstName,
          chat_id: chatId,
          last_interaction: new Date().toISOString(),
        },
        { onConflict: 'telegram_id' }
      )

    /* ──────────────────────────────────────────────────────────────────── */
    /*  Procesar comandos                                                   */
    /* ──────────────────────────────────────────────────────────────────── */

    const command = (text.split(' ')[0] ?? '').toLowerCase()

    switch (command) {
      /* ─── /start ─── */
      case '/start': {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localecomer.com'
        
        // Verificar si hay un parámetro de referido (deep link)
        const parts = text.split(' ')
        let refNote = ''
        if (parts.length > 1) {
          const refCode = parts[1]
          refNote = `\n\n📎 Tienes una invitación con el código: <code>${refCode}</code>. Úsalo al registrarte.`
        }

        await sendMessage(chatId,
          `👋 <b>¡Hola ${firstName}!</b>\n\n` +
          `Soy el asistente oficial de <b>LocalEcomer</b> 🏪\n\n` +
          `Tu cuenta de Telegram ya está vinculada. Ahora puedes registrarte o iniciar sesión en nuestra plataforma:\n\n` +
          `🔗 <a href="${appUrl}">Ir a LocalEcomer</a>${refNote}\n\n` +
          `Escribe /ayuda para ver todos mis comandos.`
        )
        break
      }

      /* ─── /invitar ─── */
      case '/invitar': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('referral_code, name')
          .eq('telegram_id', telegramId)
          .maybeSingle()

        if (!profile?.referral_code) {
          await sendMessage(chatId,
            `❌ Aún no tienes una cuenta en LocalEcomer.\n\n` +
            `Regístrate primero en la plataforma y luego podrás invitar amigos.`
          )
        } else {
          await sendReferralLink(chatId, profile.referral_code)
        }
        break
      }

      /* ─── /mitienda ─── */
      case '/mitienda': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('telegram_id', telegramId)
          .maybeSingle()

        if (!profile) {
          await sendMessage(chatId, '❌ No tienes cuenta aún. Regístrate primero en LocalEcomer.')
          break
        }

        const { data: store } = await supabase
          .from('stores')
          .select('name, slug')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (!store) {
          await sendMessage(chatId, '🏪 Aún no has creado tu tienda. Entra a LocalEcomer para crear una.')
        } else {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localecomer.com'
          await sendMessage(chatId,
            `🏪 <b>${store.name}</b>\n\n` +
            `Tu tienda está en:\n🔗 <a href="${appUrl}/tienda/${store.slug}">${appUrl}/tienda/${store.slug}</a>\n\n` +
            `Panel de control:\n🔗 <a href="${appUrl}/dashboard">${appUrl}/dashboard</a>`
          )
        }
        break
      }

      /* ─── /ganancias ─── */
      case '/ganancias': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, wallet_balance')
          .eq('telegram_id', telegramId)
          .maybeSingle()

        if (!profile) {
          await sendMessage(chatId, '❌ No tienes cuenta aún.')
          break
        }

        const { data: referrals, error: refError } = await supabase
          .from('referral_network')
          .select(`
            referred_id,
            status,
            created_at,
            profiles!referral_network_referred_id_fkey (name, subscription_status, subscription_expires_at)
          `)
          .eq('referrer_id', profile.id)

        if (refError || !referrals?.length) {
          await sendMessage(chatId,
            `💰 <b>Tus Ganancias</b>\n\n` +
            `Saldo: <b>$${((profile.wallet_balance || 0) / 100).toLocaleString('es-CO')}</b> COP\n\n` +
            `Aún no tienes invitados. Comparte tu link con /invitar`
          )
        } else {
          let list = ''
          for (const ref of referrals) {
            const p = ref.profiles as unknown as { name: string; subscription_status: string; subscription_expires_at: string }
            const daysLeft = p?.subscription_expires_at
              ? Math.max(0, Math.ceil((new Date(p.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
              : 0
            const statusEmoji = p?.subscription_status === 'active' ? '🟢' : p?.subscription_status === 'trial' ? '🟡' : '🔴'
            list += `${statusEmoji} <b>${p?.name || 'Sin nombre'}</b> — ${daysLeft} días restantes\n`
          }

          await sendMessage(chatId,
            `💰 <b>Tus Ganancias</b>\n\n` +
            `Saldo: <b>$${((profile.wallet_balance || 0) / 100).toLocaleString('es-CO')}</b> COP\n` +
            `Invitados: <b>${referrals.length}</b>\n\n` +
            `📋 <b>Tu Red:</b>\n${list}\n` +
            `Ganas $5.000 COP cada vez que un invitado paga su membresía.`
          )
        }
        break
      }

      /* ─── /ayuda ─── */
      case '/ayuda': {
        await sendMessage(chatId,
          `📚 <b>Comandos Disponibles</b>\n\n` +
          `📦 /subir — Subir producto (envía foto + descripción)\n` +
          `🏪 /mitienda — Ver tu tienda\n` +
          `👥 /invitar — Generar link de invitación\n` +
          `💰 /ganancias — Ver comisiones de referidos\n` +
          `❓ /ayuda — Esta ayuda\n\n` +
          `<i>Más funciones próximamente...</i>`
        )
        break
      }

      /* ─── Mensaje no reconocido ─── */
      default: {
        // Futuro: aquí procesaremos fotos + texto para subir productos con IA
        if (message.photo) {
          await sendMessage(chatId,
            `📸 He recibido tu foto. La función de subir productos con IA estará disponible muy pronto.\n\n` +
            `Por ahora, sube tus productos desde el panel de control en la web.`
          )
        } else {
          await sendMessage(chatId,
            `No entendí ese comando. Escribe /ayuda para ver la lista de comandos disponibles.`
          )
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook] Error:', err)
    return NextResponse.json({ ok: true }) // Siempre 200 para Telegram
  }
}
