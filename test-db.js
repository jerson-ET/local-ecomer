import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    console.log("Users:", users?.users.length || 0);
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
    console.log("Profiles:", profiles?.length || 0, profiles);
}
run();
