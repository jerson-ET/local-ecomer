import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Chati — Tu Centro de Mensajería',
  description: 'Atiende clientes y cierra ventas en tiempo real.',
  manifest: '/manifest.chati.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Chati',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
}

export default function ChatiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-900 min-h-screen">
      {children}
    </div>
  )
}
