/**
 * ============================================
 * BARREL EXPORT - LIB
 * ============================================
 * 
 * Punto único de exportación para toda la
 * librería de utilidades.
 * 
 * Nota: Los tipos de database.ts y schemas.ts
 * tienen solapamiento intencional. Importar
 * desde el módulo específico si hay conflictos.
 * 
 * Uso:
 * import { logger, AppError } from '@/lib'
 * import { LoginSchema } from '@/lib/validations'
 * import type { Product } from '@/lib/types'
 * 
 * ============================================
 */

/* Exportar sistema de errores */
export * from './errors'

/* Exportar sistema de logging */
export * from './logger'

/* 
 * Nota: validations y types tienen tipos solapados.
 * Importar directamente del módulo necesario:
 * - Schemas de Zod: import from '@/lib/validations'
 * - Tipos de DB: import from '@/lib/types'
 */
