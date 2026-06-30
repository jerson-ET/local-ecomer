const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://aonmnmyqtsxqjfqwohiy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbm1ubXlxdHN4cWpmcXdvaGl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQyNjUyNywiZXhwIjoyMDg3MDAyNTI3fQ.NCrQCmlsoER7e8CHqQc9KCP4A3Y2LtL_ms-f3_XiAhw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: users, error: err } = await supabase.auth.admin.listUsers();
  if (err) {
    console.error('Error fetching users:', err);
    return;
  }
  for (const u of users.users) {
    console.log(`User: ${u.email} (ID: ${u.id}) Role metadata:`, u.user_metadata);
  }
}
main();
