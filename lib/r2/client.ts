/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CLIENTE CLOUDFLARE R2 — REESCRITO DESDE CERO                              */
/*                                                                              */
/*  Este módulo maneja TODA la comunicación con Cloudflare R2.                 */
/*  Usa el SDK de AWS S3 porque R2 es compatible con la API de S3.            */
/*                                                                              */
/*  VARIABLES DE ENTORNO NECESARIAS en .env.local:                             */
/*    R2_ENDPOINT          — https://<ACCOUNT_ID>.r2.cloudflarestorage.com     */
/*    R2_ACCESS_KEY_ID     — Clave de acceso                                   */
/*    R2_SECRET_ACCESS_KEY — Clave secreta                                     */
/*    R2_BUCKET_NAME       — Nombre del bucket                                 */
/*    R2_PUBLIC_URL        — URL pública del bucket (ej: https://pub-xxx.r2.dev) */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

/* Forzar IPv4 para evitar problemas de DNS en desarrollo local */
import dns from 'dns'
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first')
}

/* ─── Leer variables de entorno ─── */
const R2_ENDPOINT = process.env.R2_ENDPOINT || ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'localecomer-images'
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')

/* ─── Validar configuración al iniciar ─── */
function validateConfig(): void {
  const missing: string[] = []
  if (!R2_ENDPOINT) missing.push('R2_ENDPOINT')
  if (!R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID')
  if (!R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY')
  if (!R2_PUBLIC_URL) missing.push('R2_PUBLIC_URL')
  if (missing.length > 0) {
    console.warn(`[R2] ⚠️ Variables faltantes: ${missing.join(', ')}`)
  }
}
validateConfig()

/* ─── Cliente S3 configurado para Cloudflare R2 ─── */
const r2Client = new S3Client({
  region: 'auto',
  ...(R2_ENDPOINT && { endpoint: R2_ENDPOINT }),
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  /* R2 requiere path-style (no virtual-hosted-style) */
  forcePathStyle: true,
  /* Desactivar checksums que R2 no soporta */
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FUNCIÓN PRINCIPAL: Subir archivo a R2                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Sube un Buffer a Cloudflare R2 y retorna su URL pública.
 *
 * @param buffer      - Contenido del archivo
 * @param key         - Ruta en el bucket (ej: 'banners/store-123/img-0.webp')
 * @param contentType - MIME type (ej: 'image/webp')
 * @returns URL pública del archivo
 * @throws Error si la subida falla
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error(
      '[R2] No se puede subir: faltan variables de entorno de R2. ' +
      'Verifica R2_ENDPOINT, R2_ACCESS_KEY_ID y R2_SECRET_ACCESS_KEY en .env.local'
    )
  }

  console.log(`[R2] Subiendo: ${key} (${(buffer.length / 1024).toFixed(1)} KB)`)

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    /* Cache de 1 año (imágenes optimizadas no cambian, se crean nuevas) */
    CacheControl: 'public, max-age=31536000, immutable',
  })

  try {
    await r2Client.send(command)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Error desconocido'
    console.error(`[R2] ❌ Error subiendo ${key}:`, errMsg)
    throw new Error(`Error al subir imagen a R2: ${errMsg}`)
  }

  const publicUrl = `${R2_PUBLIC_URL}/${key}`
  console.log(`[R2] ✅ Subido: ${publicUrl}`)
  return publicUrl
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Eliminar archivo de R2                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })
  try {
    await r2Client.send(command)
    console.log(`[R2] 🗑️ Eliminado: ${key}`)
  } catch (err: unknown) {
    console.error(`[R2] Error eliminando ${key}:`, err)
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Utilidad: construir URL pública                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}
