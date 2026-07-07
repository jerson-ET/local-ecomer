import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user's active store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Fetch followers for this store and join with profiles
    const { data: followers, error: followersError } = await supabase
      .from('store_followers')
      .select(`
        user_id,
        created_at,
        profiles!inner (
          id,
          name,
          city
        )
      `)
      .eq('store_id', store.id);

    if (followersError) {
      console.error('Error fetching followers:', followersError);
      return NextResponse.json({ error: 'Error fetching subscribers' }, { status: 500 });
    }

    if (!followers || followers.length === 0) {
      return NextResponse.json([]);
    }

    const followerIds = followers.map((f: any) => f.user_id);
    
    // Fetch all orders for this store by these followers
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, total_amount')
      .eq('store_id', store.id)
      .in('user_id', followerIds);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Error fetching orders data' }, { status: 500 });
    }

    // Calculate orderCount and totalSpent
    const orderStats = (orders || []).reduce((acc: Record<string, { count: number; total: number }>, order: any) => {
      if (!acc[order.user_id]) {
        acc[order.user_id] = { count: 0, total: 0 };
      }
      acc[order.user_id].count += 1;
      acc[order.user_id].total += Number(order.total_amount) || 0;
      return acc;
    }, {});

    // Format output
    const subscribers = followers.map((follower: any) => {
      const stats = orderStats[follower.user_id] || { count: 0, total: 0 };
      const profile = Array.isArray(follower.profiles) ? follower.profiles[0] : follower.profiles;
      
      return {
        id: follower.user_id,
        name: profile?.name || 'Usuario Anónimo',
        city: profile?.city || 'No especificada',
        joinedAt: follower.created_at,
        orderCount: stats.count,
        totalSpent: stats.total,
      };
    });

    return NextResponse.json(subscribers);
  } catch (error) {
    console.error('Seller subscribers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
