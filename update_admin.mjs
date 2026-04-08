import { createClient } from '@supabase/supabase-js';

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateAdmin() {
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error fetching users:', listError);
    return;
  }
  
  // Find admin user
  const adminUser = usersData.users.find(u => 
    u.email === 'etjerson@gmail.com' || 
    u.user_metadata?.role === 'super_admin' ||
    u.email === 'admin@localecomer.app'
  );
  
  if (!adminUser) {
    console.log('Admin user not found. Creating a new super admin...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'etjerson@gmail.com',
      password: 'J1e2r3s4;7',
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        nombre: 'Etjerson Admin'
      }
    });
    if (createError) console.error('Error creating super admin:', createError);
    else console.log('Super admin created:', newUser.user.email);
    return;
  }
  
  console.log('Found admin user:', adminUser.email);
  
  // Update admin user
  const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
    email: 'etjerson@gmail.com',
    password: 'J1e2r3s4;7',
    user_metadata: {
      ...adminUser.user_metadata,
      role: 'super_admin',
      nombre: 'Etjerson Admin'
    }
  });

  if (updateError) {
    console.error('Error updating admin:', updateError);
  } else {
    console.log('Successfully updated super admin:', updatedUser.user.email);
  }
}

updateAdmin();
