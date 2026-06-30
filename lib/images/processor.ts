/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PROCESADOR DE IMÁGENES — REESCRITO DESDE CERO                             */
/*                                                                              */
/*  Convierte CUALQUIER imagen a WebP optimizado usando Sharp.                 */
/*  Genera imagen completa + thumbnail para cada archivo subido.              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import sharp from 'sharp'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CONFIGURACIÓN                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Dimensiones máximas para imagen full (producto/banner) */
const FULL_MAX_WIDTH = 1200
const FULL_MAX_HEIGHT = 1200

/** Dimensiones del thumbnail */
const THUMB_WIDTH = 400
const THUMB_HEIGHT = 400

/** Rango objetivo de peso final en bytes (Ya no se usa compresión agresiva) */
const TARGET_MIN_KB = 300
const TARGET_MAX_KB = 1000

/** Para banners usamos dimensiones más anchas */
const BANNER_MAX_WIDTH = 1600
const BANNER_MAX_HEIGHT = 600

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  INTERFACES                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface ProcessedImage {
  /** Buffer de la imagen completa en WebP */
  full: Buffer
  /** Buffer del thumbnail en WebP */
  thumbnail: Buffer
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FUNCIÓN PRINCIPAL: Optimizar imagen a WebP                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Convierte cualquier imagen a WebP optimizado.
 * Usa búsqueda binaria para encontrar la calidad que produce
 * un archivo entre TARGET_MIN_KB y TARGET_MAX_KB.
 *
 * @param input  - Buffer de la imagen original (cualquier formato)
 * @param isBanner - Si es banner, usa dimensiones más anchas
 * @returns Imagen completa + thumbnail, ambos en WebP
 */
export async function optimizeToWebP(
  input: Buffer,
  isBanner: boolean = false
): Promise<ProcessedImage> {
  /* ─── 1. Leer metadata original ─── */
  const metadata = await sharp(input).metadata()
  const origW = metadata.width || FULL_MAX_WIDTH
  const origH = metadata.height || FULL_MAX_HEIGHT

  /* ─── 2. Calcular dimensiones destino ─── */
  const maxW = isBanner ? BANNER_MAX_WIDTH : FULL_MAX_WIDTH
  const maxH = isBanner ? BANNER_MAX_HEIGHT : FULL_MAX_HEIGHT

  let targetW = origW
  let targetH = origH
  if (targetW > maxW || targetH > maxH) {
    const ratio = Math.min(maxW / targetW, maxH / targetH)
    targetW = Math.round(targetW * ratio)
    targetH = Math.round(targetH * ratio)
  }

  /* ─── 3. Generar imagen en alta calidad (HD) ─── */
  const bestBuffer = await sharp(input)
    .resize(targetW, targetH, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90, effort: 4 })
    .toBuffer()

  /* ─── 4. Crear thumbnail de alta calidad ─── */
  const thumbnail = await sharp(input)
    .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: 'cover', position: 'center' })
    .webp({ quality: 85, effort: 4 })
    .toBuffer()

  console.log(
    `[IMG] Procesado: ${(input.length / 1024).toFixed(0)} KB → ` +
    `Full ${(bestBuffer.length / 1024).toFixed(0)} KB, ` +
    `Thumb ${(thumbnail.length / 1024).toFixed(0)} KB`
  )

  return { full: bestBuffer, thumbnail }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Generar clave única para R2                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Genera una clave única para almacenar en R2.
 *
 * Formato: folder/id/variant-timestamp-random.webp
 * Ejemplo: banners/store-abc/img-0-1699876543-x7k2p.webp
 */
export function generateImageKey(
  folder: string,
  id: string,
  variant: string
): string {
  const ts = Math.floor(Date.now() / 1000)
  const rand = Math.random().toString(36).substring(2, 7)
  return `${folder}/${id}/${variant}-${ts}-${rand}.webp`
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Validar que un Buffer es una imagen real                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function isValidImage(input: Buffer): Promise<boolean> {
  try {
    const meta = await sharp(input).metadata()
    return !!(meta.format && meta.width && meta.height)
  } catch {
    return false
  }
}
