/**
 * ============================================
 * CONFIGURACIÓN DE VITEST
 * ============================================
 *
 * 🛡️ PROPÓSITO:
 * Configuración del framework de testing para:
 *
 * - Tests unitarios de funciones y hooks
 * - Tests de integración de componentes
 * - Tests de APIs
 * - Cobertura de código
 *
 * 🏗️ CARACTERÍSTICAS:
 * - Compatible con React Testing Library
 * - Soporte para TypeScript
 * - Alias de imports (@/)
 * - Mocks automáticos
 *
 * ============================================
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  test: {
    /* ==========================================
     * CONFIGURACIÓN DEL ENTORNO
     * ========================================== */

    /** Entorno de pruebas (jsdom para React) */
    environment: 'jsdom',

    /** Archivo de setup que se ejecuta antes de cada test */
    setupFiles: ['./tests/setup.ts'],

    /** Patrones para encontrar archivos de test */
    include: [
      'tests/**/*.{test,spec}.{ts,tsx}',
      'lib/**/*.{test,spec}.{ts,tsx}',
      'components/**/*.{test,spec}.{ts,tsx}',
      'app/**/*.{test,spec}.{ts,tsx}',
    ],

    /** Patrones para excluir */
    exclude: ['node_modules', '.next', 'dist', 'coverage'],

    /* ==========================================
     * CONFIGURACIÓN DE COBERTURA
     * ========================================== */

    coverage: {
      /** Provider de cobertura */
      provider: 'v8',

      /** Reportadores de cobertura */
      reporter: ['text', 'html', 'lcov', 'json'],

      /** Directorio de salida */
      reportsDirectory: './coverage',

      /** Archivos a incluir en la cobertura */
      include: ['lib/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}'],

      /** Archivos a excluir de la cobertura */
      exclude: [
        'node_modules',
        'tests',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/index.ts',
      ],

      /** Umbrales mínimos de cobertura */
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    /* ==========================================
     * CONFIGURACIÓN GLOBAL
     * ========================================== */

    /** APIs globales disponibles (describe, it, expect) */
    globals: true,

    /** Timeout para cada test (ms) */
    testTimeout: 10000,

    /** Timeout para hooks (beforeEach, etc) */
    hookTimeout: 10000,

    /** Mostrar todos los tests, no solo los fallidos */
    reporters: ['verbose'],

    /** Deshabilitar watch mode en CI */
    watch: false,
  },

  /* ==========================================
   * RESOLUCIÓN DE PATHS
   * ========================================== */

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/stores': path.resolve(__dirname, './stores'),
      '@/types': path.resolve(__dirname, './lib/types'),
    },
  },
})
