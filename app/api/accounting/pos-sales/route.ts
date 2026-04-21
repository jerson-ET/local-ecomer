import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServerClient } from '@supabase/supabase-js'

const getSupabaseAdmin = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()

    // Obtener la tienda del usuario
    const { data: stores } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('user_id', user.id)

    if (!stores || stores.length === 0) {
      return NextResponse.json({ sales: [] })
    }

    const storeId = stores[0]?.id
    if (!storeId) return NextResponse.json({ sales: [] })


    // Obtener órdenes del POS:
    // - Nuevas: tienen 'POS-Caja' en notes
    // - Antiguas: tienen 'Entregado en tienda' en estimated_delivery
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id, buyer_name, total_amount, status, created_at, notes, payment_method, estimated_delivery')
      .eq('store_id', storeId)
      .or('notes.ilike.%POS-Caja%,estimated_delivery.eq.Entregado en tienda')
      .order('created_at', { ascending: false })
      .limit(200)


    if (error) {
      console.error('[POS_SALES_GET]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Obtener items de cada orden
    const salesWithItems = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: items } = await supabaseAdmin
          .from('order_items')
          .select('product_name_snapshot, quantity, unit_price, total_price, product_image_snapshot')
          .eq('order_id', order.id)

        return { ...order, items: items || [] }
      })
    )

    return NextResponse.json({ sales: salesWithItems })
  } catch (err) {
    console.error('[POS_SALES_GET] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
