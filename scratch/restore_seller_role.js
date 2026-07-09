const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const email = 'mazaabor22@gmail.com';
  const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) {
    console.error(userErr);
    return;
  }
  
  const user = users.find(u => u.email === email);
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'seller' })
    .eq('id', user.id)
    .select();
    
  if (error) {
    console.error('Error updating profile:', error);
  } else {
    console.log('Successfully restored profile to seller:', data);
  }
}

main();
