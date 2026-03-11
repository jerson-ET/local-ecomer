import { getWhatsAppSession } from './whatsappClient';

console.log("🚀 Iniciando prueba de WhatsApp sin necesidad de Redis/BullMQ...");
console.log("Generando servidor web para mostrarte el QR...");

getWhatsAppSession('tienda_demo').catch(console.error);
