import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const orderId = 'aa30ecf6-a51b-48b3-b7a4-7e5e4a5d46ef';
  const finalStatus = 'cancelled';
  console.log(`[PATCH] Llamando a RPC update_order_status_and_restore_inventory para orden ${orderId} con estado ${finalStatus}`)

  const { error: rpcErr, data } = await supabaseAdmin.rpc('update_order_status_and_restore_inventory', {
    p_order_id: orderId,
    p_new_status: finalStatus
  })
  
  if (rpcErr) {
    console.error('RPC Error:', rpcErr);
  } else {
    console.log('RPC Success:', data);
  }
}

test();
