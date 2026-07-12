// Script para ejecutar migraciones y actualizaciones en Supabase
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aonmnmyqtsxqjfqwohiy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbm1ubXlxdHN4cWpmcXdvaGl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQyNjUyNywiZXhwIjoyMDg3MDAyNTI3fQ.NCrQCmlsoER7e8CHqQc9KCP4A3Y2LtL_ms-f3_XiAhw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('🚀 Iniciando configuración de Supabase...\n');

  // 1. Listar todos los profiles
  console.log('📋 Listando todos los profiles:');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, email, role, created_by_sales_id')
    .order('role', { ascending: true });

  if (profilesError) {
    console.error('❌ Error listando profiles:', profilesError);
    return;
  }

  console.log(`✅ Encontrados ${profiles.length} profiles:\n`);
  profiles.forEach(p => {
    console.log(`  - [${p.role}] ${p.name || 'Sin nombre'} (${p.email}) - ID: ${p.id} - Creado por: ${p.created_by_sales_id || 'NADIE'}`);
  });

  // 2. Encontrar el asesor (sales)
  const salesUsers = profiles.filter(p => p.role === 'sales');
  const sellers = profiles.filter(p => p.role === 'seller');

  console.log(`\n📊 Resumen:`);
  console.log(`  - Asesores (sales): ${salesUsers.length}`);
  console.log(`  - Vendedores (seller): ${sellers.length}`);

  if (salesUsers.length === 0) {
    console.log('\n❌ No se encontró ningún usuario con rol "sales".');
    return;
  }

  if (sellers.length === 0) {
    console.log('\n❌ No se encontraron vendedores.');
    return;
  }

  // 3. Asignar todos los vendedores al primer asesor (para que aparezcan en su chat)
  const salesId = salesUsers[0].id;
  console.log(`\n🎯 Asesor seleccionado: ${salesUsers[0].name || salesUsers[0].email} (${salesId})`);

  for (const seller of sellers) {
    if (seller.created_by_sales_id === null) {
      console.log(`\n🔄 Actualizando vendedor: ${seller.name || seller.email}`);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ created_by_sales_id: salesId })
        .eq('id', seller.id);

      if (updateError) {
        console.error(`❌ Error actualizando ${seller.email}:`, updateError);
      } else {
        console.log(`✅ Vendedor asignado a ${salesUsers[0].name || salesUsers[0].email}`);
      }
    } else {
      console.log(`\n⏭️  ${seller.name || seller.email} ya tiene asesor asignado: ${seller.created_by_sales_id}`);
    }
  }

  // 4. Listar de nuevo para confirmar
  console.log('\n\n📋 Estado final de los vendedores:');
  const { data: finalSellers } = await supabase
    .from('profiles')
    .select('id, name, email, role, created_by_sales_id')
    .eq('role', 'seller');

  finalSellers?.forEach(s => {
    console.log(`  - ${s.name || 'Sin nombre'} (${s.email}) - Asesor: ${s.created_by_sales_id || 'NADIE'}`);
  });

  console.log('\n✨ ¡Proceso completado!');
}

main().catch(console.error);
