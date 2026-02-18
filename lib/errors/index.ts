/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                     SISTEMA DE MANEJO DE ERRORES                             */
/*                                                                              */
/*   Propósito     : Centralizar TODOS los errores de la aplicación             */
/*   Uso           : Toda la aplicación lanza estos errores                     */
/*   Archivo       : lib/errors/index.ts                                        */
/*                                                                              */
/*   BENEFICIOS DE ESTE SISTEMA:                                                */
/*   1. Errores CONSISTENTES - Mismo formato siempre                            */
/*   2. Errores RASTREABLES - Códigos únicos para cada tipo                     */
/*   3. Errores SEGUROS - No exponen información sensible                       */
/*   4. Errores ÚTILES - Mensajes claros para el usuario                        */
/*                                                                              */
/*   CÓMO USAR:                                                                 */
/*   throw new ValidationError('Email inválido', { field: 'email' })            */
/*   throw new NotFoundError('Usuario')                                         */
/*   throw new AuthError('Credenciales inválidas')                              */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────────────────────────────── */
/*                         CÓDIGOS DE ERROR                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Códigos únicos para cada tipo de error
 * ────────────────────────────────────────
 * 
 * Cada código tiene el formato: CATEGORIA_NUMERO
 * 
 * Categorías:
 *   AUTH - Errores de autenticación
 *   VAL  - Errores de validación
 *   DB   - Errores de base de datos
 *   STR  - Errores de almacenamiento
 *   BIZ  - Errores de lógica de negocio
 *   NET  - Errores de red
 *   INT  - Errores internos del sistema
 */
export const ERROR_CODES = {

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                    ERRORES DE AUTENTICACIÓN                              */
    /* ═══════════════════════════════════════════════════════════════════════ */

    AUTH_INVALID_CREDENTIALS: 'AUTH_001', /* Usuario o contraseña incorrectos   */
    AUTH_EMAIL_NOT_VERIFIED: 'AUTH_002', /* Email no ha sido verificado        */
    AUTH_TOKEN_EXPIRED: 'AUTH_003', /* Token de sesión expirado           */
    AUTH_TOKEN_INVALID: 'AUTH_004', /* Token de sesión inválido           */
    AUTH_UNAUTHORIZED: 'AUTH_005', /* No está autenticado                */
    AUTH_FORBIDDEN: 'AUTH_006', /* No tiene permisos suficientes      */

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                    ERRORES DE VALIDACIÓN                                 */
    /* ═══════════════════════════════════════════════════════════════════════ */

    VALIDATION_FAILED: 'VAL_001',  /* Datos no pasaron validación        */
    VALIDATION_MISSING_FIELD: 'VAL_002',  /* Campo requerido no enviado         */
    VALIDATION_INVALID_FORMAT: 'VAL_003',  /* Formato de dato incorrecto         */

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                    ERRORES DE BASE DE DATOS                              */
    /* ═══════════════════════════════════════════════════════════════════════ */

    DB_CONNECTION_FAILED: 'DB_001',   /* No se pudo conectar a la BD        */
    DB_QUERY_FAILED: 'DB_002',   /* La consulta SQL falló              */
    DB_NOT_FOUND: 'DB_003',   /* Registro no encontrado             */
    DB_DUPLICATE_ENTRY: 'DB_004',   /* Ya existe un registro igual        */
    DB_CONSTRAINT_VIOLATION: 'DB_005',   /* Violación de restricción           */

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                    ERRORES DE ALMACENAMIENTO                             */
    /* ═══════════════════════════════════════════════════════════════════════ */

    STORAGE_UPLOAD_FAILED: 'STR_001',  /* Falló la subida del archivo        */
    STORAGE_DELETE_FAILED: 'STR_002',  /* Falló eliminar el archivo          */
    STORAGE_FILE_TOO_LARGE: 'STR_003',  /* Archivo excede tamaño máximo       */
    STORAGE_INVALID_TYPE: 'STR_004',  /* Tipo de archivo no permitido       */

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                    ERRORES DE NEGOCIO                                    */
    /* ═══════════════════════════════════════════════════════════════════════ */

    STORE_LIMIT_REACHED: 'BIZ_001',  /* Límite de tiendas alcanzado        */
    PRODUCT_LIMIT_REACHED: 'BIZ_002',  /* Límite de productos alcanzado      */
    INSUFFICIENT_BALANCE: 'BIZ_003',  /* Saldo insuficiente en wallet       */
    PROMOTION_BUDGET_EXCEEDED: 'BIZ_004',  /* Presupuesto de promoción agotado   */

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                    ERRORES DE RED                                        */
    /* ═══════════════════════════════════════════════════════════════════════ */

    NETWORK_ERROR: 'NET_001',  /* Error de conexión de red           */
    EXTERNAL_SERVICE_ERROR: 'NET_002',  /* Servicio externo falló             */
    RATE_LIMIT_EXCEEDED: 'NET_003',  /* Demasiadas peticiones              */

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                    ERRORES INTERNOS                                      */
    /* ═══════════════════════════════════════════════════════════════════════ */

    INTERNAL_ERROR: 'INT_001',  /* Error interno del servidor         */
    NOT_IMPLEMENTED: 'INT_002',  /* Funcionalidad no implementada      */
    MAINTENANCE_MODE: 'INT_003',  /* Sistema en mantenimiento           */

} as const /* El 'as const' hace que los valores sean inmutables                */

/* Tipo que representa cualquier código de error válido                          */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]


/* ─────────────────────────────────────────────────────────────────────────── */
/*                       CLASE BASE DE ERROR                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * AppError - Clase base para todos los errores de la aplicación
 * ──────────────────────────────────────────────────────────────
 * 
 * Todos los errores personalizados extienden de esta clase.
 * Proporciona una estructura consistente para manejar errores.
 * 
 * @extends Error - Extiende la clase Error nativa de JavaScript
 */
export class AppError extends Error {

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                        PROPIEDADES DE LA CLASE                           */
    /* ═══════════════════════════════════════════════════════════════════════ */

    /** Código único del error (ej: 'AUTH_001')                                 */
    public readonly code: ErrorCode

    /** Código HTTP para la respuesta (ej: 400, 401, 404, 500)                  */
    public readonly statusCode: number

    /** Si es un error operacional (esperado) o de programación (bug)           */
    /* true = error esperado (credenciales inválidas)                           */
    /* false = error inesperado (bug, falla del sistema)                        */
    public readonly isOperational: boolean

    /** Detalles adicionales del error (campos inválidos, etc.)                 */
    public readonly details: Record<string, unknown> | undefined

    /** Momento exacto en que ocurrió el error                                  */
    public readonly timestamp: Date

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                            CONSTRUCTOR                                   */
    /* ═══════════════════════════════════════════════════════════════════════ */

    /**
     * Crea una nueva instancia de AppError
     * 
     * @param message       - Mensaje de error legible para el usuario
     * @param code          - Código único del error (ERROR_CODES.*)
     * @param statusCode    - Código HTTP (default: 500)
     * @param isOperational - Si es un error esperado (default: true)
     * @param details       - Información adicional del error
     */
    constructor(
        message: string,                           /* Mensaje de error    */
        code: ErrorCode,                        /* Código único        */
        statusCode: number = 500,                     /* HTTP status         */
        isOperational: boolean = true,                   /* Es operacional?     */
        details?: Record<string, unknown>           /* Detalles extra      */
    ) {
        /* Llamar al constructor de la clase padre (Error)                       */
        super(message)

        /* Establecer el nombre de la clase para el stack trace                  */
        this.name = this.constructor.name

        /* Asignar todas las propiedades                                         */
        this.code = code           /* Código del error                  */
        this.statusCode = statusCode     /* Código HTTP                       */
        this.isOperational = isOperational  /* Es esperado?                      */
        this.details = details        /* Detalles adicionales              */
        this.timestamp = new Date()     /* Momento del error                 */

        /* Capturar el stack trace para debugging                                */
        Error.captureStackTrace(this, this.constructor)
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                          MÉTODO: TO JSON                                 */
    /* ═══════════════════════════════════════════════════════════════════════ */

    /**
     * Serializa el error para enviar al cliente
     * ─────────────────────────────────────────
     * 
     * IMPORTANTE: Este método NUNCA expone información sensible
     * como el stack trace o datos internos del sistema.
     * 
     * @returns {Object} - Error serializado para JSON
     */
    public toJSON() {
        return {
            success: false,                              /* Siempre false       */
            error: {
                code: this.code,                    /* Código del error    */
                message: this.message,                 /* Mensaje visible     */
                timestamp: this.timestamp.toISOString(),/* Cuándo ocurrió      */
                /* Solo incluir detalles si existen                              */
                ...(this.details && { details: this.details }),
            },
        }
    }
}


/* ─────────────────────────────────────────────────────────────────────────── */
/*                       ERRORES ESPECÍFICOS                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * AuthError - Error de Autenticación
 * ───────────────────────────────────
 * 
 * Se lanza cuando hay problemas con la autenticación:
 * - Credenciales inválidas
 * - Token expirado
 * - Usuario no autenticado
 * 
 * EJEMPLO:
 *   throw new AuthError('Credenciales inválidas')
 *   throw new AuthError('Token expirado', ERROR_CODES.AUTH_TOKEN_EXPIRED)
 */
export class AuthError extends AppError {
    constructor(
        message: string,                                 /* Mensaje de error    */
        code: ErrorCode = ERROR_CODES.AUTH_UNAUTHORIZED, /* Código default   */
        details?: Record<string, unknown>                /* Detalles extra      */
    ) {
        /* HTTP 401 = No autorizado                                              */
        super(message, code, 401, true, details)
    }
}

/**
 * ForbiddenError - Error de Autorización
 * ────────────────────────────────────────
 * 
 * Se lanza cuando el usuario no tiene permisos para una acción:
 * - Intentar editar producto de otro vendedor
 * - Acceder a panel de admin sin ser admin
 * 
 * EJEMPLO:
 *   throw new ForbiddenError()
 *   throw new ForbiddenError('Solo administradores pueden hacer esto')
 */
export class ForbiddenError extends AppError {
    constructor(
        message: string = 'No tienes permisos para realizar esta acción',
        details?: Record<string, unknown>                /* Detalles extra      */
    ) {
        /* HTTP 403 = Prohibido                                                  */
        super(message, ERROR_CODES.AUTH_FORBIDDEN, 403, true, details)
    }
}

/**
 * ValidationError - Error de Validación
 * ───────────────────────────────────────
 * 
 * Se lanza cuando los datos enviados no son válidos:
 * - Email con formato incorrecto
 * - Campos requeridos vacíos
 * - Valores fuera de rango
 * 
 * EJEMPLO:
 *   throw new ValidationError('Email inválido', { field: 'email' })
 */
export class ValidationError extends AppError {
    constructor(
        message: string,                                /* Mensaje de error    */
        details?: Record<string, unknown>                /* Campos inválidos    */
    ) {
        /* HTTP 400 = Petición incorrecta                                        */
        super(message, ERROR_CODES.VALIDATION_FAILED, 400, true, details)
    }
}

/**
 * NotFoundError - Error de Recurso No Encontrado
 * ────────────────────────────────────────────────
 * 
 * Se lanza cuando no se encuentra un recurso:
 * - Usuario no existe
 * - Producto no encontrado
 * - Tienda no encontrada
 * 
 * EJEMPLO:
 *   throw new NotFoundError('Usuario')
 *   throw new NotFoundError('Producto', { id: '123' })
 */
export class NotFoundError extends AppError {
    constructor(
        resource: string = 'Recurso',                    /* Nombre del recurso  */
        details?: Record<string, unknown>                /* ID o filtros usados */
    ) {
        /* HTTP 404 = No encontrado                                              */
        super(`${resource} no encontrado`, ERROR_CODES.DB_NOT_FOUND, 404, true, details)
    }
}

/**
 * DuplicateError - Error de Duplicado
 * ─────────────────────────────────────
 * 
 * Se lanza cuando ya existe un registro con ese identificador:
 * - Email ya registrado
 * - Slug de tienda ya existe
 * 
 * EJEMPLO:
 *   throw new DuplicateError('email')
 *   throw new DuplicateError('slug', { value: 'mi-tienda' })
 */
export class DuplicateError extends AppError {
    constructor(
        field: string,                                 /* Campo duplicado     */
        details?: Record<string, unknown>                /* Valor duplicado     */
    ) {
        /* HTTP 409 = Conflicto                                                  */
        super(
            `Ya existe un registro con ese ${field}`,
            ERROR_CODES.DB_DUPLICATE_ENTRY,
            409,
            true,
            details
        )
    }
}

/**
 * RateLimitError - Error de Límite de Peticiones
 * ────────────────────────────────────────────────
 * 
 * Se lanza cuando el usuario hace demasiadas peticiones:
 * - Muchos intentos de login
 * - Muchas peticiones a la API
 * 
 * EJEMPLO:
 *   throw new RateLimitError(60) // Reintentar en 60 segundos
 */
export class RateLimitError extends AppError {
    constructor(
        retryAfter?: number,                             /* Segundos para retry */
        details?: Record<string, unknown>             /* Detalles extra      */
    ) {
        /* HTTP 429 = Demasiadas peticiones                                      */
        super(
            'Has excedido el límite de solicitudes. Intenta de nuevo más tarde.',
            ERROR_CODES.RATE_LIMIT_EXCEEDED,
            429,
            true,
            { ...details, retryAfter }
        )
    }
}

/**
 * StorageError - Error de Almacenamiento
 * ────────────────────────────────────────
 * 
 * Se lanza cuando hay problemas con archivos:
 * - Fallo al subir imagen
 * - Archivo muy grande
 * - Tipo de archivo no permitido
 * 
 * EJEMPLO:
 *   throw new StorageError('El archivo es muy grande', ERROR_CODES.STORAGE_FILE_TOO_LARGE)
 */
export class StorageError extends AppError {
    constructor(
        message: string,                                 /* Mensaje de error    */
        code: ErrorCode = ERROR_CODES.STORAGE_UPLOAD_FAILED, /* Código       */
        details?: Record<string, unknown>                /* Detalles extra      */
    ) {
        /* HTTP 500 = Error del servidor                                         */
        super(message, code, 500, true, details)
    }
}

/**
 * BusinessError - Error de Lógica de Negocio
 * ────────────────────────────────────────────
 * 
 * Se lanza cuando se viola una regla de negocio:
 * - Límite de productos alcanzado
 * - Saldo insuficiente
 * - Plan no permite esta acción
 * 
 * EJEMPLO:
 *   throw new BusinessError('Has alcanzado el límite de productos', ERROR_CODES.PRODUCT_LIMIT_REACHED)
 */
export class BusinessError extends AppError {
    constructor(
        message: string,                                 /* Mensaje de error    */
        code: ErrorCode = ERROR_CODES.STORE_LIMIT_REACHED, /* Código         */
        details?: Record<string, unknown>                /* Detalles extra      */
    ) {
        /* HTTP 422 = Entidad no procesable                                      */
        super(message, code, 422, true, details)
    }
}

/**
 * InternalError - Error Interno del Sistema
 * ───────────────────────────────────────────
 * 
 * Se lanza para errores inesperados del servidor:
 * - Bugs de programación
 * - Fallos de servicios externos
 * - Errores desconocidos
 * 
 * IMPORTANTE: isOperational = false porque NO es esperado
 * 
 * EJEMPLO:
 *   throw new InternalError()
 *   throw new InternalError('Error al procesar imagen')
 */
export class InternalError extends AppError {
    constructor(
        message: string = 'Ha ocurrido un error interno. Nuestro equipo ha sido notificado.',
        details?: Record<string, unknown>                /* Detalles para logs  */
    ) {
        /* HTTP 500 = Error del servidor                                         */
        /* isOperational = false porque es un error inesperado                   */
        super(message, ERROR_CODES.INTERNAL_ERROR, 500, false, details)
    }
}


/* ─────────────────────────────────────────────────────────────────────────── */
/*                       FUNCIONES UTILITARIAS                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Verifica si un error es un AppError
 * ─────────────────────────────────────
 * 
 * @param   {unknown} error - Cualquier error
 * @returns {boolean}       - true si es un AppError
 * 
 * EJEMPLO:
 *   if (isAppError(error)) {
 *     console.log(error.code)
 *   }
 */
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError
}

/**
 * Convierte cualquier error a un AppError
 * ─────────────────────────────────────────
 * 
 * Útil para normalizar errores de librerías externas.
 * 
 * @param   {unknown} error - Cualquier error
 * @returns {AppError}      - Error normalizado
 * 
 * EJEMPLO:
 *   try {
 *     await someExternalLib()
 *   } catch (error) {
 *     throw toAppError(error)
 *   }
 */
export function toAppError(error: unknown): AppError {

    /* Si ya es un AppError, retornarlo sin cambios                              */
    if (isAppError(error)) {
        return error
    }

    /* Si es un Error estándar de JavaScript                                     */
    if (error instanceof Error) {
        /* En desarrollo, mostrar el mensaje real para debugging                 */
        /* En producción, ocultar detalles por seguridad                         */
        const message = process.env.NODE_ENV === 'development'
            ? error.message
            : 'Ha ocurrido un error inesperado'

        return new InternalError(message, { originalError: error.name })
    }

    /* Si es algo completamente desconocido                                      */
    return new InternalError('Error desconocido')
}

/**
 * Formatea errores de validación de Zod
 * ───────────────────────────────────────
 * 
 * Convierte el array de errores de Zod a un objeto más manejable.
 * 
 * @param   {Array} errors - Array de errores de Zod
 * @returns {Object}       - Objeto con campo -> mensaje
 * 
 * EJEMPLO:
 *   const formatted = formatZodErrors(result.error.issues)
 *   // { email: 'Email inválido', password: 'Muy corta' }
 */
export function formatZodErrors(
    errors: { path: (string | number)[]; message: string }[]
): Record<string, string> {

    /* Objeto donde guardaremos los errores formateados                          */
    const formatted: Record<string, string> = {}

    /* Iterar sobre cada error de Zod                                            */
    for (const error of errors) {

        /* Convertir el path array a string (ej: ['user', 'email'] -> 'user.email') */
        const path = error.path.join('.')

        /* Solo guardar el primer error de cada campo                            */
        if (!formatted[path]) {
            formatted[path] = error.message
        }
    }

    /* Retornar el objeto de errores                                             */
    return formatted
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FIN DEL ARCHIVO                                   */
/*                                                                              */
/*   TABLA DE REFERENCIA RÁPIDA:                                                */
/*   ┌──────────────────┬──────────┬────────────────────────────────────────┐  */
/*   │ Clase            │ HTTP     │ Cuándo usar                            │  */
/*   ├──────────────────┼──────────┼────────────────────────────────────────┤  */
/*   │ AuthError        │ 401      │ Usuario no autenticado                 │  */
/*   │ ForbiddenError   │ 403      │ Sin permisos para esta acción          │  */
/*   │ ValidationError  │ 400      │ Datos enviados son inválidos           │  */
/*   │ NotFoundError    │ 404      │ Recurso no existe                      │  */
/*   │ DuplicateError   │ 409      │ Ya existe un registro igual            │  */
/*   │ RateLimitError   │ 429      │ Muchas peticiones                      │  */
/*   │ StorageError     │ 500      │ Problemas con archivos                 │  */
/*   │ BusinessError    │ 422      │ Regla de negocio violada               │  */
/*   │ InternalError    │ 500      │ Error inesperado (bug)                 │  */
/*   └──────────────────┴──────────┴────────────────────────────────────────┘  */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
