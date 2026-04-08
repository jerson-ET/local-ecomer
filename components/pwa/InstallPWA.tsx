'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Verificar si ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevenir el comportamiento por defecto de Chrome
      e.preventDefault()
      // Guardar el evento para dispararlo después
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Detectar si ya se instaló
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
    if (!deferredPrompt) return

    // Mostrar el prompt nativo
    deferredPrompt.prompt()

    // Esperar a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to install prompt: ${outcome}`)

    // El evento ya no se puede usar más
    setDeferredPrompt(null)
    setIsVisible(false)
  }

  if (isInstalled || !isVisible) return null

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-rose-200 transition-all active:scale-95 group"
      title="Instalar Aplicación"
    >
      <div className="bg-white/20 p-1 rounded-lg">
        <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
      </div>
      <span className="font-black text-xs uppercase tracking-tighter">Instalar App</span>
    </button>
  )
}
