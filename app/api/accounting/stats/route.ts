import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    return NextResponse.json({
      stats: {
        activeProducts: activeProductsCount || 0,
        soldUnits: totalSoldUnits,
        pendingOrdersCount: pendingOrders?.length || 0
      },
      pendingOrders: pendingOrders || []
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
