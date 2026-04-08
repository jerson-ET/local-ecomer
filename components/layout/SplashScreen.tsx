'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [shouldRender, setShouldRender] = useState(true)

  useEffect(() => {
    // Simular carga o esperar a que la app esté lista
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2000)

    const unmountTimer = setTimeout(() => {
      setShouldRender(false)
    }, 2500)

    return () => {
      clearTimeout(timer)
      clearTimeout(unmountTimer)
    }
  }, [])

  if (!shouldRender) return null

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="relative w-32 h-32 animate-pulse-slow">
        <Image
          src="/app-icon.png"
          alt="LocalEcomer Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="mt-6 flex flex-col items-center">
        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-rose-500 animate-loading-bar"></div>
        </div>
        <p className="mt-3 text-sm font-medium text-gray-500 tracking-widest uppercase animate-fade-in">
          Cargando Tiendas Locales
        </p>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite linear;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
