import { createClient } from '@supabase/supabase-js';

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testEmail() {
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const adminUser = usersData.users.find(u => u.email === 'etjerson@gmail.com');
  
  if (adminUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(adminUser.id, {
      email: 'etjerson@gmail.com'
    });
    
    if (error) {
      console.log('Error from Supabase:', error.message);
    } else {
      console.log('Success:', data.user.email);
    }
  }
}

testEmail();
