const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://aonmnmyqtsxqjfqwohiy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbm1ubXlxdHN4cWpmcXdvaGl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQyNjUyNywiZXhwIjoyMDg3MDAyNTI3fQ.NCrQCmlsoER7e8CHqQc9KCP4A3Y2LtL_ms-f3_XiAhw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Buscar en profiles quién tiene role admin/superadmin
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, nombre, role, telefono')
    .in('role', ['admin', 'superadmin']);
  
  console.log('=== Perfiles con rol admin/superadmin ===');
  if (admins) {
    for (const a of admins) {
      const { data: userData } = await supabase.auth.admin.getUserById(a.id);
      console.log({
        email: userData?.user?.email,
        nombre: a.nombre,
        role: a.role,
        telefono: a.telefono,
        user_metadata: userData?.user?.user_metadata,
        app_metadata: userData?.user?.app_metadata,
        created_at: userData?.user?.created_at,
      });
    }
  }

  // También buscar en user_metadata/app_metadata
  console.log('\n=== Todos los usuarios con sus metadatos ===');
  const { data: { users } } = await supabase.auth.admin.listUsers();
  for (const u of users) {
    if (u.user_metadata?.role === 'superadmin' || u.app_metadata?.role === 'superadmin' || u.email?.includes('admin')) {
      console.log({
        email: u.email,
        user_metadata: u.user_metadata,
        app_metadata: u.app_metadata,
        created_at: u.created_at,
      });
    }
  }
}
main();
