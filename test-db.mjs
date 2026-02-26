import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.rpc('get_tables');
    console.log("RPC:", data, error);

    // Alternatively try to query the tables
    const tables = ['profiles', 'email_verification_codes', 'verification_codes', 'stores', 'products', 'orders', 'chat_rooms'];
    for (const t of tables) {
        const { error } = await supabase.from(t).select('id').limit(1);
        if (error) console.log(`Table ${t}: Error -> ${error.message}`);
        else console.log(`Table ${t}: EXISTS`);
    }
}
run();
