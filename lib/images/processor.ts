/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                    PROCESADOR DE IMÁGENES                                    */
/*                                                                              */
/*   Propósito     : Optimizar y procesar imágenes antes de subirlas            */
/*   Uso           : Se usa antes de subir imágenes a R2                        */
/*   Archivo       : lib/images/processor.ts                                    */
/*                                                                              */
/*   ¿POR QUÉ PROCESAR IMÁGENES?                                                */
/*   1. RENDIMIENTO: Imágenes más pequeñas = carga más rápida                   */
/*   2. AHORRO: Menos espacio = menos costo de almacenamiento                   */
/*   3. CONSISTENCIA: Todas las imágenes tienen tamaños estándar                */
/*   4. FORMATO: WebP es más eficiente que JPEG/PNG                             */
/*                                                                              */
/*   FUNCIONALIDADES:                                                           */
/*   - Redimensionar imágenes a tamaño máximo                                   */
/*   - Convertir a formato WebP (más eficiente)                                 */
/*   - Crear thumbnails para listados                                           */
/*   - Generar nombres únicos para evitar colisiones                            */
/*                                                                              */
/*   DEPENDENCIA:                                                               */
/*   Este módulo usa Sharp (https://sharp.pixelplumbing.com/)                   */
/*   para el procesamiento de imágenes. Es muy rápido y eficiente.              */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────── */
/*                              IMPORTACIONES                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Sharp es la librería de procesamiento de imágenes más rápida para Node.js    */
/* Soporta: resize, crop, rotate, convertir formatos, ajustar calidad, etc.     */
import sharp from 'sharp'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                              CONSTANTES                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Configuración de procesamiento de imágenes
 * ────────────────────────────────────────────
 *
 * Estas constantes definen los parámetros de procesamiento.
 * Puedes ajustarlas según las necesidades del proyecto.
 */
const IMAGE_CONFIG = {
  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                    TAMAÑOS DE IMAGEN                                     */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Ancho máximo para imagen completa (en píxeles)                          */
  MAX_WIDTH: 1200,

  /** Alto máximo para imagen completa (en píxeles)                           */
  MAX_HEIGHT: 1200,

  /** Ancho del thumbnail (en píxeles)                                        */
  THUMBNAIL_WIDTH: 300,

  /** Alto del thumbnail (en píxeles)                                         */
  THUMBNAIL_HEIGHT: 300,

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                    CALIDAD Y FORMATO                                     */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Calidad del WebP (1-100). 80 es buen balance calidad/tamaño             */
  QUALITY: 80,

  /** Tipo MIME del formato de salida                                         */
  OUTPUT_FORMAT: 'image/webp' as const,
} as const

/* ─────────────────────────────────────────────────────────────────────────── */
/*                              INTERFACES                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Resultado del procesamiento de una imagen
 * ───────────────────────────────────────────
 *
 * Contiene ambas versiones de la imagen procesada:
 * - full: Imagen completa (para página de detalle)
 * - thumbnail: Imagen pequeña (para listados)
 */
export interface ProcessedImage {
  /** Buffer de la imagen completa en WebP                                    */
  full: Buffer

  /** Buffer del thumbnail en WebP                                            */
  thumbnail: Buffer

  /** Tipo MIME del formato ('image/webp')                                    */
  contentType: string
}

/**
 * Metadata de una imagen procesada
 * ──────────────────────────────────
 *
 * Información útil sobre la imagen para logging o validación.
 */
export interface ImageMetadata {
  /** Ancho original de la imagen (antes de procesar)                         */
  originalWidth: number

  /** Alto original de la imagen (antes de procesar)                          */
  originalHeight: number

  /** Tamaño original en bytes                                                */
  originalSize: number

  /** Tamaño procesado en bytes (full)                                        */
  processedSize: number

  /** Porcentaje de reducción de tamaño                                       */
  compressionRatio: number
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                    FUNCIONES DE PROCESAMIENTO                                */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Procesa una imagen: redimensiona y convierte a WebP
 * ─────────────────────────────────────────────────────
 *
 * @param   {Buffer} input      - Buffer de la imagen original
 * @returns {Promise<ProcessedImage>} - Imagen procesada en ambos tamaños
 *
 * EJEMPLO DE USO:
 *   const file = await request.formData()
 *   const imageFile = file.get('image') as File
 *   const buffer = Buffer.from(await imageFile.arrayBuffer())
 *
 *   const processed = await processImage(buffer)
 *   // processed.full      -> Imagen 1200x1200 max
 *   // processed.thumbnail -> Imagen 300x300
 *
 * FLUJO:
 *   1. Crear pipeline de Sharp con la imagen original
 *   2. Procesar imagen completa (resize + webp)
 *   3. Procesar thumbnail (resize + webp)
 *   4. Retornar ambas versiones
 *
 * NOTA TÉCNICA:
 *   - 'fit: inside' mantiene el aspect ratio dentro del tamaño máximo
 *   - 'fit: cover' recorta la imagen para llenar el tamaño exacto
 *   - 'withoutEnlargement' evita agrandar imágenes pequeñas
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  /* ─────────────────────────────────────────────────────────────────────── */
  /*                   CREAR PIPELINE DE SHARP                                */
  /* ─────────────────────────────────────────────────────────────────────── */

  /* Sharp crea un pipeline de procesamiento que es muy eficiente              */
  /* porque no carga toda la imagen en memoria                                 */
  const sharpInstance = sharp(input)

  /* ─────────────────────────────────────────────────────────────────────── */
  /*                   PROCESAR IMAGEN COMPLETA                               */
  /* ─────────────────────────────────────────────────────────────────────── */

  /* Crear una copia del pipeline para la imagen full                          */
  /* - resize: Ajusta al tamaño máximo manteniendo proporción                  */
  /* - withoutEnlargement: No agranda imágenes pequeñas                        */
  /* - webp: Convierte a formato WebP con la calidad especificada              */
  /* - toBuffer: Convierte el resultado a Buffer                               */
  const fullImage = await sharpInstance
    .clone() /* Clonar para no afectar original */
    .resize(IMAGE_CONFIG.MAX_WIDTH, IMAGE_CONFIG.MAX_HEIGHT, {
      fit: 'inside' /* Mantener dentro del tamaño max  */,
      withoutEnlargement: true /* No agrandar imágenes pequeñas   */,
    })
    .webp({ quality: IMAGE_CONFIG.QUALITY }) /* Convertir a WebP             */
    .toBuffer() /* Obtener Buffer                  */

  /* ─────────────────────────────────────────────────────────────────────── */
  /*                      PROCESAR THUMBNAIL                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

  /* El thumbnail usa 'cover' para llenar exactamente el cuadrado              */
  /* Esto recorta la imagen para que siempre tenga el tamaño exacto            */
  const thumbnailImage = await sharpInstance
    .clone() /* Clonar para no afectar original */
    .resize(IMAGE_CONFIG.THUMBNAIL_WIDTH, IMAGE_CONFIG.THUMBNAIL_HEIGHT, {
      fit: 'cover' /* Recortar para llenar el tamaño  */,
      position: 'center' /* Centrar el recorte              */,
    })
    .webp({ quality: IMAGE_CONFIG.QUALITY }) /* Convertir a WebP             */
    .toBuffer() /* Obtener Buffer                  */

  /* ─────────────────────────────────────────────────────────────────────── */
  /*                       RETORNAR RESULTADO                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  return {
    full: fullImage /* Imagen completa         */,
    thumbnail: thumbnailImage /* Thumbnail               */,
    contentType: IMAGE_CONFIG.OUTPUT_FORMAT /* Tipo MIME               */,
  }
}

/**
 * Genera una clave única para almacenar una imagen
 * ──────────────────────────────────────────────────
 *
 * @param   {string} folder  - Carpeta base (ej: 'products', 'stores')
 * @param   {string} id      - ID del recurso (ej: ID del producto)
 * @param   {string} variant - Variante de la imagen (ej: 'full', 'thumbnail')
 * @returns {string}         - Clave única para R2
 *
 * EJEMPLO:
 *   const key = generateImageKey('products', '123', 'full')
 *   // Resultado: 'products/123/full-1699876543-abc12.webp'
 *
 * El formato incluye:
 *   - folder: Organiza por tipo de recurso
 *   - id: Agrupa imágenes del mismo recurso
 *   - variant: Distingue entre full y thumbnail
 *   - timestamp: Evita cache de CDN al actualizar
 *   - random: Evita colisiones si se sube muy rápido
 */
export function generateImageKey(
  folder: string /* Carpeta base (products, stores, avatars)              */,
  id: string /* ID del recurso propietario                            */,
  variant: string /* Variante: 'full' o 'thumbnail'                        */
): string {
  /* ─────────────────────────────────────────────────────────────────────── */
  /*                   GENERAR COMPONENTES ÚNICOS                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  /* Timestamp en segundos (Unix epoch)                                        */
  /* Esto evita que el CDN cache versiones antiguas                            */
  const timestamp = Math.floor(Date.now() / 1000)

  /* String aleatorio de 5 caracteres                                          */
  /* Evita colisiones si se suben múltiples imágenes en el mismo segundo       */
  const random = Math.random().toString(36).substring(2, 7)

  /* ─────────────────────────────────────────────────────────────────────── */
  /*                     CONSTRUIR CLAVE COMPLETA                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  /* Formato: folder/id/variant-timestamp-random.webp                          */
  /* Ejemplo: products/abc123/full-1699876543-x7k2p.webp                        */
  return `${folder}/${id}/${variant}-${timestamp}-${random}.webp`
}

/**
 * Valida que un archivo sea una imagen válida
 * ─────────────────────────────────────────────
 *
 * @param   {Buffer} input - Buffer del archivo a validar
 * @returns {Promise<boolean>} - true si es una imagen válida
 *
 * Esta función verifica que:
 *   1. El archivo se puede procesar con Sharp
 *   2. El formato es soportado (JPEG, PNG, WebP, GIF, etc.)
 *   3. Las dimensiones son válidas
 */
export async function isValidImage(input: Buffer): Promise<boolean> {
  try {
    /* Intentar obtener metadata de la imagen                                */
    /* Si falla, no es una imagen válida                                     */
    const metadata = await sharp(input).metadata()

    /* Verificar que tiene formato y dimensiones                             */
    return !!(metadata.format && metadata.width && metadata.height)
  } catch {
    /* Si Sharp no puede procesarla, no es una imagen válida                 */
    return false
  }
}

/**
 * Obtiene metadata de una imagen
 * ────────────────────────────────
 *
 * @param   {Buffer} input - Buffer de la imagen
 * @returns {Promise<ImageMetadata>} - Metadata de la imagen
 *
 * Útil para logging y validación antes de procesar.
 */
export async function getImageMetadata(input: Buffer): Promise<ImageMetadata> {
  /* Obtener metadata de Sharp                                                 */
  const metadata = await sharp(input).metadata()

  /* Procesar la imagen para obtener el tamaño final                           */
  const processed = await processImage(input)

  /* Calcular ratio de compresión                                              */
  /* (1 - nuevo/original) * 100 = porcentaje de reducción                      */
  const ratio = (1 - processed.full.length / input.length) * 100

  return {
    originalWidth: metadata.width ?? 0 /* Ancho original              */,
    originalHeight: metadata.height ?? 0 /* Alto original               */,
    originalSize: input.length /* Tamaño en bytes             */,
    processedSize: processed.full.length /* Tamaño procesado            */,
    compressionRatio: Math.round(ratio) /* % de reducción              */,
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FIN DEL ARCHIVO                                   */
/*                                                                              */
/*   FORMATOS SOPORTADOS POR SHARP:                                             */
/*   - JPEG / JPG                                                               */
/*   - PNG (con transparencia)                                                  */
/*   - WebP (nuestro formato de salida)                                         */
/*   - AVIF (muy moderno, excelente compresión)                                 */
/*   - GIF (solo el primer frame si es animado)                                 */
/*   - TIFF                                                                     */
/*   - SVG (rasteriza a bitmap)                                                 */
/*   - HEIF / HEIC (formato de iPhone)                                          */
/*                                                                              */
/*   OPTIMIZACIÓN FUTURA:                                                       */
/*   - Agregar soporte para AVIF (mejor compresión que WebP)                    */
/*   - Implementar lazy loading con imágenes blur                               */
/*   - Agregar más tamaños para responsive images                               */
/*   - Implementar procesamiento en cola para muchas imágenes                   */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
