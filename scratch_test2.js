import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data: orders, error } = await supabase.from('orders').select('id, status').in('status', ['paid', 'processing', 'shipped', 'delivered']);
  console.log('Orders:', orders);
}

test();
