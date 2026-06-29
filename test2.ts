import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
  const storeId = '47ced718-4b74-45d7-a95e-34da98308723';
  const { data: products } = await supabase.from('products').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
  console.log('PRODUCTS COUNT:', products?.length);
  if (products && products.length > 0) {
     console.log('Product 0:', products[0].name);
  }
}
run();
