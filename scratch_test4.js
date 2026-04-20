import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const orderId = 'aa30ecf6-a51b-48b3-b7a4-7e5e4a5d46ef';

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id, store_id')
    .eq('id', orderId)
    .single();

  if (orderErr) {
    console.log('Order error:', orderErr);
    return;
  }
  
  console.log('Order:', order);

  const { data: store, error: storeErr } = await supabaseAdmin
    .from('stores')
    .select('id, user_id')
    .eq('id', order.store_id)
    .single();

  console.log('Store:', store, 'Store Error:', storeErr);
}

test();
