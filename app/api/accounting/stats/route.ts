import { NextResponse } from 'next/server'
import { createClient, getServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 1. Obtener la tienda del usuario
    const { data: stores, error: storeErr } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)

    if (storeErr || !stores || stores.length === 0) {
      return NextResponse.json({ 
        stats: { activeProducts: 0, soldUnits: 0, pendingOrdersCount: 0 },
        pendingOrders: []
      })
    }

    const storeId = stores[0].id

    // 2. Productos Activos
    const { count: activeProductsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_active', true)

    // 3. Unidades Vendidas (Pedidos entregados o pagados)
    // Sumamos la cantidad de items de pedidos con estado 'delivered' o 'paid'
    const { data: soldItems } = await supabase
      .from('order_items')
      .select('quantity, order:orders!inner(status)')
      .eq('order.store_id', storeId)
      .in('order.status', ['paid', 'processing', 'shipped', 'delivered'])

    const totalSoldUnits = soldItems?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0

    // 4. Pedidos Pendientes por Entregar (paid, processing, shipped)
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('id, buyer_name, total_amount, status, created_at, estimated_delivery')
      .eq('store_id', storeId)
      .in('status', ['paid', 'processing', 'shipped'])
      .order('created_at', { ascending: false })

    // Obtener items para cada orden para mostrar el nombre del producto
    const pendingOrdersWithItems = await Promise.all((pendingOrders || []).map(async (order) => {
      const { data: items } = await supabase
        .from('order_items')
        .select('product_name_snapshot, quantity, product:products(sku)')
        .eq('order_id', order.id)
      
      return {
        ...order,
        items: items || []
      }
    }))

    // 5. Stock Total (Suma de todos los productos de la tienda)
    const { data: stockData } = await supabase
      .from('products')
      .select('stock')
      .eq('store_id', storeId)

    const totalStock = stockData?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0

    return NextResponse.json({
      stats: {
        activeProducts: activeProductsCount || 0,
        soldUnits: totalSoldUnits,
        pendingOrdersCount: pendingOrders?.length || 0,
        totalStock: totalStock
      },
      pendingOrders: pendingOrdersWithItems
    })
  } catch (error) {
    console.error('[ACCOUNTING_STATS_API]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Opcional: Permitir actualizar la fecha de entrega desde aquí
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { orderId, estimatedDelivery } = await request.json()

    if (!orderId) return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })

    // Verificar propiedad
    const { data: order } = await supabase
      .from('orders')
      .select('id, store:stores!inner(user_id)')
      .eq('id', orderId)
      .single()

    if (!order || (order as any).store.user_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 })
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update({ estimated_delivery: estimatedDelivery })
      .eq('id', orderId)

    if (updateErr) throw updateErr

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ACCOUNTING_STATS_PUT]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { orderId, status } = await request.json()

    if (!orderId || !status) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

    const supabaseAdmin = getServiceClient()

    // Verificar propiedad de la orden usando admin (evita fallos de RLS en select)
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, store_id')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      console.error('[PATCH] Orden no encontrada:', orderErr)
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // Verificar que la tienda pertenece al usuario
    const { data: store, error: storeErr } = await supabaseAdmin
      .from('stores')
      .select('id, user_id')
      .eq('id', order.store_id)
      .single()

    if (storeErr || !store || store.user_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso sobre esta orden' }, { status: 403 })
    }

    // Actualizar estado de la orden y restaurar stock
    const finalStatus = status === 'returned' ? 'cancelled' : status
    
    console.log(`[PATCH] Procesando orden ${orderId} con estado ${finalStatus}`)

    // Si se cancela la orden, debemos restaurar el stock reservado
    if (finalStatus === 'cancelled') {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)
        
      if (items && items.length > 0) {
        for (const item of items) {
          if (!item.product_id) continue;
          // Obtener el stock actual del producto
          const { data: p } = await supabaseAdmin
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single()
            
          if (p) {
            // Restaurar el stock
            await supabaseAdmin
              .from('products')
              .update({ stock: (p.stock || 0) + item.quantity })
              .eq('id', item.product_id)
          }
        }
      }
    }

    // Finalmente, actualizar el estado de la orden
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({ status: finalStatus })
      .eq('id', orderId)

    if (updateErr) {
      console.error('[PATCH] Error actualizando estado:', updateErr)
      return NextResponse.json({ error: 'Error actualizando estado de la orden: ' + updateErr.message }, { status: 500 })
    }

    console.log(`[PATCH] ✓ Orden ${orderId} procesada exitosamente a estado: ${finalStatus}`)
    return NextResponse.json({ success: true, message: 'Operación realizada exitosamente' })
  } catch (error: any) {
    console.error('[ACCOUNTING_STATS_PATCH] Error general:', error)
    return NextResponse.json({ error: 'Error interno: ' + error.message }, { status: 500 })
  }
}
