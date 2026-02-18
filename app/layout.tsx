/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                    LAYOUT PRINCIPAL - LOCAL ECOMER PWA                       */
/*                                                                              */
/*   Aplicación Web Progresiva (PWA) mobile-only.                              */
/*   Incluye: Metadatos SEO, PWA tags, Service Worker, fuentes.                */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────── */
/*                             IMPORTACIONES                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'

import GlobalNav from '@/components/layout/GlobalNav'
import '@/components/layout/global-nav.css'
import './globals.css'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                         CONFIGURACIÓN DE FUENTE                              */
/* ─────────────────────────────────────────────────────────────────────────── */

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

/* ─────────────────────────────────────────────────────────────────────────── */
/*                            METADATOS SEO + PWA                               */
/* ─────────────────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: {
    default: 'LocalEcomer - Marketplace de Tiendas Locales',
    template: '%s | LocalEcomer',
  },
  description:
    'El marketplace de tiendas locales colombianas. ' +
    'Encuentra productos con descuento, conecta con vendedores ' +
    'y compra directamente desde tu celular.',
  keywords: [
    'marketplace',
    'tienda online',
    'ecommerce',
    'colombia',
    'productos colombianos',
    'comprar online',
    'vender online',
    'local ecomer',
    'app marketplace',
  ],
  authors: [{ name: 'LocalEcomer' }],
  creator: 'LocalEcomer',
  publisher: 'LocalEcomer',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'LocalEcomer',
    title: 'LocalEcomer - Marketplace de Tiendas Locales',
    description: 'El marketplace de tiendas locales colombianas.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalEcomer',
    description: 'El marketplace de tiendas locales colombianas.',
  },

  /* PWA */
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LocalEcomer',
  },
  formatDetection: {
    telephone: true,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                            VIEWPORT (MOBILE)                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1 /* Previene zoom en inputs móviles              */,
  userScalable: false /* Comportamiento tipo app nativa               */,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#ffffff' },
  ],
  viewportFit: 'cover' /* Soporte para pantallas con notch             */,
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                        COMPONENTE PRINCIPAL                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-CO" className={inter.variable}>
      <head>
        {/* PWA Meta Tags adicionales */}
        <meta name="application-name" content="LocalEcomer" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LocalEcomer" />
        <meta name="msapplication-TileColor" content="#f43f5e" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Splash screens para iOS */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
      </head>
      <body>
        <GlobalNav />
        {children}

        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
                        if ('serviceWorker' in navigator) {
                            window.addEventListener('load', function() {
                                navigator.serviceWorker.register('/sw.js')
                                    .then(function(registration) {
                                        console.log('SW registrado:', registration.scope);
                                    })
                                    .catch(function(error) {
                                        console.log('SW error:', error);
                                    });
                            });
                        }
                    `}
        </Script>
      </body>
    </html>
  )
}
