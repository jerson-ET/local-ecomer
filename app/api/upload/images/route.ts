/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                    API: SUBIDA MASIVA DE IMÁGENES                            */
/*                                                                              */
/*   Propósito     : Recibir hasta 10 imágenes, convertirlas a WebP,           */
/*                   optimizarlas (100-150 KB) y subirlas a Cloudflare R2       */
/*   Ruta          : POST /api/upload/images                                    */
/*   Archivo       : app/api/upload/images/route.ts                            */
/*                                                                              */
/*   FLUJO:                                                                     */
/*   1. Recibir imágenes vía FormData (hasta 10 archivos)                      */
/*   2. Validar que sean imágenes válidas                                       */
/*   3. Procesar cada imagen con Sharp → WebP                                  */
/*   4. Ajustar calidad para que pese entre 100-150 KB                         */
/*   5. Subir full + thumbnail a Cloudflare R2                                 */
/*   6. Retornar URLs públicas de todas las imágenes                           */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { uploadToR2 } from '@/lib/r2/client'
import { generateImageKey, isValidImage } from '@/lib/images/processor'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                              CONSTANTES                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Máximo de imágenes que se pueden subir a la vez                             */
const MAX_FILES = 10

/** Tamaño máximo por archivo sin procesar (10 MB)                              */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/** Rango objetivo de peso final en bytes                                       */
const TARGET_MIN_SIZE = 100 * 1024 /* 100 KB */
const TARGET_MAX_SIZE = 150 * 1024 /* 150 KB */

/** Dimensiones máximas para imagen completa                                    */
const FULL_MAX_WIDTH = 1200
const FULL_MAX_HEIGHT = 1200

/** Dimensiones del thumbnail                                                   */
const THUMB_WIDTH = 300
const THUMB_HEIGHT = 300

/** Formatos de imagen aceptados por Sharp                                      */
const ACCEPTED_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/tiff',
  'image/heif',
  'image/heic',
  'image/svg+xml',
  'image/bmp',
]

/* ─────────────────────────────────────────────────────────────────────────── */
/*                    FUNCIÓN DE OPTIMIZACIÓN INTELIGENTE                       */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Procesa una imagen ajustando la calidad para que pese entre 100-150 KB
 * ───────────────────────────────────────────────────────────────────────
 *
 * ALGORITMO:
 *   1. Intentar con calidad 80%
 *   2. Si pesa más de 150 KB, bajar calidad gradualmente
 *   3. Si pesa menos de 100 KB, subir calidad gradualmente
 *   4. Máximo 5 iteraciones para encontrar el balance
 *   5. Si no se logra el rango exacto, usar el resultado más cercano
 */
async function optimizeImage(input: Buffer): Promise<{ full: Buffer; thumbnail: Buffer }> {
  /* ─── Paso 1: Crear instancia de Sharp ─── */
  const sharpBase = sharp(input)
  const metadata = await sharpBase.metadata()

  /* ─── Paso 2: Calcular dimensiones finales (mantener aspect ratio) ─── */
  let targetWidth = metadata.width || FULL_MAX_WIDTH
  let targetHeight = metadata.height || FULL_MAX_HEIGHT

  if (targetWidth > FULL_MAX_WIDTH || targetHeight > FULL_MAX_HEIGHT) {
    const ratio = Math.min(FULL_MAX_WIDTH / targetWidth, FULL_MAX_HEIGHT / targetHeight)
    targetWidth = Math.round(targetWidth * ratio)
    targetHeight = Math.round(targetHeight * ratio)
  }

  /* ─── Paso 3: Buscar calidad óptima con búsqueda binaria ─── */
  let minQuality = 20
  let maxQuality = 95
  let bestBuffer: Buffer | null = null
  let bestQuality = 80
  const MAX_ITERATIONS = 7

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const quality = Math.round((minQuality + maxQuality) / 2)

    const result = await sharp(input)
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer()

    bestBuffer = result
    bestQuality = quality
    const size = result.length

    /* Ya está en rango: perfecto */
    if (size >= TARGET_MIN_SIZE && size <= TARGET_MAX_SIZE) {
      break
    }

    /* Muy grande: bajar calidad */
    if (size > TARGET_MAX_SIZE) {
      maxQuality = quality - 1
    } else {
      /* Muy pequeño: subir calidad */
      minQuality = quality + 1
    }

    /* Si los límites se cruzaron, ya encontramos lo más cercano */
    if (minQuality > maxQuality) {
      break
    }
  }

  /* Si la imagen original es muy pequeña y no se puede llegar a 100KB      */
  /* ni con calidad 95, usarla tal cual (mejor calidad posible)              */
  if (!bestBuffer) {
    bestBuffer = await sharp(input)
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: bestQuality })
      .toBuffer()
  }

  /* ─── Paso 4: Crear thumbnail (siempre calidad 80, ~15-30 KB) ─── */
  const thumbnail = await sharp(input)
    .resize(THUMB_WIDTH, THUMB_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 80 })
    .toBuffer()

  return { full: bestBuffer, thumbnail }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                              HANDLER POST                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    /* ─── 1. Verificar autenticación ─── */
    /* En producción, verificar sesión de Supabase aquí                    */
    /* Por ahora, permitir subidas para desarrollo                         */

    /* ─── 2. Obtener FormData ─── */
    const formData = await request.formData()

    /* ─── 3. Extraer campos ─── */
    const folder = (formData.get('folder') as string) || 'products'
    const resourceId = (formData.get('resourceId') as string) || `temp-${Date.now()}`

    /* ─── 4. Extraer archivos de imagen ─── */
    const files: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key === 'images' && value instanceof File) {
        files.push(value)
      }
    }

    /* ─── 5. Validaciones ─── */
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No se recibieron imágenes', code: 'NO_FILES' },
        { status: 400 }
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_FILES} imágenes por subida`, code: 'TOO_MANY_FILES' },
        { status: 400 }
      )
    }

    /* ─── 6. Validar cada archivo ─── */
    for (const file of files) {
      /* Validar tamaño */
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `El archivo "${file.name}" excede el tamaño máximo de 10 MB`,
            code: 'FILE_TOO_LARGE',
          },
          { status: 400 }
        )
      }

      /* Validar tipo MIME */
      if (!ACCEPTED_FORMATS.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          {
            error: `El archivo "${file.name}" no es un formato de imagen soportado. Formatos permitidos: JPG, PNG, WebP, AVIF, GIF, TIFF, HEIF, HEIC, SVG, BMP`,
            code: 'INVALID_FORMAT',
          },
          { status: 400 }
        )
      }
    }

    /* ─── 7. Procesar todas las imágenes en paralelo ─── */
    const uploadPromises = files.map(async (file, index) => {
      /* Convertir File a Buffer */
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      /* Validar que es una imagen real (no archivo renombrado) */
      const isValid = await isValidImage(buffer)
      if (!isValid) {
        throw new Error(`El archivo "${file.name}" no es una imagen válida`)
      }

      /* Optimizar imagen (Sharp → WebP, 100-150 KB) */
      const { full, thumbnail } = await optimizeImage(buffer)

      /* Generar claves únicas para R2 */
      const fullKey = generateImageKey(folder, resourceId, `full-${index}`)
      const thumbKey = generateImageKey(folder, resourceId, `thumb-${index}`)

      /* Subir ambas versiones a R2 en paralelo */
      const [fullUrl, thumbnailUrl] = await Promise.all([
        uploadToR2(full, fullKey, 'image/webp'),
        uploadToR2(thumbnail, thumbKey, 'image/webp'),
      ])

      return {
        fullUrl,
        thumbnailUrl,
        fullSize: full.length,
        thumbnailSize: thumbnail.length,
        originalName: file.name,
        contentType: 'image/webp' as const,
      }
    })

    /* Ejecutar todas las subidas en paralelo */
    const results = await Promise.all(uploadPromises)

    /* ─── 8. Retornar resultado exitoso ─── */
    return NextResponse.json({
      success: true,
      count: results.length,
      images: results,
      summary: {
        totalFullSize: results.reduce((acc, r) => acc + r.fullSize, 0),
        totalThumbSize: results.reduce((acc, r) => acc + r.thumbnailSize, 0),
        format: 'webp',
        avgFullSize: Math.round(results.reduce((acc, r) => acc + r.fullSize, 0) / results.length),
      },
    })
  } catch (error) {
    console.error('[UPLOAD] Error procesando imágenes:', error)

    const message =
      error instanceof Error ? error.message : 'Error desconocido al procesar imágenes'

    return NextResponse.json({ error: message, code: 'PROCESSING_ERROR' }, { status: 500 })
  }
}
