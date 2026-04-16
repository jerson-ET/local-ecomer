import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const getSupabaseAdmin = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    // No bloqueamos por 401, permitimos Guest Checkout (compras sin login)

    const body = await request.json()
    const {
      storeId,
      items,
      paymentMethod,
      shippingAddress,
      notes,
      buyerName,
      buyerPhone,
    } = body

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

      const supabaseAdmin = getSupabaseAdmin()
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

    const normalizedBuyerName =
      typeof buyerName === 'string' ? buyerName.trim().slice(0, 120) : null
    const normalizedBuyerPhone =
      typeof buyerPhone === 'string' ? buyerPhone.trim().slice(0, 40) : null

    if (normalizedBuyerPhone && normalizedBuyerPhone.length < 7) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 })
    }

    // Crear la orden
    const supabaseAdmin = getSupabaseAdmin()
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        store_id: storeId,
        buyer_id: user?.id || null, // Permitir null si es guest
        buyer_name: normalizedBuyerName,
        buyer_phone: normalizedBuyerPhone,
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

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. Obtener la orden y verificar que pertenezca a una tienda del usuario (o el usuario sea el dueño)
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, store:stores!inner(user_id)')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // Seguridad: Solo el dueño de la tienda puede actualizar el estado
    if (order.store.user_id !== user.id) {
      // Permitir también si es superadmin (opcional, pero buena práctica)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'superadmin' && profile?.role !== 'admin') {
        return NextResponse.json({ error: 'No tienes permiso para editar esta orden' }, { status: 403 })
      }
    }

    const oldStatus = order.status

    // 2. Si el nuevo estado es 'delivered' (Vendido) y el anterior NO lo era, descontamos stock
    if (status === 'delivered' && oldStatus !== 'delivered') {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)

      if (items) {
        for (const item of items) {
          // Decrementar stock
          const { data: prod } = await supabaseAdmin
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single()

          if (prod && typeof prod.stock === 'number') {
            await supabaseAdmin
              .from('products')
              .update({ stock: Math.max(0, prod.stock - item.quantity) })
              .eq('id', item.product_id)
          }
        }
      }

    // Eliminadas comisiones
    }

    // 3. Si el nuevo estado es 'cancelled' (No Vendido) y el anterior era 'delivered', devolvemos stock
    if (status === 'cancelled' && oldStatus === 'delivered') {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)

      if (items) {
        for (const item of items) {
          const { data: prod } = await supabaseAdmin
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single()

          if (prod && typeof prod.stock === 'number') {
            await supabaseAdmin
              .from('products')
              .update({ stock: prod.stock + item.quantity })
              .eq('id', item.product_id)
          }
        }
      }
      
      // Eliminadas comisiones
    }

    // 4. Actualizar el estado de la orden
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (updateErr) {
      return NextResponse.json({ error: 'Fallo al actualizar estado' }, { status: 500 })
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
