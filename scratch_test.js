import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data: orders } = await supabase.from('orders').select('id, status').ilike('id', 'aa30ecf6%');
  if (!orders || orders.length === 0) {
    console.log('No order found with prefix aa30ecf6');
    return;
  }
  const orderId = orders[0].id;
  console.log('Found order:', orderId, 'Status:', orders[0].status);

  // Now, what happens if we patch it? Let's check the API endpoint locally.
  const res = await fetch('http://localhost:3000/api/accounting/stats', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    // Wait, we can't test without user auth cookie because the API requires auth.
    // I will just execute the backend logic directly here to see the error.
  });
  console.log(res.status);
}

test();
