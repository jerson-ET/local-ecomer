import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, nombre, telefono')
      .eq('id', user.id)
      .single()

    // 2. Get orders
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id, status, total_amount, created_at, store_id,
        stores (name, slug),
        order_items (id, product_id, product_name_snapshot, quantity, total_price, metadata)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    // 3. Get followed stores
    const { data: followedStoresData } = await supabase
      .from('store_followers')
      .select(`
        store_id,
        stores (id, name, slug, theme_color, banner_url)
      `)
      .eq('user_id', user.id)

    const followedStores = (followedStoresData || []).map((row: any) => row.stores).filter(Boolean)

    // Calculate stats
    const validOrders = (orders || []).filter(o => o.status !== 'cancelled')
    const totalSpent = validOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
    const activeOrders = (orders || []).filter(o => !['delivered', 'cancelled'].includes(o.status)).length

    // 4. Get Recommendations (Simple algorithm based on followed stores)
    let recommendations: any[] = []
    if (followedStores.length > 0) {
      const storeIds = followedStores.map((s: any) => s.id)
      const { data: recs } = await supabase
        .from('products')
        .select(`
          id, name, description, price, discount_price, category_id, images,
          stores (name, slug)
        `)
        .in('store_id', storeIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20)
        
      recommendations = recs || []
    }

    return NextResponse.json({
      profile: {
        id: profile?.id,
        name: profile?.name || profile?.nombre || user.user_metadata?.nombre || user.user_metadata?.name || '',
        email: profile?.email || user.email,
        document_type: user.user_metadata?.document_type || 'CC',
        document_number: user.user_metadata?.document_number || '',
        whatsapp: user.user_metadata?.whatsapp || user.user_metadata?.telefono || profile?.telefono || '',
        city: user.user_metadata?.city || '',
        address: user.user_metadata?.address || '',
      },
      stats: {
        totalSpent,
        orderCount: validOrders.length,
        storesFollowed: followedStores.length,
        activeOrders
      },
      orders: orders || [],
      followedStores,
      recommendations
    })
  } catch (error: any) {
    console.error('Error in GET /api/buyer/dashboard:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
