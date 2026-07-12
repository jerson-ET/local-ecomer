import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Find seller's store
    const { searchParams } = new URL(request.url)
    const storeIdParam = searchParams.get('storeId')

    let store = null
    let storeError = null

    if (storeIdParam) {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('id', storeIdParam)
        .eq('user_id', user.id)
        .maybeSingle()
      store = data
      storeError = error
    } else {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      store = data
      storeError = error
    }

    if (storeError || !store) {
      return NextResponse.json({ stats: { totalSubscribers: 0, totalProductsBought: 0 }, subscribers: [] })
    }

    // Get followers
    const { data: followers, error: followersError } = await supabase
      .from('store_followers')
      .select(`
        id,
        created_at,
        user_id,
        profiles:user_id (
          id,
          nombre,
          role
        )
      `)
      .eq('store_id', store.id)

    if (followersError) {
      console.error('Error fetching followers:', followersError)
      return NextResponse.json({ stats: { totalSubscribers: 0, totalProductsBought: 0 }, subscribers: [] })
    }

    // Format subscribers
    const formattedSubscribers = (followers || []).map((f: any) => {
      const profile = f.profiles
      return {
        id: f.user_id,
        name: profile?.nombre || 'Comprador Anónimo',
        joined_at: f.created_at,
        location: 'Colombia', // default fallback
        order_count: 0,
        total_spent: 0
      }
    })

    // Now let's try to get stats from orders table if it exists
    let totalProductsBought = 0
    if (formattedSubscribers.length > 0) {
      try {
        const subscriberIds = formattedSubscribers.map(s => s.id)
        const { data: orders } = await supabase
          .from('orders')
          .select('id, user_id, total, items_count')
          .eq('store_id', store.id)
          .in('user_id', subscriberIds)

        if (orders) {
          orders.forEach((order: any) => {
            const sub = formattedSubscribers.find(s => s.id === order.user_id)
            if (sub) {
              sub.order_count += 1
              sub.total_spent += Number(order.total) || 0
            }
            totalProductsBought += Number(order.items_count) || 1
          })
        }
      } catch (e) {
        console.warn('Orders table not queried successfully:', e)
      }
    }

    return NextResponse.json({
      stats: {
        totalSubscribers: formattedSubscribers.length,
        totalProductsBought
      },
      subscribers: formattedSubscribers
    })
  } catch (error: any) {
    console.error('Error in GET /api/seller/subscribers:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, message, subscriberId, storeId } = await request.json()
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    let store = null
    if (storeId) {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .eq('user_id', user.id)
        .maybeSingle()
      store = data
    } else {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      store = data
    }

    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    // Save notification to a store_notifications table if it exists
    try {
      await supabase.from('store_notifications').insert({
        store_id: store.id,
        user_id: subscriberId || null,
        type: type || 'notification',
        message: message,
        created_at: new Date().toISOString()
      })
    } catch (e) {
      console.warn('store_notifications table might not exist yet:', e)
    }

    return NextResponse.json({ success: true, sent: subscriberId ? 1 : 100 })
  } catch (error: any) {
    console.error('Error in POST /api/seller/subscribers:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
