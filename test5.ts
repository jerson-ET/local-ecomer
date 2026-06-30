import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
  // Simulate what /api/user/stores does:
  const userId = 'f63a4858-590f-49bb-8f09-ac4a2468999d'; // Admin
  const { data: userStores } = await supabase.from('stores').select('id, name').eq('user_id', userId).order('created_at', { ascending: true });
  console.log('USER STORES (AccountingBook):', userStores);

  // Simulate what /api/stores does:
  const { data: stores } = await supabase.from('stores').select('id, name').eq('user_id', userId).order('created_at', { ascending: true });
  console.log('STORES (ProductManager):', stores);
}
run();
