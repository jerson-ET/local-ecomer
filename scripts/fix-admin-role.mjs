import { createClient } from '@supabase/supabase-js';

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAndFixProfile() {
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error fetching users:', listError);
    return;
  }
  
  const adminUser = usersData.users.find(u => u.email === 'etjerson@gmail.com');
  
  if (!adminUser) {
    console.log('Admin user not found');
    return;
  }
  
  console.log('Found admin user:', adminUser.email, 'ID:', adminUser.id);
  
  // Update auth metadata
  const { error: metaErr } = await supabase.auth.admin.updateUserById(adminUser.id, {
    user_metadata: {
      ...adminUser.user_metadata,
      role: 'admin'
    }
  });

  if (metaErr) console.error('Meta update error:', metaErr);

  // Ensure profile exists and has role admin
  const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', adminUser.id).maybeSingle();
  
  if (!profile) {
    console.log('Creating profile for admin...');
    const { error: insertErr } = await supabase.from('profiles').insert({
      id: adminUser.id,
      role: 'admin',
      nombre: 'Etjerson Admin'
    });
    if (insertErr) console.error('Insert profile error:', insertErr);
    else console.log('Profile created with role admin');
  } else {
    console.log('Updating existing profile for admin...', profile);
    const { error: updateErr } = await supabase.from('profiles').update({
      role: 'admin'
    }).eq('id', adminUser.id);
    if (updateErr) console.error('Update profile error:', updateErr);
    else console.log('Profile role updated to admin');
  }
}

checkAndFixProfile();
