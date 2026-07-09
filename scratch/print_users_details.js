const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return;
  }
  
  const { data: profiles } = await supabase.from('profiles').select('*');
  
  console.log('=== LOGINS / USERS DETAILS ===');
  for (const u of users) {
    const prof = profiles.find(p => p.id === u.id);
    console.log({
      email: u.email,
      id: u.id,
      metadata_role: u.user_metadata?.role,
      app_role: u.app_metadata?.role,
      profile_role: prof?.role,
      profile_nombre: prof?.nombre,
      provider: u.app_metadata?.provider,
      providers: u.app_metadata?.providers,
      identities: u.identities?.map(i => i.provider)
    });
  }
}

main();
