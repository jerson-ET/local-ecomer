/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HOOK: useImageUpload — REESCRITO DESDE CERO                               */
/*                                                                              */
/*  Hook React para subir imágenes al backend → R2.                           */
/*  Maneja validación, progreso visual y errores de forma limpia.             */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client'

import { useState, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  INTERFACES                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Resultado de una imagen subida */
export interface UploadedImage {
  fullUrl: string
  thumbnailUrl: string
  fullSize: number
  thumbnailSize: number
  originalName: string
  contentType: 'image/webp'
}

/** Estado del progreso */
export interface UploadProgress {
  total: number
  completed: number
  percent: number
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error'
  message: string
}

/** Respuesta de la API */
interface ApiResponse {
  success: boolean
  count: number
  images: UploadedImage[]
  summary: { totalFullSize: number; totalThumbSize: number; format: string; avgFullSize: number }
  error?: string
  code?: string
  details?: string
}

/** Opciones del hook */
interface Options {
  maxFiles?: number
  maxFileSize?: number
  onSuccess?: (images: UploadedImage[]) => void
  onError?: (error: string) => void
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HOOK                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function useImageUpload(options: Options = {}) {
  const {
    maxFiles = 10,
    maxFileSize = 10 * 1024 * 1024,
    onSuccess,
    onError,
  } = options

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress>({
    total: 0, completed: 0, percent: 0, status: 'idle', message: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])

  /* ─── Validar archivos ─── */
  const validate = useCallback((files: File[]): string | null => {
    if (files.length === 0) return 'No se seleccionaron archivos'
    if (files.length > maxFiles) return `Máximo ${maxFiles} imágenes`
    for (const f of files) {
      if (!f.type.startsWith('image/')) return `"${f.name}" no es una imagen`
      if (f.size > maxFileSize) return `"${f.name}" excede ${Math.round(maxFileSize / 1024 / 1024)} MB`
    }
    return null
  }, [maxFiles, maxFileSize])

  /* ─── Subir múltiples imágenes ─── */
  const uploadImages = useCallback(async (
    files: File[],
    folder: string = 'products',
    resourceId?: string
  ): Promise<UploadedImage[]> => {
    /* Validar */
    const err = validate(files)
    if (err) {
      setError(err)
      onError?.(err)
      return []
    }

    setUploading(true)
    setError(null)
    setProgress({
      total: files.length, completed: 0, percent: 0,
      status: 'uploading',
      message: `Preparando ${files.length} imagen${files.length > 1 ? 'es' : ''}...`,
    })

    try {
      /* Crear FormData */
      const formData = new FormData()
      formData.append('folder', folder)
      if (resourceId) formData.append('resourceId', resourceId)
      for (const file of files) {
        formData.append('images', file)
      }

      /* Progreso simulado mientras el servidor procesa */
      let pct = 10
      const interval = setInterval(() => {
        pct = Math.min(pct + 3, 85)
        setProgress(prev => ({
          ...prev,
          percent: pct,
          message: pct < 40
            ? 'Convirtiendo a WebP...'
            : pct < 70
              ? 'Subiendo a la nube...'
              : 'Finalizando...',
        }))
      }, 500)

      /* Enviar al servidor */
      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      })

      clearInterval(interval)

      const data: ApiResponse = await response.json()

      if (!response.ok || !data.success) {
        const errMsg = data.error || 'Error al subir imágenes'
        const fullErr = data.details ? `${errMsg} (${data.details})` : errMsg
        setError(fullErr)
        onError?.(fullErr)
        setProgress(prev => ({ ...prev, status: 'error', message: fullErr, percent: 0 }))
        return []
      }

      /* Éxito */
      setUploadedImages(prev => [...prev, ...data.images])
      setProgress({
        total: data.count,
        completed: data.count,
        percent: 100,
        status: 'done',
        message: `✅ ${data.count} imagen${data.count > 1 ? 'es' : ''} subida${data.count > 1 ? 's' : ''} (WebP, ~${Math.round(data.summary.avgFullSize / 1024)} KB)`,
      })

      onSuccess?.(data.images)
      return data.images
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error de conexión'
      setError(errMsg)
      onError?.(errMsg)
      setProgress(prev => ({ ...prev, status: 'error', message: errMsg, percent: 0 }))
      return []
    } finally {
      setUploading(false)
    }
  }, [validate, onError, onSuccess])

  /* ─── Subir una sola imagen ─── */
  const uploadSingleImage = useCallback(async (
    file: File,
    folder: string = 'products',
    resourceId?: string
  ): Promise<UploadedImage | null> => {
    const results = await uploadImages([file], folder, resourceId)
    return results[0] || null
  }, [uploadImages])

  /* ─── Reset ─── */
  const reset = useCallback(() => {
    setUploading(false)
    setError(null)
    setUploadedImages([])
    setProgress({ total: 0, completed: 0, percent: 0, status: 'idle', message: '' })
  }, [])

  return {
    uploadImages,
    uploadSingleImage,
    uploading,
    progress,
    error,
    uploadedImages,
    reset,
  }
}
