import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServerClient } from '@supabase/supabase-js'

const getSupabaseAdmin = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. Obtener tiendas del usuario
    const { data: stores } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('user_id', user.id)

    if (!stores || stores.length === 0) {
      return NextResponse.json({ clients: [] })
    }

    const storeIds = stores.map(s => s.id)

    // 2. Obtener todas las órdenes con datos de compradores
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('id, buyer_name, buyer_phone, total_amount, status, created_at')
      .in('store_id', storeIds)
      .order('created_at', { ascending: false })

    if (ordersErr) throw ordersErr

    // 3. Obtener items de cada orden
    const orderIds = (orders || []).map(o => o.id)
    const { data: allItems } = await supabaseAdmin
      .from('order_items')
      .select('order_id, quantity, product_name_snapshot')
      .in('order_id', orderIds)

    // 4. Agrupar por nombre de cliente
    const clientMap: Record<string, {
      name: string
      phone: string | null
      totalOrders: number
      totalSpent: number
      lastPurchase: string
      products: string[]
      totalUnits: number
    }> = {}

    for (const order of (orders || [])) {
      const name = order.buyer_name || 'Sin nombre'
      if (!clientMap[name]) {
        clientMap[name] = {
          name,
          phone: order.buyer_phone,
          totalOrders: 0,
          totalSpent: 0,
          lastPurchase: order.created_at,
          products: [],
          totalUnits: 0
        }
      }
      clientMap[name].totalOrders += 1
      clientMap[name].totalSpent += (order.total_amount || 0)
      if (!clientMap[name].phone && order.buyer_phone) {
        clientMap[name].phone = order.buyer_phone
      }

      // Agregar productos de esta orden
      const orderItems = (allItems || []).filter(i => i.order_id === order.id)
      for (const item of orderItems) {
        clientMap[name].totalUnits += item.quantity
        if (!clientMap[name].products.includes(item.product_name_snapshot)) {
          clientMap[name].products.push(item.product_name_snapshot)
        }
      }
    }

    const clients = Object.values(clientMap).sort((a, b) => b.totalSpent - a.totalSpent)

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('[CLIENTS_API]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
