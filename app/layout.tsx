import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import FloatingCommunityButton from '@/components/layout/FloatingCommunityButton'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'LocalEcomer',
  description: 'Desliza y Gana - Dropshipping Hecho Fácil',
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
    statusBarStyle: 'black-translucent',
    title: 'LocalEcomer',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-CO" className={`${inter.variable} antialiased selection:bg-rose-500/30`} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      
      {/* 
        El background se maneja en 'globals.css'.
        Quitamos componentes antiguos para esta refactorización Apple / Google.
      */}
      <body className="min-h-[100dvh] w-full bg-black">
        
        {/* Renderizado de toda la App PWA Principal */}
        <div id="app-root" className="min-h-[100dvh] w-full relative z-0">
          {children}
        </div>
        
        {/* Floating elements overlaying everything properly */}
        <div className="fixed z-50 pointer-events-none w-full h-full left-0 top-0">
            <FloatingCommunityButton />
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
