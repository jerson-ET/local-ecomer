import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import 'dotenv/config';

// 1. Conexión a Redis 
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

// 2. Aquí creamos la "Cola de Trabajos" donde mandaremos las órdenes desde el Panel de Next.js
const statusQueue = new Queue('whatsapp-statuses', { connection });

/**
 * Esta función simula lo que pasaría cuando un usuario en el Frontend
 * presiona "Programar mi catálogo de Hoy"
 */
async function scheduleDailyCatalog(userId: string) {
  console.log(`\n📅 [FRONTEND] Programando 10 estados para la tienda: ${userId}`);
  
  // Imaginemos que esto viene de tu Base de Datos (PostgreSQL/Supabase)
  const items = Array.from({ length: 10 }).map((_, index) => ({
    imagePath: '../prueba-zapato.jpg',
    captionText: `🔥 Promoción ${index + 1}/10 - ¡Compra ahora en local-ecomer.com/tienda_${userId}!`,
  }));

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;

  // Lógica de espaciado:
  // - Del ítem 1 al 5: Se publican *Ahorita*, con 20s de diferencia
  // - Del ítem 6 al 10: Se publican *En 1 Hora*, con 20s de diferencia
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Calculamos los milisegundos de retraso en función de tu pedido exacto
    let delayMs = 0;
    
    if (i < 5) {
      // Los primeros 5: empiezan de inmediato (delay=0), y se separan por 20 segundos cada uno
      delayMs = i * 20 * SECOND; // 0, 20s, 40s, 60s, 80s
    } else {
      // Los últimos 5 (índice 5 al 9): Empiezan en 1 Hora, y se separan por 20 segundos
      const step = i - 5;
      delayMs = HOUR + (step * 20 * SECOND); 
    }

    // Insertamos la Tarea en BullMQ con el Retraso programado (delay)
    await statusQueue.add(
      `Estado-${userId}-${i}`, 
      {
        userId,
        imagePath: item.imagePath,
        captionText: item.captionText
      },
      {
        delay: delayMs,
        attempts: 3, // Si hay un error de conexión, reintenta hasta 3 veces automáticamente
        backoff: { type: 'exponential', delay: 1000 } // Si falla de nuevo, espera el doble de tiempo
      }
    );
    
    console.log(`➕ [COLA] Estado ${i + 1} programado con retraso de ${Math.round(delayMs / 1000)} segundos`);
  }
  
  console.log(`✅ [FRONTEND] ¡Catálogo completo en la cola de Redis de forma asíncrona!\n`);
  
  // No necesitamos la conexión aquí en el frontend porque la subida la manejará el `worker.ts`
  await statusQueue.close();
}

// Simulamos el "Clic desde Next.js" a modo de prueba:
scheduleDailyCatalog('tienda_demo').catch(console.error);
