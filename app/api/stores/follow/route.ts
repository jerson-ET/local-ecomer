import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const searchParams = request.nextUrl.searchParams
    const storeId = searchParams.get('storeId')
    const listMode = searchParams.get('list') === 'true'

    if (listMode) {
      if (!user) return NextResponse.json({ stores: [] })
      
      const { data, error } = await supabase
        .from('store_followers')
        .select(`
          store_id,
          stores (
            id, name, slug, theme_color, banner_url,
            store_followers (count)
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      const stores = (data || []).map((row: any) => ({
        id: row.stores?.id,
        name: row.stores?.name,
        slug: row.stores?.slug,
        theme_color: row.stores?.theme_color,
        banner_url: row.stores?.banner_url,
        follower_count: row.stores?.store_followers?.[0]?.count || 0
      })).filter(s => s.id)

      return NextResponse.json({ stores })
    }

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
    }

    let following = false
    if (user) {
      const { data } = await supabase
        .from('store_followers')
        .select('id')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .single()
      
      if (data) following = true
    }

    const { count } = await supabase
      .from('store_followers')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)

    return NextResponse.json({ following, followerCount: count || 0 })

  } catch (error: any) {
    console.error('Error in GET /api/stores/follow:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await request.json()
    if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 })

    // Check if already following
    const { data: existing } = await supabase
      .from('store_followers')
      .select('id')
      .eq('user_id', user.id)
      .eq('store_id', storeId)
      .single()

    if (existing) {
      // Unfollow
      await supabase.from('store_followers').delete().eq('id', existing.id)
    } else {
      // Follow
      await supabase.from('store_followers').insert({
        user_id: user.id,
        store_id: storeId
      })
    }

    // Get new count
    const { count } = await supabase
      .from('store_followers')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)

    return NextResponse.json({ 
      following: !existing, 
      followerCount: count || 0 
    })
  } catch (error: any) {
    console.error('Error in POST /api/stores/follow:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
