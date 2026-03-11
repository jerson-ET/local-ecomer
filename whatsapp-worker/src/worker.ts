import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { sendWhatsAppStatus, getWhatsAppSession } from './whatsappClient';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import 'dotenv/config';

// Conexión a tu Redis local (puedes cambiar esta variable de entorno en el servidor de producción)
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export interface StatusJobData {
  userId: string;
  imagePath: string; // Para esta prueba enviaremos una imagen del disco, en prod usarías una URL
  captionText: string;
}

console.log('👷🏻 Microservicio de Trabajos Iniciado. Esperando órdenes desde la Base de Datos/Redis...');

if (process.env.USE_REDIS === 'true') {
  // Este "Worker" escucha la cola "whatsapp-statuses"
  const worker = new Worker<StatusJobData>(
    'whatsapp-statuses',
    async (job: Job<StatusJobData>) => {
      const { userId, imagePath, captionText } = job.data;
      
      console.log(`\n⏳ Ejecutando Trabajo ID: ${job.id}`);
      console.log(`[TRABAJO] Procesando estado para ${userId}: "${captionText}"`);

      try {
        // 1. Cargar la imagen del disco duro o desde URL externa (Unsplash, R2, etc)
        let buffer: Buffer;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
           console.log(`[TRABAJO] Descargando imagen desde URL: ${imagePath}`);
           const response = await fetch(imagePath);
           if (!response.ok) throw new Error(`Error descargando imagen: ${response.statusText}`);
           const arrayBuffer = await response.arrayBuffer();
           buffer = Buffer.from(arrayBuffer);
        } else {
           const absolutePath = resolve(__dirname, '..', imagePath);
           buffer = await readFile(absolutePath);
        }

        // 2. Ejecutar la función para subir el estado de WhatsApp y esperar que termine
        await sendWhatsAppStatus(userId, buffer, captionText);

        console.log(`✅ [TRABAJO FINALIZADO] Estado subido con éxito.`);
      } catch (error) {
        console.error(`❌ [ERROR] Falló la subida de estado para ${userId}:`, error);
        // Esto le dice a BullMQ que intente de nuevo más tarde si hay un error
        throw error; 
      }
    },
    { 
      connection: connection as any,
      // Este concurrency opcional dice cuántos estados puede subir el servidor a la vez en paralelo (para diferentes usuarios)
      concurrency: 10 
    }
  );

  worker.on('failed', (job, err) => {
    console.log(`⚠️  El trabajo ${job?.id} falló con el error: ${err.message}`);
  });
} else {
  console.log('⚠️  Redis Worker desactivado localmente. Solo API y WhatsApp activos.');
}

// Iniciamos la sesión de Baileys al levantar el Worker para estar listos (opcional)
// Para esta prueba, arrancaremos la conexión del usuario "tienda_demo" justo al arrancar el script
getWhatsAppSession('tienda_demo').catch(console.error);
