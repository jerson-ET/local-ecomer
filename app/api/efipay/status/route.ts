import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { getTransactionStatus, mapEfipayStatus } from '@/lib/efipay'

const getSupabaseAdmin = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

/**
 * GET /api/efipay/status?orderId=xxx
 * 
 * Consulta el estado de un pago en Efipay y sincroniza con la BD.
 * Usado por la página de resultado para mostrar estado al comprador.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, status, total_amount, efipay_payment_id, efipay_status, efipay_transaction_id, payment_method, created_at, store_id')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // Si tiene payment_id de Efipay y aún está pendiente, consultamos estado
    if (order.efipay_payment_id && order.status === 'pending') {
      const txStatus = await getTransactionStatus(order.efipay_payment_id)
      
      if (txStatus) {
        const internalStatus = mapEfipayStatus(txStatus.status)
        
        if (internalStatus !== 'pending') {
          // Actualizar en la BD
          const updateData: Record<string, any> = {
            status: internalStatus,
            efipay_status: txStatus.status,
            efipay_transaction_id: txStatus.transaction_id?.toString() || null,
          }

          if (internalStatus === 'confirmed' && txStatus.approved_at) {
            updateData.paid_at = txStatus.approved_at
          }

          await supabaseAdmin
            .from('orders')
            .update(updateData)
            .eq('id', orderId)

          // Confirmar/cancelar comisiones
          if (internalStatus === 'confirmed') {
            await supabaseAdmin
              .from('commissions')
              .update({ status: 'confirmed' })
              .eq('order_id', orderId)
              .eq('status', 'pending')
          }

          return NextResponse.json({
            orderId: order.id,
            status: internalStatus,
            efipayStatus: txStatus.status,
            totalAmount: order.total_amount,
            paymentMethod: txStatus.payment_method || 'efipay',
          })
        }
      }
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      efipayStatus: order.efipay_status || null,
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method,
    })
  } catch (error) {
    console.error('[EFIPAY/STATUS] Error:', error)
    return NextResponse.json({ error: 'Error consultando estado' }, { status: 500 })
  }
}
