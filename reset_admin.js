const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://aonmnmyqtsxqjfqwohiy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbm1ubXlxdHN4cWpmcXdvaGl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQyNjUyNywiZXhwIjoyMDg3MDAyNTI3fQ.NCrQCmlsoER7e8CHqQc9KCP4A3Y2LtL_ms-f3_XiAhw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  const adminUser = users.find(u => u.email === 'jerson@admin.com');
  if (adminUser) {
     const { data: user, error } = await supabase.auth.admin.updateUserById(
       adminUser.id,
       { password: 'Password123!' }
     );
     if (error) console.error(error);
     else console.log('Password reset successfully for', user.user.email);
  }
}
main();
