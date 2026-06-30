const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://aonmnmyqtsxqjfqwohiy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbm1ubXlxdHN4cWpmcXdvaGl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQyNjUyNywiZXhwIjoyMDg3MDAyNTI3fQ.NCrQCmlsoER7e8CHqQc9KCP4A3Y2LtL_ms-f3_XiAhw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, store_id, stores(id, name, slug)')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log('Total active products:', products.length);
  for (const p of products) {
    if (!p.stores) {
      console.log(`Product "${p.name}" (ID: ${p.id}) has NO STORE! store_id: ${p.store_id}`);
    } else if (!p.stores.slug) {
      console.log(`Product "${p.name}" (ID: ${p.id}) has store but NO SLUG!`, p.stores);
    }
  }
}
main();
