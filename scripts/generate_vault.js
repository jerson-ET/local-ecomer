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

const NUM_CODES = 30000;
const BATCH_SIZE = 1000;

function getRandomChar() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

function getRandomDigit() {
  const digits = '0123456789';
  return digits.charAt(Math.floor(Math.random() * digits.length));
}

function generateCode() {
  // Formato: Leyenda [A-Z][0-9][0-9][0-9][A-Z]
  return `${getRandomChar()}${getRandomDigit()}${getRandomDigit()}${getRandomDigit()}${getRandomChar()}`;
}

async function run() {
  console.log(`🚀 Iniciando generación de ${NUM_CODES} códigos de invitación...`);
  
  const generatedCodes = new Set();
  
  while (generatedCodes.size < NUM_CODES) {
    generatedCodes.add(generateCode());
  }

  const codesArray = Array.from(generatedCodes).map(code => ({ code, status: 'available' }));
  
  console.log(`✅ ${codesArray.length} códigos únicos generados en memoria.`);
  console.log('⏳ Insertando en la base de datos (por lotes)...');

  let successCount = 0;
  for (let i = 0; i < codesArray.length; i += BATCH_SIZE) {
    const batch = codesArray.slice(i, i + BATCH_SIZE);
    
    try {
      const { error } = await supabase.from('referral_codes').insert(batch, { returning: 'minimal' });
      if (error) {
        console.error(`❌ Error en el lote ${i} - ${i + BATCH_SIZE}:`, error.message);
        // Podría ser error de duplicados si ejecutamos varias veces, podemos ignorar e intentar los demás.
      } else {
        successCount += batch.length;
        console.log(`👉 Insertados ${successCount} / ${codesArray.length}...`);
      }
    } catch (e) {
      console.error(`❌ Error inesperado:`, e.message);
    }
  }

  console.log(`🎉 Finalizado. Se insertaron ${successCount} códigos en la bodega.`);
}

run();
