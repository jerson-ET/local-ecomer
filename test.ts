import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
  const { data: stores } = await supabase.from('stores').select('id, name, created_at, user_id').order('created_at', { ascending: true });
  console.log('STORES:');
  stores.forEach(s => console.log(s.id, s.name, s.user_id));
  
  const { data: products } = await supabase.from('products').select('id, name, store_id');
  console.log('PRODUCTS:');
  let map = {};
  products.forEach(p => { map[p.store_id] = (map[p.store_id] || 0) + 1 });
  console.log(map);
}
run();
