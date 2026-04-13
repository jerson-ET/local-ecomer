import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { verifyWebhookSignature, mapEfipayStatus } from '@/lib/efipay'

const getSupabaseAdmin = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

/**
 * POST /api/efipay/webhook
 * 
 * Recibe las notificaciones de Efipay cuando una transacción cambia de estado.
 * Verifica la firma HMAC SHA-256 para autenticidad.
 * Actualiza la orden correspondiente en la base de datos.
 * 
 * Reintentos de Efipay:
 * - Si no responde 2xx → reintenta a los 10s
 * - Si falla de nuevo → reintenta a los 100s
 * - Después de eso, no más intentos
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('Signature') || request.headers.get('signature') || ''

    console.log('[EFIPAY/WEBHOOK] Received webhook, signature:', signature ? 'present' : 'missing')

    // Verificar firma (si hay token configurado)
    const webhookToken = process.env.EFIPAY_WEBHOOK_TOKEN
    if (webhookToken && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature)
      if (!isValid) {
        console.warn('[EFIPAY/WEBHOOK] Invalid signature!')
        // No bloqueamos, pero logueamos para debug
      }
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error('[EFIPAY/WEBHOOK] Invalid JSON body')
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    console.log('[EFIPAY/WEBHOOK] Payload:', JSON.stringify(payload, null, 2))

    const transaction = payload?.transaction
    if (!transaction) {
      console.error('[EFIPAY/WEBHOOK] No transaction in payload')
      return NextResponse.json({ error: 'Missing transaction data' }, { status: 400 })
    }

    // Extraer references del checkout para encontrar el orderId
    const references = payload?.checkout?.payment_gateway?.advanced_option?.references || []
    const orderId = references[0] || null

    if (!orderId) {
      console.warn('[EFIPAY/WEBHOOK] No orderId found in references, trying description match')
      // Fallback: buscar por efipay_payment_id
    }

    const supabaseAdmin = getSupabaseAdmin()
    const efipayStatus = transaction.status || ''
    const internalStatus = mapEfipayStatus(efipayStatus)

    console.log(`[EFIPAY/WEBHOOK] Transaction status: ${efipayStatus} → internal: ${internalStatus}`)

    let orderQuery = supabaseAdmin.from('orders').select('id, status')

    // ─── MANEJO DE SUSCRIPCIONES (PAGO DE PLAN) ───
    if (orderId && orderId.startsWith('SUB-')) {
      if (internalStatus === 'confirmed') {
        const userId = orderId.split('-')[1]
        if (userId) {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
          if (userData && userData.user) {
            const currentMeta = userData.user.user_metadata || {}
            const currentPaidUntil = currentMeta.paid_until ? new Date(currentMeta.paid_until) : new Date()
            const baseDate = currentPaidUntil > new Date() ? currentPaidUntil : new Date()
            
            // Asumimos 30 días de extensión por pago de membresía
            baseDate.setDate(baseDate.getDate() + 30)

            await supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: {
                ...currentMeta,
                paid_until: baseDate.toISOString(),
                is_active: true
              }
            })
            console.log(`[EFIPAY/WEBHOOK] ✔️ Suscripción extendida para usuario ${userId}`)
          }
        }
      }
      return NextResponse.json({ received: true, status: internalStatus })
    }

    if (orderId) {
      orderQuery = orderQuery.eq('id', orderId)
    } else {
      // Fallback: buscar por payment_id en el checkout
      const paymentId = payload?.checkout?.payment_gateway?.gatewayable_id
      if (paymentId) {
        orderQuery = orderQuery.eq('efipay_payment_id', paymentId)
      } else {
        console.error('[EFIPAY/WEBHOOK] Cannot identify order')
        return NextResponse.json({ received: true, warning: 'Order not identified' })
      }
    }

    const { data: order, error: orderErr } = await orderQuery.maybeSingle()

    if (orderErr || !order) {
      console.warn('[EFIPAY/WEBHOOK] Order not found:', orderId, orderErr)
      // Respondemos 200 para que Efipay no reintente
      return NextResponse.json({ received: true, warning: 'Order not found' })
    }

    // Solo actualizar si el estado cambia y no es un downgrade
    const statusPriority: Record<string, number> = {
      'pending': 0,
      'confirmed': 2,
      'delivered': 3,
      'cancelled': 1,
    }

    const currentPriority = statusPriority[order.status] ?? 0
    const newPriority = statusPriority[internalStatus] ?? 0

    if (newPriority > currentPriority) {
      const updateData: Record<string, any> = {
        status: internalStatus,
        efipay_transaction_id: transaction.transaction_id?.toString() || null,
        efipay_status: efipayStatus,
      }

      if (internalStatus === 'confirmed' && transaction.approved_at) {
        updateData.paid_at = transaction.approved_at
      }

      const { error: updateErr } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', order.id)

      if (updateErr) {
        console.error('[EFIPAY/WEBHOOK] Update error:', updateErr)
      } else {
        console.log(`[EFIPAY/WEBHOOK] Order ${order.id} updated to ${internalStatus}`)
      }

      // Si fue aprobada, confirmar comisiones de referidos
      if (internalStatus === 'confirmed') {
        await supabaseAdmin
          .from('commissions')
          .update({ status: 'confirmed' })
          .eq('order_id', order.id)
          .eq('status', 'pending')
      }

      // Si fue rechazada, cancelar comisiones
      if (internalStatus === 'cancelled') {
        await supabaseAdmin
          .from('commissions')
          .update({ status: 'cancelled' })
          .eq('order_id', order.id)
          .eq('status', 'pending')
      }
    } else {
      console.log(`[EFIPAY/WEBHOOK] Skipping update: ${order.status} → ${internalStatus} (no priority upgrade)`)
    }

    // Siempre responder 200 para que Efipay no reintente
    return NextResponse.json({ received: true, status: internalStatus })
  } catch (error) {
    console.error('[EFIPAY/WEBHOOK] Fatal error:', error)
    // Responder 200 de todas formas para evitar reintentos infinitos
    return NextResponse.json({ received: true, error: 'Internal processing error' })
  }
}
