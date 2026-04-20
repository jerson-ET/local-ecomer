import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('id', 'aa30ecf6-a51b-48b3-b7a4-7e5e4a5d46ef')
    .single();
  console.log(order);
}

test();
