/* ═══════════════════════════════════════════════════════════════════════════ */
/*  API: SUBIDA DE IMÁGENES A CLOUDFLARE R2 — REESCRITO DESDE CERO           */
/*                                                                              */
/*  POST /api/upload/images                                                    */
/*                                                                              */
/*  Recibe imágenes vía FormData, las convierte a WebP optimizado,            */
/*  las sube a Cloudflare R2 y retorna las URLs públicas.                     */
/*                                                                              */
/*  CAMPOS DEL FORMDATA:                                                       */
/*    images     — Archivos de imagen (campo repetido, hasta 10)              */
/*    folder     — Carpeta destino: 'products' | 'banners' (default: products)*/
/*    resourceId — ID del recurso (ej: ID de la tienda o producto)            */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2/client'
import { optimizeToWebP, generateImageKey, isValidImage } from '@/lib/images/processor'

/* ─── Constantes ─── */
const MAX_FILES = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024 /* 10 MB */

const ACCEPTED_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/avif', 'image/gif', 'image/tiff', 'image/bmp',
  'image/heif', 'image/heic', 'image/svg+xml',
])

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST HANDLER                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    /* ─── 1. Parsear FormData ─── */
    const formData = await request.formData()
    const folder = (formData.get('folder') as string) || 'products'
    const resourceId = (formData.get('resourceId') as string) || `res-${Date.now()}`
    const isBanner = folder === 'banners'

    console.log(`[UPLOAD] ══════════════════════════════════════`)
    console.log(`[UPLOAD] Iniciando subida → folder: ${folder}, resource: ${resourceId}`)

    /* ─── 2. Extraer archivos ─── */
    const files: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key === 'images' && value instanceof File) {
        files.push(value)
      }
    }

    console.log(`[UPLOAD] Archivos recibidos: ${files.length}`)

    /* ─── 3. Validaciones ─── */
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se recibieron imágenes', code: 'NO_FILES' },
        { status: 400 }
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `Máximo ${MAX_FILES} imágenes por subida`, code: 'TOO_MANY_FILES' },
        { status: 400 }
      )
    }

    /* Validar cada archivo */
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `"${file.name}" excede 10 MB`, code: 'FILE_TOO_LARGE' },
          { status: 400 }
        )
      }
      if (!ACCEPTED_TYPES.has(file.type.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: `"${file.name}" no es un formato soportado`, code: 'INVALID_FORMAT' },
          { status: 400 }
        )
      }
    }

    /* ─── 4. Procesar y subir cada imagen ─── */
    const results = await Promise.all(
      files.map(async (file, index) => {
        console.log(`[UPLOAD] Procesando [${index + 1}/${files.length}]: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`)

        /* Convertir File a Buffer */
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        /* Validar que es una imagen real */
        const valid = await isValidImage(buffer)
        if (!valid) {
          throw new Error(`"${file.name}" no es una imagen válida`)
        }

        /* Convertir a WebP optimizado */
        const { full, thumbnail } = await optimizeToWebP(buffer, isBanner)

        /* Generar claves únicas para R2 */
        const fullKey = generateImageKey(folder, resourceId, `full-${index}`)
        const thumbKey = generateImageKey(folder, resourceId, `thumb-${index}`)

        /* Subir ambas versiones a R2 en paralelo */
        const [fullUrl, thumbnailUrl] = await Promise.all([
          uploadToR2(full, fullKey, 'image/webp'),
          uploadToR2(thumbnail, thumbKey, 'image/webp'),
        ])

        console.log(`[UPLOAD] ✅ [${index + 1}/${files.length}] Subido: ${fullUrl}`)

        return {
          fullUrl,
          thumbnailUrl,
          fullSize: full.length,
          thumbnailSize: thumbnail.length,
          originalName: file.name,
          contentType: 'image/webp' as const,
        }
      })
    )

    console.log(`[UPLOAD] ══════════════════════════════════════`)
    console.log(`[UPLOAD] ✅ ÉXITO: ${results.length} imágenes subidas a R2`)

    /* ─── 5. Respuesta exitosa ─── */
    return NextResponse.json({
      success: true,
      count: results.length,
      images: results,
      summary: {
        totalFullSize: results.reduce((s, r) => s + r.fullSize, 0),
        totalThumbSize: results.reduce((s, r) => s + r.thumbnailSize, 0),
        format: 'webp',
        avgFullSize: Math.round(results.reduce((s, r) => s + r.fullSize, 0) / results.length),
      },
    })
  } catch (error: unknown) {
    console.error('[UPLOAD] ❌ Error fatal:', error)

    /* Intentar extraer detalles útiles del error */
    let message = 'Error desconocido al procesar imágenes'
    let details = ''

    if (error instanceof Error) {
      message = error.message
    }

    /* Errores del SDK de AWS/R2 */
    if (typeof error === 'object' && error !== null && '$metadata' in error) {
      const awsErr = error as { $metadata?: { httpStatusCode?: number }; code?: string; name?: string }
      details = `R2 status: ${awsErr.$metadata?.httpStatusCode}, code: ${awsErr.code || awsErr.name}`
      console.error('[UPLOAD] Detalles R2:', details)
    }

    return NextResponse.json(
      { success: false, error: message, code: 'PROCESSING_ERROR', details },
      { status: 500 }
    )
  }
}
