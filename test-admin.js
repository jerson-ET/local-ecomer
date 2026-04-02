const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const adminUser = usersData.users.find(u => u.email === 'jerson@admin.com');
  if (adminUser) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
    console.log('Auth Metadata Role:', adminUser.user_metadata?.role);
    console.log('Profile Role:', profile?.role);
  }
}
check();
