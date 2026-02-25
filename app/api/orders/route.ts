import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// Usamos el Service Role para sobreescribir RLS en la creación de órdenes del backend
const supabaseAdmin = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado / Sesión expirada' }, { status: 401 })
    }

    const body = await request.json()
    const { storeId, items, paymentMethod, shippingAddress, notes } = body

    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos o el carrito está vacío' },
        { status: 400 }
      )
    }

    let totalAmount = 0
    const orderItemsToInsert = []

    // Procesar precios verdaderos desde la DB para evitar hackeos de DOM en el front-end
    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json({ error: 'Ítems inválidos en el carrito' }, { status: 400 })
      }

      const { data: prodData, error: prodErr } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .single()

      if (prodErr || !prodData) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.productId}` },
          { status: 404 }
        )
      }

      const unitPrice = prodData.discount_price || prodData.price
      const lineTotal = unitPrice * item.quantity
      totalAmount += lineTotal

      // Extraer una imagen para el snapshot
      let imageSnapshot = null
      if (Array.isArray(prodData.images) && prodData.images.length > 0) {
        const mainImg =
          prodData.images.find(
            (i: { isMain?: boolean; thumbnail?: string; full?: string }) => i.isMain
          ) || prodData.images[0]
        imageSnapshot = mainImg.thumbnail || mainImg.full || null
      }

      orderItemsToInsert.push({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: lineTotal,
        product_name_snapshot: prodData.name,
        product_image_snapshot: imageSnapshot,
      })
    }

    // Crear la orden
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        store_id: storeId,
        buyer_id: user.id,
        total_amount: totalAmount,
        payment_method: paymentMethod || 'cash_on_delivery',
        shipping_address: shippingAddress || 'Retiro en Tienda',
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !newOrder) {
      console.error('Error insertando Order:', orderError)
      return NextResponse.json({ error: 'Fallo al procesar pedido' }, { status: 500 })
    }

    // Inyectar el order_id a cada item y guardarlos
    const finalItems = orderItemsToInsert.map((i) => ({
      ...i,
      order_id: newOrder.id,
    }))

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(finalItems)

    if (itemsError) {
      console.error('Error insertando Items:', itemsError)
      // Rollback manual
      await supabaseAdmin.from('orders').delete().eq('id', newOrder.id)
      return NextResponse.json({ error: 'Fallo al guardar detalle del pedido' }, { status: 500 })
    }

    return NextResponse.json({ order: newOrder, success: true }, { status: 201 })
  } catch (error: unknown) {
    console.error('Server Checkout Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
