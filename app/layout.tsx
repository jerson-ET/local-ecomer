import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import FloatingCommunityButton from '@/components/layout/FloatingCommunityButton'
import CookieBanner from '@/components/layout/CookieBanner'
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker'
import SplashScreen from '@/components/layout/SplashScreen'
import './globals.css'

const inter = { variable: 'font-sans' }

export const metadata: Metadata = {
  title: 'LocalEcomer — Crea tu Tienda Online Gratis | Vende Productos y Gana Dinero en Colombia',
  description: 'Crea tu catálogo digital gratis por 21 días. Vende productos online, gana dinero desde casa y emprende tu negocio. Tienda virtual fácil, rápida y sin intermediarios. Marketplace colombiano con envíos a todo el país. $34.000 COP/mes después del periodo de prueba.',
  manifest: '/manifest.json',
  keywords: [
    'tienda online', 'tiendas online colombia', 'crear tienda virtual',
    'ganar dinero', 'ganar dinero en linea', 'ganar dinero desde casa',
    'productos', 'vender productos online', 'marketplace colombia',
    'emprender negocio', 'catálogo digital', 'tienda gratis',
    'vender por internet', 'negocio online', 'dropshipping colombia',
    'ecommerce colombia', 'plataforma de ventas', 'ingresos extra',
    'trabajo desde casa', 'venta de productos', 'tienda virtual gratis',
  ],
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LocalEcomer',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'LocalEcomer',
    title: 'LocalEcomer — Crea tu Tienda Online y Gana Dinero',
    description: 'Marketplace colombiano. Crea tu catálogo digital, vende productos y gana dinero desde tu celular. 21 días gratis, después $34.000 COP/mes.',
    url: 'https://localecomer.store',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalEcomer — Vende Productos Online en Colombia',
    description: 'Crea tu tienda virtual gratis. Emprende, vende y gana dinero desde casa. Sin intermediarios.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://localecomer.store',
  },
  formatDetection: { telephone: false },
  verification: {
    google: 'Oo1Plwbw_nwVSxFUPsOohExkdmXyzbJa6iw-FQwzqmg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es-CO"
      className={`${inter.variable} antialiased selection:bg-rose-500/30`}
      suppressHydrationWarning
    >
      <head>
        <meta name="google-site-verification" content="Oo1Plwbw_nwVSxFUPsOohExkdmXyzbJa6iw-FQwzqmg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>

      {/* 
        El background se maneja en 'globals.css'.
        Quitamos componentes antiguos para esta refactorización Apple / Google.
      */}
      <body className="min-h-[100dvh] w-full bg-black overflow-x-hidden" suppressHydrationWarning>
        <SplashScreen />
        {/* Renderizado de toda la App PWA Principal */}
        <div id="app-root" className="min-h-[100dvh] w-full relative z-0">
          {children}
        </div>

        {/* Floating elements overlaying everything properly */}
        <div className="fixed z-50 pointer-events-none w-full h-full left-0 top-0">
          <FloatingCommunityButton />
          <CookieBanner />
          <AnalyticsTracker />
        </div>

        {/* Instalar SW para mantener la magia del PWA */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                        .catch(function(error) { console.log('SW error:', error); });
                });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
