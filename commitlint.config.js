/**
 * ============================================
 * CONFIGURACIÓN DE COMMITLINT
 * ============================================
 * 
 * 🛡️ PROPÓSITO:
 * Fuerza que los mensajes de commit sigan el
 * estándar de Conventional Commits para:
 * 
 * - Generar changelogs automáticamente
 * - Versionado semántico automático
 * - Historial de cambios legible
 * 
 * 📝 FORMATO:
 * <tipo>(<alcance>): <descripción>
 * 
 * Ejemplo: feat(auth): agregar login con Google
 * 
 * ============================================
 */

export default {
    /** Usar configuración de conventional commits */
    extends: ['@commitlint/config-conventional'],

    /** Reglas personalizadas */
    rules: {
        /** Tipos de commit permitidos */
        'type-enum': [
            2,
            'always',
            [
                'feat',      // Nueva funcionalidad
                'fix',       // Corrección de bug
                'docs',      // Documentación
                'style',     // Formato (no afecta código)
                'refactor',  // Refactorización
                'test',      // Tests
                'chore',     // Mantenimiento
                'perf',      // Mejora de rendimiento
                'ci',        // Integración continua
                'build',     // Sistema de build
                'revert',    // Revertir cambio
                'wip',       // Trabajo en progreso
            ],
        ],

        /** Tipos siempre en minúsculas */
        'type-case': [2, 'always', 'lower-case'],

        /** Descripción no puede estar vacía */
        'subject-empty': [2, 'never'],

        /** Alcance siempre en minúsculas */
        'scope-case': [2, 'always', 'lower-case'],

        /** Longitud máxima del header */
        'header-max-length': [2, 'always', 100],
    },
}
