import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data } = supabase.storage.from('platform-invoices').getPublicUrl('test.pdf');
  console.log('Test URL:', data.publicUrl);
  
  // Also check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets?.map(b => b.name));
}

test();
