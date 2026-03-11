import { makeWASocket, useMultiFileAuthState, DisconnectReason, WASocket, Browsers, fetchLatestBaileysVersion, proto, downloadMediaMessage } from '@whiskeysockets/baileys';
import pino from 'pino';
import * as qrcodeTerminal from 'qrcode-terminal';
import * as qrcode from 'qrcode';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';

const requestLogger = pino({ level: 'silent' });

// Mapa multitenant
const activeSessions: Map<string, WASocket> = new Map();

// Estado
let lastQRData: string | null = null;
let isConnected: boolean = false;
let isInitializing: Map<string, boolean> = new Map();

// ─── Almacén en memoria de chats, contactos y mensajes ───
interface StoredMessage {
  id: string;
  from: string;
  pushName: string;
  text: string;
  timestamp: number;
  isMe: boolean;
  type: string; // 'text' | 'image' | 'video' | 'status' etc
  mediaPath?: string;
}

interface ChatInfo {
  jid: string;
  name: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
}

const chatStore: Map<string, ChatInfo> = new Map();
const messageStore: Map<string, StoredMessage[]> = new Map(); // jid → messages
const statusStore: StoredMessage[] = []; // estados de contactos
const MEDIA_DIR = resolve(__dirname, '..', 'media');

// Crear directorio de media
mkdir(MEDIA_DIR, { recursive: true }).catch(() => {});

// Cola de publicación
interface PublishJob {
  image: string;
  caption: string;
  userId: string;
}
let publishQueue: PublishJob[] = [];
let isPublishing = false;

async function processPublishQueue() {
  if (isPublishing || publishQueue.length === 0) return;
  isPublishing = true;
  console.log(`\n📤 [COLA] Enviando ${publishQueue.length} imágenes de catálogo...`);

  while (publishQueue.length > 0) {
    const job = publishQueue.shift()!;
    try {
      console.log(`⏳ [CATÁLOGO] Enviando: ${job.caption.substring(0, 50)}...`);
      
      const socket = activeSessions.get(job.userId);
      if (!socket) throw new Error('No hay sesión activa');
      
      // Obtener nuestro propio JID para enviar a "Mensajes guardados"
      const me = (socket as any).user?.id;
      const myJid = me?.includes(':') ? me.split(':')[0] + '@s.whatsapp.net' : me;
      
      if (!myJid) throw new Error('No se pudo obtener JID propio');

      // Enviar imagen a nuestro propio chat (esto SÍ funciona y aparece en el teléfono)
      await socket.sendMessage(myJid, {
        image: { url: job.image },
        caption: job.caption,
      });
      
      console.log(`✅ [CATÁLOGO] Enviado a tu chat exitosamente.`);
      
      // También intentar publicar al estado (puede que funcione en algunas versiones)
      try {
        const statusJidList = await getStatusJidList(socket);
        await socket.sendMessage('status@broadcast', {
          image: { url: job.image },
          caption: job.caption,
        }, { statusJidList, broadcast: true });
        console.log(`🔄 [ESTADO] También se intentó publicar como estado.`);
      } catch (statusErr) {
        console.log(`ℹ️ [ESTADO] Estado broadcast no disponible (limitación de WhatsApp Web).`);
      }

      if (publishQueue.length > 0) {
        console.log(`⏸️  Esperando 20 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    } catch (error) {
      console.error(`❌ [ERROR] Falló:`, error);
    }
  }
  isPublishing = false;
  console.log(`🏁 [COLA] Todas las imágenes enviadas.\n`);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// ─── Servidor HTTP ───
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200); res.end(); return;
  }

  const url = req.url || '/';

  // ─── POST /publish ───
  if (req.method === 'POST' && url === '/publish') {
    try {
      const body = await readBody(req);
      const { storeSlug, items } = JSON.parse(body);
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No se recibieron items' })); return;
      }
      if (!isConnected) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'WhatsApp no está conectado. Escanea el QR primero.' })); return;
      }
      const activeUserId = activeSessions.keys().next().value || 'tienda_demo';
      for (const item of items) {
        publishQueue.push({
          image: item.image,
          caption: `https://localecomer.vercel.app/tienda/${storeSlug}`,
          userId: activeUserId,
        });
      }
      console.log(`📥 [API] Recibidos ${items.length} estados para publicar de ${storeSlug}.`);
      processPublishQueue();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, queued: items.length }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // ─── POST /send ─── Enviar mensaje a un chat
  if (req.method === 'POST' && url === '/send') {
    try {
      const body = await readBody(req);
      const { jid, message } = JSON.parse(body);
      if (!jid || !message || !isConnected) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'jid y message requeridos, o WhatsApp no conectado' })); return;
      }
      const activeUserId = activeSessions.keys().next().value || 'tienda_demo';
      const socket = activeSessions.get(activeUserId);
      if (!socket) { res.writeHead(500); res.end(JSON.stringify({ error: 'No hay sesión activa' })); return; }
      
      await socket.sendMessage(jid, { text: message });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // ─── POST /api/pair ─── Solicitar código de emparejamiento con número de celular
  if (req.method === 'POST' && url === '/api/pair') {
    try {
      const body = await readBody(req);
      const { phone } = JSON.parse(body);
      if (!phone) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Número de teléfono requerido' })); return;
      }
      
      const activeUserId = activeSessions.keys().next().value || 'tienda_demo';
      
      // Reiniciar sesión si ya existe pero no está conectada, para asegurar un estado limpio
      if (activeSessions.has(activeUserId) && !isConnected) {
        console.log(`[PAIR] Reiniciando sesión para asegurar estado limpio para ${phone}...`);
        const oldSocket = activeSessions.get(activeUserId);
        try { oldSocket?.end(undefined); } catch(e) {}
        activeSessions.delete(activeUserId);
      }

      console.log(`[PAIR] Iniciando nueva sesión para vinculación por número: ${phone}`);
      const socket = await getWhatsAppSession(activeUserId);

      // Esperar a que el socket esté realmente listo para generar el código
      // Baileys necesita que el socket esté en estado de espera para QR o emparejamiento
      let attempts = 0;
      let code = null;
      
      while (attempts < 5 && !code) {
        try {
          console.log(`[PAIR] Intento ${attempts + 1} de solicitar código para ${phone}...`);
          // Esperar un poco más en el primer intento, y luego reintentar
          await new Promise(resolve => setTimeout(resolve, attempts === 0 ? 3000 : 2000));
          code = await socket.requestPairingCode(phone);
        } catch (err: any) {
          console.log(`[PAIR] Intento ${attempts + 1} falló: ${err.message}`);
          attempts++;
          if (attempts >= 5) throw err;
        }
      }
      
      console.log(`[PAIR] ✅ Código generado exitosamente para ${phone}: ${code}`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code }));
    } catch (error: any) {
      console.error('[PAIR] ❌ Error fatal:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Error interno al generar código' }));
    }
    return;
  }

  // ─── POST /upload-status ─── Subir estado con imagen desde la plataforma
  if (req.method === 'POST' && url === '/upload-status') {
    try {
      const body = await readBody(req);
      const { imageBase64, imageUrl, caption } = JSON.parse(body);
      if (!isConnected) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'WhatsApp no conectado' })); return;
      }
      const activeUserId = activeSessions.keys().next().value || 'tienda_demo';
      const socket = activeSessions.get(activeUserId);
      if (!socket) { res.writeHead(500); res.end(JSON.stringify({ error: 'No hay sesión' })); return; }

      const statusJidList = await getStatusJidList(socket);
      console.log(`[UPLOAD-STATUS] Enviando estado con ${statusJidList.length} destinatarios...`);

      if (imageBase64) {
        // Imagen en base64
        const buffer = Buffer.from(imageBase64, 'base64');
        await socket.sendMessage('status@broadcast', {
          image: buffer,
          caption: caption || '',
        }, { statusJidList, broadcast: true });
      } else if (imageUrl) {
        // Imagen desde URL
        await socket.sendMessage('status@broadcast', {
          image: { url: imageUrl },
          caption: caption || '',
        }, { statusJidList, broadcast: true });
      } else {
        // Solo texto
        await socket.sendMessage('status@broadcast', {
          text: caption || '...',
        }, { statusJidList, broadcast: true });
      }

      console.log(`[UPLOAD-STATUS] ✅ Estado subido exitosamente.`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (error: any) {
      console.error('[UPLOAD-STATUS] Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // ─── GET /api/chats ─── Lista de chats
  if (url === '/api/chats') {
    const chats = Array.from(chatStore.values())
      .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
      .slice(0, 50);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(chats));
    return;
  }

  // ─── GET /api/messages?jid=xxx ─── Mensajes de un chat
  if (url.startsWith('/api/messages')) {
    const params = new URL(url, 'http://localhost').searchParams;
    const jid = params.get('jid');
    if (!jid) { res.writeHead(400); res.end(JSON.stringify({ error: 'jid requerido' })); return; }
    const msgs = messageStore.get(jid) || [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(msgs.slice(-100))); // últimos 100 mensajes
    return;
  }

  // ─── GET /api/statuses ─── Estados de contactos
  if (url === '/api/statuses') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(statusStore.slice(-50)));
    return;
  }

  // ─── GET /api/me ─── Info del usuario conectado
  if (url === '/api/me') {
    const activeUserId = activeSessions.keys().next().value;
    const socket = activeUserId ? activeSessions.get(activeUserId) : null;
    const me = socket ? (socket as any).user : null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      connected: isConnected, 
      user: me,
      queueLength: publishQueue.length,
      isPublishing,
      totalChats: chatStore.size,
      totalStatuses: statusStore.length,
    }));
    return;
  }

  // ─── GET /api/qr ───
  if (url === '/api/qr') {
    // Si no estamos conectados y no hay QR, podríamos estar en un estado de limbo
    // Intentamos asegurar que el socket esté activo
    if (!isConnected && !lastQRData) {
      const activeUserId = activeSessions.keys().next().value || 'tienda_demo';
      if (!activeSessions.has(activeUserId)) {
        console.log('[API/QR] No hay sesión activa. Iniciando...');
        getWhatsAppSession(activeUserId);
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      connected: isConnected, 
      qr: lastQRData,
      timestamp: Date.now() 
    }));
    return;
  }

  // ─── POST /api/reset ─── Forzar cierre y reinicio de sesión
  if (req.method === 'POST' && url === '/api/reset') {
    const activeUserId = activeSessions.keys().next().value || 'tienda_demo';
    console.log(`[RESET] Forzando reinicio de sesión para ${activeUserId}`);
    
    const socket = activeSessions.get(activeUserId);
    if (socket) {
      try { socket.end(undefined); } catch(e) {}
      activeSessions.delete(activeUserId);
    }
    
    isConnected = false;
    lastQRData = null;
    
    // Iniciar de nuevo en el background
    getWhatsAppSession(activeUserId);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Sesión reiniciada' }));
    return;
  }

  // ─── GET /status ───
  if (url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connected: isConnected, queueLength: publishQueue.length, isPublishing }));
    return;
  }

  // ─── GET /media/xxx ─── Servir archivos media descargados
  if (url.startsWith('/media/')) {
    const filename = url.replace('/media/', '');
    const filePath = resolve(MEDIA_DIR, filename);
    try {
      const { readFile } = await import('fs/promises');
      const data = await readFile(filePath);
      // Determinar content-type
      const ext = filename.split('.').pop() || 'bin';
      const types: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', ogg: 'audio/ogg' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404); res.end('Not found');
    }
    return;
  }

  // ─── GET / → QR Viewer ───
  if (url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (isConnected) {
      res.end(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;"><h1 style="color:#25D366;">✅ ¡WhatsApp Conectado!</h1><p>Ya puedes volver a tu panel.</p></body></html>`);
    } else if (lastQRData) {
      try {
        const qrDataUrl = await qrcode.toDataURL(lastQRData);
        res.end(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;"><h2>Escanea este QR</h2><img src="${qrDataUrl}" style="border-radius:20px;box-shadow:0 4px 15px rgba(0,0,0,.1);width:300px;height:300px;"/><p style="color:#555;margin-top:20px;">Esperando...</p><script>setTimeout(()=>location.reload(),3000)</script></body></html>`);
      } catch { res.end('Error QR'); }
    } else {
      res.end(`<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h2>Cargando conexión...</h2><script>setTimeout(()=>location.reload(),2000)</script></body></html>`);
    }
  }
});

const PORT = process.env.PORT || 3015;
server.listen(PORT, () => console.log(`🌐 Servidor WhatsApp Worker en: http://localhost:${PORT}`));

// ─── Sesión de WhatsApp con listeners completos ───
export async function getWhatsAppSession(userId: string): Promise<WASocket> {
  if (activeSessions.has(userId)) return activeSessions.get(userId)!;
  if (isInitializing.get(userId)) {
    console.log(`[NÚCLEO] Ya se está inicializando una sesión para ${userId}. Esperando...`);
    while (isInitializing.get(userId)) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (activeSessions.has(userId)) return activeSessions.get(userId)!;
    }
  }

  isInitializing.set(userId, true);
  try {
    const sessionPath = resolve(__dirname, '..', 'sessions', userId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    console.log(`[NÚCLEO] Inicializando sesión: ${userId} (WA v${version.join('.')})`);

    const socket = makeWASocket({
      version, 
      auth: state, 
      logger: requestLogger,
      printQRInTerminal: false, 
      syncFullHistory: false,
      browser: Browsers.ubuntu('Chrome'),
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      retryRequestDelayMs: 5000,
    }) as WASocket;

  socket.ev.on('creds.update', saveCreds);

  // ─── Listener de MENSAJES ───
  socket.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const msg of messages) {
      if (!msg.message) continue;
      
      const jid = msg.key.remoteJid || '';
      const isStatus = jid === 'status@broadcast';
      const isMe = msg.key.fromMe || false;
      const pushName = msg.pushName || jid.split('@')[0];
      const timestamp = typeof msg.messageTimestamp === 'number' 
        ? msg.messageTimestamp 
        : Number(msg.messageTimestamp) || Date.now() / 1000;

      // Extraer texto
      let text = '';
      const m = msg.message;
      if (m.conversation) text = m.conversation;
      else if (m.extendedTextMessage) text = m.extendedTextMessage.text || '';
      else if (m.imageMessage) text = `📷 ${m.imageMessage.caption || 'Foto'}`;
      else if (m.videoMessage) text = `🎥 ${m.videoMessage.caption || 'Video'}`;
      else if (m.audioMessage) text = '🎵 Audio';
      else if (m.documentMessage) text = `📄 ${m.documentMessage.fileName || 'Documento'}`;
      else if (m.stickerMessage) text = '🏷️ Sticker';
      else text = '💬 Mensaje';

      // Determinar tipo
      let msgType = 'text';
      let mediaPath: string | undefined;
      
      if (m.imageMessage || m.videoMessage || m.stickerMessage) {
        msgType = m.imageMessage ? 'image' : m.videoMessage ? 'video' : 'sticker';
        
        // Intentar descargar media
        try {
          const buffer = await downloadMediaMessage(msg, 'buffer', {}, {
            logger: requestLogger as any,
            reuploadRequest: socket.updateMediaMessage,
          });
          if (buffer) {
            const ext = msgType === 'image' ? 'jpg' : msgType === 'video' ? 'mp4' : 'webp';
            const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
            await writeFile(resolve(MEDIA_DIR, filename), buffer as Buffer);
            mediaPath = `/media/${filename}`;
          }
        } catch (e) {
          console.log(`[MEDIA] No se pudo descargar: ${(e as Error).message}`);
        }
      }

      const stored: StoredMessage = {
        id: msg.key.id || `${Date.now()}`,
        from: isStatus ? (msg.key.participant || jid) : jid,
        pushName,
        text,
        timestamp,
        isMe,
        type: msgType,
        mediaPath,
      };

      if (isStatus) {
        // Es un estado de un contacto
        statusStore.push(stored);
        if (statusStore.length > 200) statusStore.splice(0, statusStore.length - 200);
        console.log(`📱 [ESTADO RECIBIDO] ${pushName}: ${text}`);
      } else {
        // Es un mensaje de chat normal
        if (!messageStore.has(jid)) messageStore.set(jid, []);
        messageStore.get(jid)!.push(stored);
        
        // Limitar mensajes 
        const msgs = messageStore.get(jid)!;
        if (msgs.length > 500) msgs.splice(0, msgs.length - 500);

        // Actualizar chat store
        const existing = chatStore.get(jid);
        chatStore.set(jid, {
          jid,
          name: pushName || existing?.name || jid.split('@')[0],
          lastMessage: text,
          lastTimestamp: timestamp,
          unreadCount: isMe ? 0 : (existing?.unreadCount || 0) + 1,
        });

        if (type === 'notify' && !isMe) {
          console.log(`💬 [MSG] ${pushName} (${jid}): ${text.substring(0, 60)}`);
        }
      }
    }
  });

  // ─── Listener de CONTACTOS ───
  socket.ev.on('contacts.upsert' as any, (contacts: any[]) => {
    for (const c of contacts) {
      if (c.id && c.id.endsWith('@s.whatsapp.net')) {
        const existing = chatStore.get(c.id);
        if (existing) {
          existing.name = c.name || c.notify || existing.name;
        } else {
          chatStore.set(c.id, {
            jid: c.id,
            name: c.name || c.notify || c.id.split('@')[0],
            lastMessage: '',
            lastTimestamp: 0,
            unreadCount: 0,
          });
        }
      }
    }
    console.log(`📇 [CONTACTOS] ${contacts.length} contactos sincronizados.`);
  });

  socket.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log(`\n[QR] Escanea en http://localhost:3015\n`);
      qrcodeTerminal.generate(qr, { small: true });
      lastQRData = qr; isConnected = false;
    }
    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 401;
      
      console.log(`[${userId}] Desconectado (${statusCode}). Reconectar: ${shouldReconnect}`);
      
      activeSessions.delete(userId); 
      isConnected = false;
      lastQRData = null;

      if (statusCode === 401 || statusCode === DisconnectReason.loggedOut) {
        console.log(`[${userId}] 🚨 Sesión inválida o cerrada. Limpiando archivos...`);
        import('fs').then(fs => {
          const sessionPath = resolve(__dirname, '..', 'sessions', userId);
          if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log(`[${userId}] Archivos de sesión eliminados.`);
          }
        });
      }

      if (shouldReconnect) {
        const delay = statusCode === 408 ? 5000 : 2000;
        console.log(`[${userId}] Intentando reconectar en ${delay/1000} segundos...`);
        setTimeout(() => getWhatsAppSession(userId), delay);
      }
    } else if (connection === 'open') {
      console.log(`[${userId}] ✅ ¡Conectado!`);
      isConnected = true; 
      lastQRData = null;
    }
  });

    activeSessions.set(userId, socket);
    return socket;
  } catch (err) {
    console.error(`[NÚCLEO] ❌ Error al inicializar sesión para ${userId}:`, err);
    throw err;
  } finally {
    isInitializing.set(userId, false);
  }
}

// ─── Status JID List: Obtener TODOS los contactos posibles ───
async function getStatusJidList(socket: WASocket): Promise<string[]> {
  const jidSet = new Set<string>();

  // 1. Nuestro propio JID (SIEMPRE incluirlo)
  const me = (socket as any).user?.id;
  if (me) {
    const myJid = me.includes(':') ? me.split(':')[0] + '@s.whatsapp.net' : me;
    jidSet.add(myJid);
  }

  // 2. Contactos del store interno de Baileys
  try {
    if ((socket as any).store?.contacts) {
      for (const jid of Object.keys((socket as any).store.contacts)) {
        if (jid.endsWith('@s.whatsapp.net')) jidSet.add(jid);
      }
    }
  } catch (e) { /* silenciar */ }

  // 3. Contactos de nuestro chatStore (cualquiera que nos haya escrito)
  for (const [jid] of chatStore) {
    if (jid.endsWith('@s.whatsapp.net')) jidSet.add(jid);
  }

  const jids = Array.from(jidSet);
  console.log(`[CONTACTOS] ${jids.length} destinatarios para el estado.`);
  return jids;
}

/**
 * Enviar estado usando URL de imagen directa (método correcto para Baileys v7)
 */
export async function sendWhatsAppStatus(userId: string, imageSource: string | Buffer, captionText: string) {
  const socket = await getWhatsAppSession(userId);
  const statusJidList = await getStatusJidList(socket);

  if (statusJidList.length === 0) {
    throw new Error('No hay contactos para enviar el estado.');
  }

  // Si es un string (URL), intentar usar envío por URL
  if (typeof imageSource === 'string') {
    console.log(`[ESTADO] Enviando estado con URL de imagen a ${statusJidList.length} contactos...`);
    console.log(`[ESTADO] URL: ${imageSource.substring(0, 80)}...`);
    
    // Método 1: Intentar con URL directa (recomendado por Baileys docs)
    try {
      await socket.sendMessage('status@broadcast', {
        image: { url: imageSource },
        caption: captionText,
      }, {
        statusJidList,
        broadcast: true,
      });
      console.log(`[ESTADO] ✅ Publicado con URL directa para ${statusJidList.length} contactos.`);
      return;
    } catch (urlError) {
      console.log(`[ESTADO] ⚠️ URL directa falló, intentando descargar a buffer...`, (urlError as Error).message);
    }

    // Método 2: Fallback con buffer descargado
    try {
      const response = await fetch(imageSource);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await socket.sendMessage('status@broadcast', {
        image: buffer,
        caption: captionText,
      }, {
        statusJidList,
        broadcast: true,
      });
      console.log(`[ESTADO] ✅ Publicado con buffer descargado para ${statusJidList.length} contactos.`);
      return;
    } catch (bufferError) {
      console.error(`[ESTADO] ❌ Ambos métodos fallaron para la URL:`, (bufferError as Error).message);
      throw bufferError;
    }
  } else {
    // Si ya es un Buffer (vía Worker)
    console.log(`[ESTADO] Enviando estado con Buffer local a ${statusJidList.length} contactos...`);
    try {
      await socket.sendMessage('status@broadcast', {
        image: imageSource,
        caption: captionText,
      }, {
        statusJidList,
        broadcast: true,
      });
      console.log(`[ESTADO] ✅ Publicado usando Buffer directo para ${statusJidList.length} contactos.`);
      return;
    } catch (error) {
       console.error(`[ESTADO] ❌ Método con Buffer directo falló:`, (error as Error).message);
       throw error;
    }
  }
}
