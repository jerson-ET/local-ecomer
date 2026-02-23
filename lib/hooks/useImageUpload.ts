/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                    HOOK: SUBIDA Y PROCESAMIENTO DE IMÁGENES                  */
/*                                                                              */
/*   Propósito     : Hook React para subir imágenes desde el celular,          */
/*                   procesarlas en el servidor (→ WebP 100-150 KB)             */
/*                   y obtener las URLs públicas de R2                          */
/*   Archivo       : lib/hooks/useImageUpload.ts                               */
/*                                                                              */
/*   USO:                                                                       */
/*     const { uploadImages, uploading, progress, error } = useImageUpload()   */
/*     const results = await uploadImages(files, 'products', 'prod-123')       */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client'

import { useState, useCallback } from 'react'


/* ─────────────────────────────────────────────────────────────────────────── */
/*                              INTERFACES                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Resultado de una imagen subida y procesada                                  */
export interface UploadedImage {
    fullUrl: string
    thumbnailUrl: string
    fullSize: number
    thumbnailSize: number
    originalName: string
    contentType: 'image/webp'
}

/** Estado del progreso de subida                                               */
export interface UploadProgress {
    /** Total de archivos a subir                                               */
    total: number
    /** Archivos procesados hasta ahora                                         */
    completed: number
    /** Porcentaje de progreso (0-100)                                          */
    percent: number
    /** Estado actual                                                           */
    status: 'idle' | 'uploading' | 'processing' | 'done' | 'error'
    /** Mensaje para mostrar al usuario                                        */
    message: string
}

/** Resultado de la API de subida                                               */
interface UploadApiResponse {
    success: boolean
    count: number
    images: UploadedImage[]
    summary: {
        totalFullSize: number
        totalThumbSize: number
        format: string
        avgFullSize: number
    }
    error?: string
    code?: string
}

/** Opciones de configuración                                                   */
interface UseImageUploadOptions {
    /** Máximo de archivos permitidos (default: 10)                             */
    maxFiles?: number
    /** Tamaño máximo por archivo en bytes (default: 10 MB)                    */
    maxFileSize?: number
    /** Callback cuando se sube una imagen exitosamente                         */
    onSuccess?: (images: UploadedImage[]) => void
    /** Callback cuando ocurre un error                                         */
    onError?: (error: string) => void
}


/* ─────────────────────────────────────────────────────────────────────────── */
/*                              CONSTANTES                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

const DEFAULT_MAX_FILES = 10
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 /* 10 MB */


/* ─────────────────────────────────────────────────────────────────────────── */
/*                              HOOK PRINCIPAL                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export function useImageUpload(options: UseImageUploadOptions = {}) {
    const {
        maxFiles = DEFAULT_MAX_FILES,
        maxFileSize = DEFAULT_MAX_FILE_SIZE,
        onSuccess,
        onError,
    } = options

    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState<UploadProgress>({
        total: 0,
        completed: 0,
        percent: 0,
        status: 'idle',
        message: '',
    })
    const [error, setError] = useState<string | null>(null)
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])


    /* ─────────────────────────────────────────────────────────────────────── */
    /*                    VALIDAR ARCHIVOS ANTES DE SUBIR                       */
    /* ─────────────────────────────────────────────────────────────────────── */

    const validateFiles = useCallback((files: File[]): string | null => {
        if (files.length === 0) {
            return 'No se seleccionaron archivos'
        }

        if (files.length > maxFiles) {
            return `Máximo ${maxFiles} imágenes por subida`
        }

        for (const file of files) {
            /* Verificar que sea una imagen */
            if (!file.type.startsWith('image/')) {
                return `"${file.name}" no es una imagen válida`
            }

            /* Verificar tamaño */
            if (file.size > maxFileSize) {
                const maxMB = Math.round(maxFileSize / (1024 * 1024))
                return `"${file.name}" excede el tamaño máximo de ${maxMB} MB`
            }
        }

        return null /* Válido */
    }, [maxFiles, maxFileSize])


    /* ─────────────────────────────────────────────────────────────────────── */
    /*                    SUBIR IMÁGENES AL SERVIDOR                            */
    /* ─────────────────────────────────────────────────────────────────────── */

    /**
     * Sube un array de File al servidor para procesamiento y almacenamiento
     * 
     * @param files     - Array de File seleccionados desde el input
     * @param folder    - Carpeta destino (ej: 'products', 'stores')
     * @param resourceId - ID del recurso asociado (ej: ID del producto)
     * @returns Array de imágenes subidas con URLs públicas
     */
    const uploadImages = useCallback(async (
        files: File[],
        folder: string = 'products',
        resourceId?: string
    ): Promise<UploadedImage[]> => {
        /* ─── Validar antes de subir ─── */
        const validationError = validateFiles(files)
        if (validationError) {
            setError(validationError)
            onError?.(validationError)
            return []
        }

        /* ─── Iniciar estado de subida ─── */
        setUploading(true)
        setError(null)
        setProgress({
            total: files.length,
            completed: 0,
            percent: 0,
            status: 'uploading',
            message: `Preparando ${files.length} imagen${files.length > 1 ? 'es' : ''}...`,
        })

        try {
            /* ─── Crear FormData con todas las imágenes ─── */
            const formData = new FormData()
            formData.append('folder', folder)
            if (resourceId) {
                formData.append('resourceId', resourceId)
            }

            for (const file of files) {
                formData.append('images', file)
            }

            /* ─── Actualizar progreso: procesando ─── */
            setProgress((prev) => ({
                ...prev,
                status: 'processing',
                message: `Convirtiendo ${files.length} imagen${files.length > 1 ? 'es' : ''} a WebP...`,
                percent: 30,
            }))

            /* ─── Simulación de progreso mientras el servidor trabaja ─── */
            /* La subida real no reporta progreso intermedio, así que        */
            /* incrementamos suavemente de 30% → 90% con un intervalo.       */
            let currentPercent = 30
            const progressInterval = setInterval(() => {
                currentPercent = Math.min(currentPercent + 2, 90)
                const message = currentPercent < 60
                    ? `Convirtiendo ${files.length} imagen${files.length > 1 ? 'es' : ''} a WebP...`
                    : `Subiendo a la nube...`
                setProgress((prev) => ({
                    ...prev,
                    percent: currentPercent,
                    message,
                }))
            }, 600)

            /* ─── Enviar a la API ─── */
            const response = await fetch('/api/upload/images', {
                method: 'POST',
                body: formData,
            })

            /* Detener el intervalo cuando el servidor responde */
            clearInterval(progressInterval)

            const data: UploadApiResponse = await response.json()

            if (!response.ok || !data.success) {
                const errorMsg = data.error || 'Error al subir imágenes'
                setError(errorMsg)
                onError?.(errorMsg)
                setProgress((prev) => ({
                    ...prev,
                    status: 'error',
                    message: errorMsg,
                    percent: 0,
                }))
                return []
            }

            /* ─── Subida exitosa ─── */
            setUploadedImages((prev) => [...prev, ...data.images])
            setProgress({
                total: data.count,
                completed: data.count,
                percent: 100,
                status: 'done',
                message: `✅ ${data.count} imagen${data.count > 1 ? 'es' : ''} procesada${data.count > 1 ? 's' : ''} (WebP, ~${Math.round(data.summary.avgFullSize / 1024)} KB promedio)`,
            })

            onSuccess?.(data.images)
            return data.images

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error de conexión al subir imágenes'
            setError(errorMsg)
            onError?.(errorMsg)
            setProgress((prev) => ({
                ...prev,
                status: 'error',
                message: errorMsg,
                percent: 0,
            }))
            return []

        } finally {
            setUploading(false)
        }

    }, [validateFiles, onError, onSuccess])


    /* ─────────────────────────────────────────────────────────────────────── */
    /*                    SUBIR UNA SOLA IMAGEN                                 */
    /* ─────────────────────────────────────────────────────────────────────── */

    const uploadSingleImage = useCallback(async (
        file: File,
        folder: string = 'products',
        resourceId?: string
    ): Promise<UploadedImage | null> => {
        const results = await uploadImages([file], folder, resourceId)
        return results[0] || null
    }, [uploadImages])


    /* ─────────────────────────────────────────────────────────────────────── */
    /*                    RESETEAR ESTADO                                       */
    /* ─────────────────────────────────────────────────────────────────────── */

    const reset = useCallback(() => {
        setUploading(false)
        setError(null)
        setUploadedImages([])
        setProgress({
            total: 0,
            completed: 0,
            percent: 0,
            status: 'idle',
            message: '',
        })
    }, [])


    /* ─────────────────────────────────────────────────────────────────────── */
    /*                    RETORNAR HOOK                                         */
    /* ─────────────────────────────────────────────────────────────────────── */

    return {
        /** Subir múltiples imágenes (hasta 10) */
        uploadImages,

        /** Subir una sola imagen */
        uploadSingleImage,

        /** Si está subiendo ahora mismo */
        uploading,

        /** Progreso detallado de la subida */
        progress,

        /** Último error (null si no hay) */
        error,

        /** Lista de imágenes ya subidas */
        uploadedImages,

        /** Resetear todo el estado */
        reset,
    }
}
