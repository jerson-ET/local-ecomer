// Script para inspeccionar la estructura de la tabla profiles
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aonmnmyqtsxqjfqwohiy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbm1ubXlxdHN4cWpmcXdvaGl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQyNjUyNywiZXhwIjoyMDg3MDAyNTI3fQ.NCrQCmlsoER7e8CHqQc9KCP4A3Y2LtL_ms-f3_XiAhw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('🔍 Inspeccionando tabla profiles...\n');

  // Obtener un solo profile para ver la estructura
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(3);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️  No hay profiles en la tabla');
    return;
  }

  console.log('📋 Columnas encontradas:');
  console.log(Object.keys(profiles[0]));
  console.log('\n📋 Datos de ejemplo (primer profile):');
  console.log(JSON.stringify(profiles[0], null, 2));
}

main().catch(console.error);
