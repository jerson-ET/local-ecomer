import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
    const { data: products, error } = await supabase
        .from('products')
        .select(`*, product_variants(*)`)
        .eq('store_id', '28d5b6c8-d633-4676-b862-23383519c63b')

    console.log('Error:', error)
}
test()
