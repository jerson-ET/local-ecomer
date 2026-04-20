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

    // 1. Obtener TODAS las tiendas del usuario
    const { data: stores, error: storeErr } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('user_id', user.id)

    if (storeErr || !stores || stores.length === 0) {
      console.log('[HISTORY_API] No stores found for user:', user.id)
      return NextResponse.json({ orders: [] })
    }

    const storeIds = stores.map(s => s.id)

    // 2. Obtener TODAS las órdenes de CUALQUIERA de las tiendas del usuario
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('id, buyer_name, total_amount, status, created_at, estimated_delivery')
      .in('store_id', storeIds)
      .order('created_at', { ascending: false })
      .limit(100)

    if (ordersErr) {
      console.error('[HISTORY_API] Error órdenes:', ordersErr)
      throw ordersErr
    }

    console.log(`[HISTORY_API] Found ${orders?.length || 0} orders for user ${user.id}`)

    // 3. Obtener items para cada orden
    const ordersWithItems = await Promise.all((orders || []).map(async (order) => {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('product_name_snapshot, quantity, product_id')
        .eq('order_id', order.id)
      
      const itemsWithSku = await Promise.all((items || []).map(async (item) => {
        if (!item.product_id) return { ...item, product: null }
        
        try {
          const { data: prod } = await supabaseAdmin
            .from('products')
            .select('sku')
            .eq('id', item.product_id)
            .maybeSingle()
            
          return {
            ...item,
            product: prod ? { sku: prod.sku } : null
          }
        } catch (e) {
          return { ...item, product: null }
        }
      }))

      return {
        ...order,
        items: itemsWithSku
      }
    }))

    return NextResponse.json({ orders: ordersWithItems })
  } catch (error) {
    console.error('[ACCOUNTING_HISTORY_API]', error)
    return NextResponse.json({ error: 'Error interno: ' + (error instanceof Error ? error.message : 'Desconocido') }, { status: 500 })
  }
}
