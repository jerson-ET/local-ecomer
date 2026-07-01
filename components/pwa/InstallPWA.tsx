'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface InstallPWAProps {
  variant?: 'icon' | 'button'
  className?: string
}

// Variable global para persistir el evento entre navegaciones de Next.js
let savedPrompt: any = null

export default function InstallPWA({ variant = 'icon', className = "" }: InstallPWAProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(savedPrompt)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isVisible, setIsVisible] = useState(!!savedPrompt)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Si estamos en /messenger y tenemos el parámetro install, intentamos disparar el prompt
    if (pathname === '/messenger' && searchParams.get('install') === 'true' && deferredPrompt) {
      // Pequeño delay para asegurar que la UI cargó
      const timer = setTimeout(() => {
        deferredPrompt.prompt()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [deferredPrompt, pathname, searchParams])

  useEffect(() => {
    // Si ya tenemos un prompt guardado globalmente, lo usamos
    if (savedPrompt && !deferredPrompt) {
      setDeferredPrompt(savedPrompt)
      setIsVisible(true)
    }

    // Verificar si ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      savedPrompt = e
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setIsVisible(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    // Si el usuario quiere descargar Chati desde la Home, lo llevamos a la ruta correcta
    // para que el navegador use el manifest.chati.json
    if (variant === 'button' && pathname !== '/messenger') {
      router.push('/messenger?install=true')
      return
    }

    if (!deferredPrompt) {
      alert('Para instalar Chati:\n\n1. Haz clic en el menú del navegador (los tres puntos o el icono de compartir).\n2. Selecciona "Instalar aplicación" o "Añadir a la pantalla de inicio".')
      return
    }
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setIsVisible(false)
  }

  // Si ya está instalada, no mostramos nada
  if (isInstalled) return null

  // Mostramos el botón siempre para que el usuario pueda intentar la instalación
  // o ver las instrucciones manuales si el navegador no soporta el prompt automático.
  if (variant === 'button') {
    return (
      <button
        onClick={handleInstallClick}
        className={`px-10 py-5 bg-[#25D366] text-white font-black rounded-2xl text-lg border-none hover:bg-[#128C7E] transition-all active:scale-95 shadow-xl shadow-green-500/20 ${className}`}
      >
        Descargar Chati
      </button>
    )
  }

  return (
    <button
      onClick={handleInstallClick}
      className={`flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white w-9 h-9 rounded-md shadow-lg shadow-indigo-500/20 transition-all active:scale-95 group ${className}`}
      title="Instalar Chati"
    >
      <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
    </button>
  )
}
