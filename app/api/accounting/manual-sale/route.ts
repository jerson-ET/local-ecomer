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
    // Verificar autenticación con el cliente normal
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { productId, quantity, buyerName, buyerPhone, estimatedDelivery, notes } = await request.json()

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Faltan datos requeridos (producto o cantidad)' }, { status: 400 })
    }

    // Usar admin para bypass de RLS (igual que /api/orders)
    const supabaseAdmin = getSupabaseAdmin()

    // 1. Obtener datos del producto
    const { data: product, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (prodErr || !product) {
      return NextResponse.json({ error: `Producto no encontrado: ${prodErr?.message}` }, { status: 404 })
    }

    // Verificar que el producto pertenece a una tienda del usuario
    const { data: store } = await supabaseAdmin
      .from('stores')
      .select('id, user_id')
      .eq('id', product.store_id)
      .single()

    if (!store || store.user_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso sobre este producto' }, { status: 403 })
    }

    const storeId = store.id
    const unitPrice = product.discount_price || product.price
    const totalAmount = unitPrice * quantity

    // 2. Crear la orden manual
    const status = estimatedDelivery ? 'paid' : 'delivered'

    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        store_id: storeId,
        buyer_id: user.id,
        buyer_name: buyerName || 'Venta Manual',
        buyer_phone: buyerPhone || null,
        total_amount: totalAmount,
        payment_method: 'cash_on_delivery',
        shipping_address: 'Venta Directa / Manual',
        notes: notes || 'Registrado manualmente desde el Cuaderno',
        status: status,
        estimated_delivery: estimatedDelivery || null,
      })
      .select()
      .single()

    if (orderError || !newOrder) {
      console.error('[MANUAL_SALE] Order error:', orderError)
      return NextResponse.json({ error: `Fallo al registrar: ${orderError?.message}` }, { status: 500 })
    }

    // 3. Insertar el item
    const { error: itemError } = await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: newOrder.id,
        product_id: productId,
        quantity: quantity,
        unit_price: unitPrice,
        total_price: totalAmount,
        product_name_snapshot: product.name,
        product_image_snapshot: (product.images as any[])?.[0]?.thumbnail || null
      })

    if (itemError) {
      console.error('[MANUAL_SALE] Item error:', itemError)
      await supabaseAdmin.from('orders').delete().eq('id', newOrder.id)
      return NextResponse.json({ error: `Fallo en detalle: ${itemError.message}` }, { status: 500 })
    }

    // 4. Actualizar Stock
    const newStock = Math.max(0, (product.stock || 0) - quantity)
    await supabaseAdmin
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)

    return NextResponse.json({ success: true, order: newOrder })
  } catch (error) {
    console.error('[MANUAL_SALE_API]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
