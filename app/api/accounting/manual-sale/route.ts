import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServerClient } from '@supabase/supabase-js'

const getSupabaseAdmin = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, quantity, buyerName, buyerPhone, estimatedDelivery, notes } = body

    if (!productId) {
      return NextResponse.json({ error: 'Falta el producto a vender' }, { status: 400 })
    }

    const qty = Number(quantity)
    if (!qty || qty <= 0 || !Number.isInteger(qty)) {
      return NextResponse.json({ error: 'La cantidad debe ser un número entero positivo' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Obtener producto
    const { data: product, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (prodErr || !product) {
      return NextResponse.json(
        { error: `Producto no encontrado: ${prodErr?.message || 'ID inválido'}` },
        { status: 404 }
      )
    }

    // Verificar pertenencia
    const { data: store, error: storeErr } = await supabaseAdmin
      .from('stores')
      .select('id, user_id')
      .eq('id', product.store_id)
      .single()

    if (storeErr || !store || store.user_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso sobre este producto' }, { status: 403 })
    }

    // Validar stock
    const currentStock = product.stock ?? 0
    if (qty > currentStock) {
      return NextResponse.json(
        { error: `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${qty}` },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════
    // NUEVO FLUJO: La orden se crea SIEMPRE en estado 'processing'
    // El stock NO se descuenta aquí. Se descuenta cuando se marca
    // como 'delivered'. Si se devuelve al stock, simplemente se 
    // cancela la orden (el stock nunca fue tocado).
    // ═══════════════════════════════════════════════════════════════
    const unitPrice = product.discount_price || product.price
    const totalAmount = unitPrice * qty

    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        store_id: store.id,
        user_id: user.id,
        buyer_name: buyerName || 'Venta Manual',
        buyer_phone: buyerPhone || null,
        notes: notes || 'Venta manual - Cuaderno Contable',
        status: body.status || 'processing',  // Permite crearla como 'delivered' directamente

        estimated_delivery: estimatedDelivery || null,
        shipping_cost: 0,
        total_amount: totalAmount
      })
      .select()
      .single()

    if (orderError || !newOrder) {
      console.error('[MANUAL_SALE] Error orden:', orderError?.message)
      return NextResponse.json(
        { error: `No se pudo registrar: ${orderError?.message || 'Error'}` },
        { status: 500 }
      )
    }

    // Insertar item
    const { error: itemError } = await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: newOrder.id,
        product_id: productId,
        quantity: qty,
        unit_price: unitPrice,
        total_price: totalAmount,
        product_name_snapshot: product.name,
        product_image_snapshot: (product.images as any[])?.[0]?.thumbnail || null,
      })

    if (itemError) {
      console.error('[MANUAL_SALE] Error item:', itemError.message)
      await supabaseAdmin.from('orders').delete().eq('id', newOrder.id)
      return NextResponse.json(
        { error: `Error en detalle: ${itemError.message}` },
        { status: 500 }
      )
    }

    // Descontar stock al momento de la venta (reserva)
    const newStock = Math.max(0, currentStock - qty)
    await supabaseAdmin
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)

    console.log(`[MANUAL_SALE] ✓ Orden ${newOrder.id} creada en estado 'processing'. Stock descontado: ${currentStock} -> ${newStock}`)

    return NextResponse.json({
      success: true,
      order: newOrder,
      stockUpdated: true,
      currentStock,
      newStock,
      message: 'Venta registrada en proceso.'
    })
  } catch (error) {
    console.error('[MANUAL_SALE] Error:', error)
    return NextResponse.json(
      { error: `Error: ${error instanceof Error ? error.message : 'Sin detalles'}` },
      { status: 500 }
    )
  }
}
