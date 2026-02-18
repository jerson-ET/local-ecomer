import type { NextConfig } from 'next'

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
}

export default nextConfig
