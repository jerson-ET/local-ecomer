import type { NextConfig } from 'next'
import withPWAInit from '@ducanh2912/next-pwa'

/**
 * ============================================
 * CONFIGURACIÓN DE NEXT.JS
 * ============================================
 *
 * Este archivo configura Next.js con:
 * - PWA (Progressive Web App) para instalación en móviles
 * - Optimización de imágenes
 * - Configuración de dominios externos
 *
 * ============================================
 */

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  workboxOptions: {
    disableDevLogs: true,
  },
})

const nextConfig: NextConfig = {
  /**
   * Configuración de imágenes
   * --------------------------
   * Permite cargar imágenes desde dominios externos
   * como Cloudflare R2 y Supabase Storage
   */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  /**
   * Headers de seguridad
   * ---------------------
   * Añade headers para mejorar la seguridad
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:;",
          },
        ],
      },
    ]
  },

  /**
   * Configuración experimental
   * ---------------------------
   * Características experimentales de Next.js
   */
  experimental: {
    // Optimizaciones de servidor
  },

  // Suprimir error the turbopack en default setup
  turbopack: {},

  typescript: {
    ignoreBuildErrors: true,
  },
}

export default withPWA(nextConfig)
