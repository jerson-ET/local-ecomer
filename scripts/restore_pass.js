const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://aonmnmyqtsxqjfqwohiy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbm1ubXlxdHN4cWpmcXdvaGl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQyNjUyNywiZXhwIjoyMDg3MDAyNTI3fQ.NCrQCmlsoER7e8CHqQc9KCP4A3Y2LtL_ms-f3_XiAhw'
);

async function main() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const admin = users.find(u => u.email === 'jerson@admin.com');
  const naira = users.find(u => u.email === 'mazaabor22@gmail.com');

  // Restaurar contraseña del admin
  const { error: e1 } = await supabase.auth.admin.updateUserById(admin.id, { password: 'J1e2r3s4;7' });
  console.log(e1 ? 'Error admin: ' + e1.message : '✅ jerson@admin.com restaurado a J1e2r3s4;7');

  // Restaurar contraseña de nairashop (buscar su password_plain)
  const nairaPass = naira.user_metadata?.password_plain;
  if (nairaPass) {
    const { error: e2 } = await supabase.auth.admin.updateUserById(naira.id, { password: nairaPass });
    console.log(e2 ? 'Error naira: ' + e2.message : '✅ mazaabor22@gmail.com restaurado a ' + nairaPass);
  } else {
    console.log('⚠️ mazaabor22@gmail.com no tiene password_plain guardado, dejando Password123!');
  }
}
main();
