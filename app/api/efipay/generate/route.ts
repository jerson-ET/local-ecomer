import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { generatePayment } from '@/lib/efipay'

const getSupabaseAdmin = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

/**
 * POST /api/efipay/generate
 * 
 * Genera un pago en Efipay y retorna la URL de checkout.
 * Requiere un orderId existente en la base de datos.
 * 
 * Body: { orderId: string, storeSlug: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, storeSlug } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId es requerido' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Obtener la orden con sus items
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      console.error('[EFIPAY/GENERATE] Order not found:', orderErr)
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // Solo generar pago para órdenes pendientes
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'La orden ya fue procesada' }, { status: 400 })
    }

    // Si ya tiene un payment_id de Efipay, no creamos otro
    if (order.efipay_payment_id && order.efipay_checkout_url) {
      return NextResponse.json({
        success: true,
        checkoutUrl: order.efipay_checkout_url,
        paymentId: order.efipay_payment_id,
      })
    }

    // Construir descripción del pago
    const itemNames = (order.order_items || [])
      .map((item: any) => `${item.quantity}x ${item.product_name_snapshot || 'Producto'}`)
      .join(', ')

    const description = `Pedido #${orderId.slice(0, 8)} - ${itemNames}`.slice(0, 200)

    // Generar pago en Efipay (mode redirect)
    const efipayResponse = await generatePayment({
      description,
      amount: Math.round(order.total_amount),
      currency: 'COP',
      orderId,
      storeSlug: storeSlug || 'tienda',
    })

    if (!efipayResponse.url) {
      console.error('[EFIPAY/GENERATE] No checkout URL returned:', efipayResponse)
      return NextResponse.json({ error: 'Efipay no retornó URL de checkout' }, { status: 500 })
    }

    // Guardar el payment_id de Efipay en la orden
    await supabaseAdmin
      .from('orders')
      .update({
        efipay_payment_id: efipayResponse.payment_id,
        efipay_checkout_url: efipayResponse.url,
        payment_method: 'efipay',
      })
      .eq('id', orderId)

    return NextResponse.json({
      success: true,
      checkoutUrl: efipayResponse.url,
      paymentId: efipayResponse.payment_id,
    })
  } catch (error: any) {
    console.error('[EFIPAY/GENERATE] Server error:', error)
    return NextResponse.json(
      { error: error?.message || 'Error generando pago con Efipay' },
      { status: 500 }
    )
  }
}
