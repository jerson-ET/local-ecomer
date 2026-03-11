/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                     SISTEMA DE LOGGING ESTRUCTURADO                          */
/*                                                                              */
/*   Propósito     : Registrar TODOS los eventos importantes del sistema        */
/*   Uso           : Toda la aplicación usa este logger                         */
/*   Archivo       : lib/logger/index.ts                                        */
/*                                                                              */
/*   BENEFICIOS:                                                                */
/*   1. VISIBILIDAD - Ver qué pasa en la aplicación en todo momento             */
/*   2. DEBUGGING   - Encontrar y solucionar errores rápidamente                */
/*   3. AUDITORÍA   - Registrar acciones importantes para seguridad             */
/*   4. MONITOREO   - Integrar con servicios como DataDog, Sentry               */
/*                                                                              */
/*   NIVELES DE LOG:                                                            */
/*   - DEBUG  : Información detallada para desarrolladores                      */
/*   - INFO   : Eventos normales de la aplicación                               */
/*   - WARN   : Advertencias que no son errores pero requieren atención         */
/*   - ERROR  : Errores que afectan funcionalidad                               */
/*   - FATAL  : Errores críticos que pueden tumbar la aplicación                */
/*                                                                              */
/*   CÓMO USAR:                                                                 */
/*   import { logger } from '@/lib/logger'                                      */
/*   logger.info('Usuario logueado', { userId: '123' })                         */
/*   logger.error('Error al guardar producto', error)                           */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────── */
/*                         TIPOS Y CONSTANTES                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Niveles de severidad del log
 * ─────────────────────────────
 *
 * Cada nivel tiene un número que indica su severidad.
 * Solo se muestran logs con severidad >= al nivel configurado.
 *
 * Ejemplo: Si el nivel es WARN (2), no se muestran DEBUG (0) ni INFO (1)
 */
export enum LogLevel {
  DEBUG = 0 /* Información muy detallada - solo para debugging              */,
  INFO = 1 /* Eventos normales - usuario logueó, producto creado           */,
  WARN = 2 /* Advertencias - algo raro pero no crítico                     */,
  ERROR = 3 /* Errores - algo falló pero la app sigue funcionando           */,
  FATAL = 4 /* Errores fatales - la aplicación podría caerse                */,
}

/**
 * Contexto opcional para añadir información al log
 * ─────────────────────────────────────────────────
 *
 * Permite agregar datos estructurados a cada log.
 * Estos datos aparecen en el JSON en producción.
 */
export interface LogContext {
  /* ID del usuario que realiza la acción                                      */
  userId?: string

  /* ID de la petición HTTP (para rastrear toda una petición)                  */
  requestId?: string

  /* Nombre del servicio o módulo que genera el log                            */
  service?: string

  /* Cualquier dato adicional relevante                                        */
  [key: string]: unknown
}

/**
 * Estructura de una entrada de log
 * ─────────────────────────────────
 *
 * Cada log tiene esta estructura interna.
 * En producción, esto se serializa a JSON.
 */
interface LogEntry {
  level: LogLevel /* Nivel de severidad                             */
  message: string /* Mensaje descriptivo                            */
  timestamp: string /* Fecha/hora en formato ISO                      */
  context?: LogContext /* Datos adicionales                              */
  error?: ErrorInfo /* Información del error (si aplica)              */
}

/**
 * Información del error para logs
 * ─────────────────────────────────
 *
 * Cuando se loguea un error, se extrae esta información.
 */
interface ErrorInfo {
  name: string /* Nombre del error (TypeError, AuthError, etc)  */
  message: string /* Mensaje del error                             */
  stack?: string /* Stack trace (solo en desarrollo)              */
  code?: string /* Código de error (si es AppError)              */
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                       CONFIGURACIÓN DEL LOGGER                               */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Opciones de configuración del logger
 * ──────────────────────────────────────
 */
interface LoggerOptions {
  /* Nivel mínimo de log a mostrar (logs con menor nivel se ignoran)           */
  minLevel: LogLevel

  /* Si está habilitado el logger (false = no hace nada)                        */
  enabled: boolean

  /* Si se debe mostrar en color (para consola de desarrollo)                   */
  colorOutput: boolean

  /* Si se debe mostrar en formato JSON (para producción)                       */
  jsonOutput: boolean

  /* Nombre del servicio que aparece en los logs                                */
  serviceName: string
}

/**
 * Determina la configuración según el entorno
 * ─────────────────────────────────────────────
 *
 * DESARROLLO: Colores bonitos en consola, nivel DEBUG
 * PRODUCCIÓN: JSON estructurado, nivel INFO
 * TEST: Deshabilitado para no ensuciar la salida
 */
function getDefaultOptions(): LoggerOptions {
  /* Detectar el entorno actual                                                */
  const isDev = process.env.NODE_ENV === 'development'
  const isTest = process.env.NODE_ENV === 'test'

  return {
    /* En desarrollo mostrar todo, en producción solo INFO+                  */
    minLevel: isDev ? LogLevel.DEBUG : LogLevel.INFO,

    /* Deshabilitar en tests para mantener la salida limpia                  */
    enabled: !isTest,

    /* Colores solo en desarrollo (la consola de producción no los soporta)  */
    colorOutput: isDev,

    /* JSON en producción (para herramientas de monitoreo)                   */
    jsonOutput: !isDev,

    /* Nombre de la aplicación para identificar los logs                     */
    serviceName: 'localecomer',
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                          COLORES PARA CONSOLA                                */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Códigos ANSI para colorear la salida de consola
 * ─────────────────────────────────────────────────
 *
 * Estos códigos hacen que el texto aparezca con colores
 * en terminales que soportan ANSI (la mayoría en Linux/Mac)
 */
const COLORS = {
  /* Resetear color al final del texto                                         */
  reset: '\x1b[0m',

  /* Texto en gris (para DEBUG)                                                */
  gray: '\x1b[90m',

  /* Texto en cian/turquesa (para INFO)                                        */
  cyan: '\x1b[36m',

  /* Texto en amarillo (para WARN)                                             */
  yellow: '\x1b[33m',

  /* Texto en rojo (para ERROR)                                                */
  red: '\x1b[31m',

  /* Texto en rojo brillante (para FATAL)                                      */
  magenta: '\x1b[35m',

  /* Texto en negrita                                                          */
  bold: '\x1b[1m',

  /* Texto tenue/apagado                                                       */
  dim: '\x1b[2m',
}

/**
 * Mapeo de nivel de log a color
 * ──────────────────────────────
 */
const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: COLORS.gray,
  [LogLevel.INFO]: COLORS.cyan,
  [LogLevel.WARN]: COLORS.yellow,
  [LogLevel.ERROR]: COLORS.red,
  [LogLevel.FATAL]: COLORS.magenta,
}

/**
 * Mapeo de nivel de log a nombre legible
 * ────────────────────────────────────────
 */
const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO ' /* Espacio para alinear con DEBUG               */,
  [LogLevel.WARN]: 'WARN ',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                          CLASE PRINCIPAL: LOGGER                             */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Logger - Clase principal para logging
 * ───────────────────────────────────────
 *
 * Proporciona métodos para registrar eventos con diferentes niveles.
 * Se configura automáticamente según el entorno.
 */
class Logger {
  /* Opciones de configuración del logger                                      */
  private options: LoggerOptions

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                            CONSTRUCTOR                                   */
  /* ═══════════════════════════════════════════════════════════════════════ */

  constructor(options?: Partial<LoggerOptions>) {
    /* Combinar opciones por defecto con las proporcionadas                  */
    this.options = {
      ...getDefaultOptions(),
      ...options,
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                     MÉTODOS PÚBLICOS DE LOGGING                          */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /**
   * Log de nivel DEBUG
   * ───────────────────
   *
   * Para información muy detallada, útil solo durante desarrollo.
   * No se muestra en producción.
   *
   * @param message - Mensaje descriptivo
   * @param context - Datos adicionales
   *
   * EJEMPLO:
   *   logger.debug('Validando datos de entrada', { data: payload })
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * Log de nivel INFO
   * ──────────────────
   *
   * Para eventos normales de la aplicación.
   * Se muestra en desarrollo y producción.
   *
   * @param message - Mensaje descriptivo
   * @param context - Datos adicionales
   *
   * EJEMPLO:
   *   logger.info('Usuario logueado exitosamente', { userId: '123' })
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Log de nivel WARN
   * ──────────────────
   *
   * Para advertencias que no son errores pero requieren atención.
   *
   * @param message - Mensaje descriptivo
   * @param context - Datos adicionales
   *
   * EJEMPLO:
   *   logger.warn('Rate limit casi alcanzado', { remaining: 5 })
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * Log de nivel ERROR
   * ───────────────────
   *
   * Para errores que afectan funcionalidad pero la app sigue funcionando.
   *
   * @param message - Mensaje descriptivo
   * @param error   - El objeto Error (opcional)
   * @param context - Datos adicionales
   *
   * EJEMPLO:
   *   logger.error('Error al guardar producto', error, { productId: '123' })
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  /**
   * Log de nivel FATAL
   * ───────────────────
   *
   * Para errores críticos que pueden tumbar la aplicación.
   * Requiere atención inmediata.
   *
   * @param message - Mensaje descriptivo
   * @param error   - El objeto Error (opcional)
   * @param context - Datos adicionales
   *
   * EJEMPLO:
   *   logger.fatal('No se pudo conectar a la base de datos', error)
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.FATAL, message, context, error)
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                        MÉTODO CENTRAL DE LOG                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /**
   * Método interno que procesa todos los logs
   * ───────────────────────────────────────────
   *
   * @param level   - Nivel de severidad
   * @param message - Mensaje descriptivo
   * @param context - Datos adicionales
   * @param error   - Error (si aplica)
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    /* ─────────────────────────────────────────────────────────────────── */
    /*                VERIFICAR SI DEBEMOS PROCESAR ESTE LOG                */
    /* ─────────────────────────────────────────────────────────────────── */

    /* Si el logger está deshabilitado, no hacer nada                        */
    if (!this.options.enabled) {
      return
    }

    /* Si el nivel del log es menor al mínimo configurado, ignorar           */
    if (level < this.options.minLevel) {
      return
    }

    /* ─────────────────────────────────────────────────────────────────── */
    /*                    CONSTRUIR ENTRADA DE LOG                          */
    /* ─────────────────────────────────────────────────────────────────── */

    /* Crear objeto con toda la información del log                          */
    const entry: LogEntry = {
      level /* Nivel de severidad  */,
      message /* Mensaje descriptivo */,
      timestamp: new Date().toISOString() /* Fecha/hora ISO      */,
    }

    /* Agregar contexto si se proporcionó                                    */
    if (context) {
      entry.context = {
        ...context,
        service: this.options.serviceName /* Agregar nombre app  */,
      }
    }

    /* Agregar información del error si se proporcionó                       */
    if (error) {
      entry.error = this.formatError(error)
    }

    /* ─────────────────────────────────────────────────────────────────── */
    /*                       ESCRIBIR EL LOG                                */
    /* ─────────────────────────────────────────────────────────────────── */

    /* Elegir el formato según configuración                                 */
    if (this.options.jsonOutput) {
      this.writeJson(entry)
    } else {
      this.writeFormatted(entry)
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                     MÉTODOS DE FORMATEO                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /**
   * Extrae información relevante de un Error
   * ──────────────────────────────────────────
   *
   * @param error - El objeto Error
   * @returns     - Información formateada del error
   */
  private formatError(error: Error): ErrorInfo {
    /* Estructura base del error                                             */
    const errorInfo: ErrorInfo = {
      name: error.name /* Tipo de error        */,
      message: error.message /* Mensaje del error    */,
    }

    /* Incluir stack trace solo en desarrollo (por seguridad)                */
    if (this.options.colorOutput && error.stack) {
      errorInfo.stack = error.stack
    }

    /* Si es un AppError, incluir el código                                  */
    if ('code' in error && typeof error.code === 'string') {
      errorInfo.code = error.code
    }

    return errorInfo
  }

  /**
   * Escribe el log en formato JSON (producción)
   * ─────────────────────────────────────────────
   *
   * Este formato es fácil de parsear por herramientas de monitoreo
   * como DataDog, Splunk, CloudWatch, etc.
   *
   * @param entry - Entrada de log a escribir
   */
  private writeJson(entry: LogEntry): void {
    /* Convertir a JSON de una sola línea                                    */
    const jsonLine = JSON.stringify({
      level: LEVEL_NAMES[entry.level].trim() /* Nombre del nivel    */,
      message: entry.message /* Mensaje             */,
      timestamp: entry.timestamp /* Fecha/hora          */,
      ...entry.context /* Contexto expandido  */,
      ...(entry.error && { error: entry.error }) /* Error si existe     */,
    })

    /* Escribir a la consola apropiada según el nivel                        */
    if (entry.level >= LogLevel.ERROR) {
      console.error(jsonLine) /* stderr para errores */
    } else {
      console.info(jsonLine) /* stdout para el resto*/
    }
  }

  /**
   * Escribe el log con formato bonito (desarrollo)
   * ─────────────────────────────────────────────────
   *
   * Este formato es fácil de leer para humanos en la terminal.
   * Incluye colores y formato visual agradable.
   *
   * @param entry - Entrada de log a escribir
   */
  private writeFormatted(entry: LogEntry): void {
    /* Obtener el color correspondiente al nivel                             */
    const color = LEVEL_COLORS[entry.level]

    /* Obtener el nombre del nivel (DEBUG, INFO, etc)                        */
    const levelName = LEVEL_NAMES[entry.level]

    /* Formatear la hora para mostrar solo HH:MM:SS                          */
    const time = entry.timestamp.split('T')[1]?.split('.')[0] ?? ''

    /* ─────────────────────────────────────────────────────────────────── */
    /*                    CONSTRUIR LÍNEA DE LOG                            */
    /* ─────────────────────────────────────────────────────────────────── */

    /* Formato: [HH:MM:SS] NIVEL Mensaje                                     */
    let output = ''
    output += `${COLORS.dim}[${time}]${COLORS.reset} ` /* Hora en gris       */
    output += `${color}${COLORS.bold}${levelName}${COLORS.reset} ` /* Nivel */
    output += entry.message /* Mensaje principal   */

    /* Agregar contexto si existe (en gris)                                  */
    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = JSON.stringify(entry.context)
      output += ` ${COLORS.dim}${contextStr}${COLORS.reset}`
    }

    /* ─────────────────────────────────────────────────────────────────── */
    /*                       ESCRIBIR A CONSOLA                             */
    /* ─────────────────────────────────────────────────────────────────── */

    /* Elegir la función de consola según el nivel                           */
    if (entry.level >= LogLevel.ERROR) {
      console.error(output)
    } else if (entry.level === LogLevel.WARN) {
      console.warn(output)
    } else {
      console.info(output)
    }

    /* Si hay un error, mostrar el stack trace                               */
    if (entry.error?.stack) {
      console.error(`${COLORS.dim}${entry.error.stack}${COLORS.reset}`)
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                     MÉTODOS UTILITARIOS                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /**
   * Mide el tiempo de ejecución de una función
   * ────────────────────────────────────────────
   *
   * Útil para medir rendimiento de operaciones.
   *
   * @param label     - Etiqueta para identificar la operación
   * @param operation - Función a medir
   * @returns         - Resultado de la función
   *
   * EJEMPLO:
   *   const result = await logger.time('Consulta BD', async () => {
   *     return await db.query(...)
   *   })
   */
  async time<T>(label: string, operation: () => Promise<T>): Promise<T> {
    /* Marcar inicio de la operación                                         */
    const start = performance.now()

    try {
      /* Ejecutar la operación                                             */
      const result = await operation()

      /* Calcular duración en milisegundos                                 */
      const duration = performance.now() - start

      /* Loguear el resultado exitoso con duración                         */
      this.debug(`${label} completado`, { durationMs: duration.toFixed(2) })

      return result
    } catch (error) {
      /* Calcular duración incluso si falló                                */
      const duration = performance.now() - start

      /* Loguear el error con duración                                     */
      this.error(
        `${label} falló después de ${duration.toFixed(2)}ms`,
        error instanceof Error ? error : undefined
      )

      /* Re-lanzar el error para que el código que llama lo maneje         */
      throw error
    }
  }

  /**
   * Crea un logger hijo con contexto predefinido
   * ──────────────────────────────────────────────
   *
   * Útil para módulos o servicios que quieren agregar
   * contexto automático a todos sus logs.
   *
   * @param context - Contexto que se agregará a todos los logs
   * @returns       - Nuevo logger con el contexto
   *
   * EJEMPLO:
   *   const authLogger = logger.child({ service: 'auth' })
   *   authLogger.info('Usuario logueado') // Automáticamente incluye service: 'auth'
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context)
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                          LOGGER HIJO (CHILD)                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * ChildLogger - Logger con contexto predefinido
 * ───────────────────────────────────────────────
 *
 * Hereda de Logger padre pero agrega contexto automático.
 */
class ChildLogger {
  /* Logger padre                                                              */
  private parent: Logger

  /* Contexto que se agrega a todos los logs                                   */
  private context: LogContext

  constructor(parent: Logger, context: LogContext) {
    this.parent = parent
    this.context = context
  }

  /**
   * Combina el contexto predefinido con el contexto adicional
   *
   * @param additional - Contexto adicional a agregar
   * @returns          - Contexto combinado
   */
  private mergeContext(additional?: LogContext): LogContext {
    return {
      ...this.context /* Contexto predefinido del child               */,
      ...additional /* Contexto adicional de esta llamada           */,
    }
  }

  /* Métodos de logging que delegan al padre con contexto combinado            */
  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context))
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context))
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context))
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context))
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.parent.fatal(message, error, this.mergeContext(context))
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                    INSTANCIA GLOBAL DEL LOGGER                               */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Logger principal de la aplicación
 * ───────────────────────────────────
 *
 * Esta es la instancia que se usa en toda la aplicación.
 * Se exporta como singleton para reutilizar la configuración.
 *
 * EJEMPLOS DE USO:
 *
 *   import { logger } from '@/lib/logger'
 *
 *   // Logs básicos
 *   logger.debug('Información de debugging')
 *   logger.info('Usuario creó producto', { productId: '123' })
 *   logger.warn('Rate limit casi alcanzado')
 *   logger.error('Error al guardar', error)
 *   logger.fatal('Base de datos caída', error)
 *
 *   // Medir tiempo de operación
 *   const data = await logger.time('Consulta BD', async () => {
 *     return await supabase.from('productos').select()
 *   })
 *
 *   // Logger con contexto predefinido
 *   const authLogger = logger.child({ service: 'auth' })
 *   authLogger.info('Login exitoso', { userId: '123' })
 */
export const logger = new Logger()

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FIN DEL ARCHIVO                                   */
/*                                                                              */
/*   RESUMEN DE MÉTODOS:                                                        */
/*   ┌───────────────────┬────────────────────────────────────────────────────┐ */
/*   │ Método            │ Descripción                                        │ */
/*   ├───────────────────┼────────────────────────────────────────────────────┤ */
/*   │ logger.debug()    │ Información detallada (solo desarrollo)           │ */
/*   │ logger.info()     │ Eventos normales                                  │ */
/*   │ logger.warn()     │ Advertencias                                      │ */
/*   │ logger.error()    │ Errores (con objeto Error opcional)               │ */
/*   │ logger.fatal()    │ Errores críticos                                  │ */
/*   │ logger.time()     │ Mide duración de una operación                    │ */
/*   │ logger.child()    │ Crea logger con contexto predefinido              │ */
/*   └───────────────────┴────────────────────────────────────────────────────┘ */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
