import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const profileRole = String((profile as any)?.role || '')
  const metaRole = String(user.user_metadata?.role || '')
  if (profileRole !== 'admin' && profileRole !== 'superadmin' && metaRole !== 'admin' && metaRole !== 'super_admin') return null
  return user
}

function getServiceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await verifyAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // Fetch user details from auth admin
    const { data: { user: targetUser }, error: userError } = await serviceClient.auth.admin.getUserById(userId)
    if (userError || !targetUser) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { data: profile } = await serviceClient.from('profiles').select('*').eq('id', userId).maybeSingle()
    
    const userSummary = {
        id: targetUser.id,
        email: targetUser.email,
        name: profile?.nombre || targetUser.user_metadata?.nombre || targetUser.user_metadata?.name || 'Sin nombre',
        phone: profile?.telefono || targetUser.user_metadata?.telefono || '',
        role: profile?.role || 'buyer'
    }

    // Fetch all stores for this user
    const { data: stores, error: storesError } = await serviceClient
      .from('stores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (storesError) {
       return NextResponse.json({ error: 'Error cargando tiendas' }, { status: 500 })
    }

    const storesWithDetails = await Promise.all((stores || []).map(async (store) => {
        // Fetch products for this store
        const { data: products } = await serviceClient
            .from('products')
            .select('*')
            .eq('store_id', store.id)
            .order('created_at', { ascending: false })

        // Fetch orders for this store
        const { data: orders } = await serviceClient
            .from('orders')
            .select('*')
            .eq('store_id', store.id)
            .order('created_at', { ascending: false })

        // Fetch order items for these orders
        const orderIds = (orders || []).map((o: any) => o.id)
        let allOrderItems: any[] = []
        
        if (orderIds.length > 0) {
             const { data: orderItems } = await serviceClient
                .from('order_items')
                .select('*')
                .in('order_id', orderIds)
             allOrderItems = orderItems || []
        }

        const ordersWithItems = (orders || []).map((order: any) => {
            return {
                ...order,
                items: allOrderItems.filter((item: any) => item.order_id === order.id)
            }
        })

        return {
            ...store,
            products: products || [],
            orders: ordersWithItems
        }
    }))

    return NextResponse.json({
        success: true,
        user: userSummary,
        stores: storesWithDetails
    })

  } catch (error) {
    console.error('[STORE_DB_API] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
