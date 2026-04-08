require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aonmnmyqtsxqjfqwohiy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("No se encontró SUPABASE_SERVICE_ROLE_KEY. Verifica tu .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function isVaultCodeFormat(code) {
  if (!code) return false;
  // Letra - Numero - Numero - Numero - Letra => total 5
  return /^[A-Z]\d{3}[A-Z]$/i.test(code);
}

async function run() {
  console.log(`🚀 Iniciando migración de códigos antiguos...`);
  
  // Obtener todos los usuarios
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
     console.error('Error fetching users:', error);
     return;
  }
  
  let migratedCount = 0;
  
  for (const user of users) {
     const currentCode = user.user_metadata?.referral_code;
     
     // Si no tiene código o es de los viejos
     if (!isVaultCodeFormat(currentCode)) {
        console.log(`Migrando usuario ${user.email} (Código actual: ${currentCode || 'N/A'})...`);
        
        // Obtener 1 disponible
        const { data: codeData } = await supabase
          .from('referral_codes')
          .select('code')
          .eq('status', 'available')
          .limit(1)
          .maybeSingle();
          
        if (codeData && codeData.code) {
           const newCode = codeData.code;
           
           // Marcarlo como asignado
           const { error: updateError } = await supabase.from('referral_codes').update({
              status: 'assigned',
              user_id: user.id,
              email: user.email,
              assigned_at: new Date().toISOString()
           }).eq('code', newCode);
           
           if (!updateError) {
             // Actualizar metadatos
             await supabase.auth.admin.updateUserById(user.id, {
               user_metadata: {
                 ...user.user_metadata,
                 referral_code: newCode
               }
             });
             migratedCount++;
             console.log(`✅ Nuevo código ${newCode} asignado a ${user.email}.`);
           } else {
             console.error(`Error actualizando código ${newCode} en base de datos.`, updateError);
           }
        } else {
           console.error("❌ No hay códigos disponibles en la bodega.");
           break;
        }
     }
  }
  
  console.log(`🎉 Migración finalizada. Cuantas actualizadas: ${migratedCount}.`);
}

run();
