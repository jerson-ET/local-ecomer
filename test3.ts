import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Test with anonymous client to simulate RLS
const supabaseAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function run() {
  const storeId = '47ced718-4b74-45d7-a95e-34da98308723';
  const { data: products, error } = await supabaseAnon.from('products').select('*').eq('store_id', storeId);
  console.log('ANON PRODUCTS COUNT:', products?.length, 'ERROR:', error);
}
run();
