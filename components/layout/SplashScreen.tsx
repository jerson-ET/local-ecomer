'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const LOADING_STEPS = [
  'Inicializando plataforma...',
  'Buscando tiendas locales en tu zona...',
  'Conectando con servidores seguros...',
  'Cargando catálogos de productos...',
  'Optimizando tu experiencia de compra...',
  'Sincronizando inventario...',
  '¡Bienvenido a LocalEcomer!'
]

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [shouldRender, setShouldRender] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    // Evitar volver a mostrar el splash screen si ya se mostró en esta sesión
    if (typeof window !== 'undefined') {
      const hasShown = sessionStorage.getItem('splash_shown')
      if (hasShown) {
        setIsVisible(false)
        setShouldRender(false)
        return
      }
      sessionStorage.setItem('splash_shown', 'true')
    }

    // Intervalo para cambiar los textos y entretener al usuario
    const textInterval = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev))
    }, 450)

    // Simular una carga entretenida de 3 segundos
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2800)

    const unmountTimer = setTimeout(() => {
      setShouldRender(false)
    }, 3300)

    return () => {
      clearInterval(textInterval)
      clearTimeout(timer)
      clearTimeout(unmountTimer)
    }
  }, [])

  if (!shouldRender) return null

  return (
    <div 
      suppressHydrationWarning 
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#090b11] transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0 scale-105 pointer-events-none'
      }`}
    >
      {/* Fondo tecnológico de cuadrícula (Grid) y luces */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse-slow" />

      {/* Contenedor central de la animación */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Anillos cibernéticos rotatorios */}
        <div className="absolute w-56 h-56 border border-dashed border-cyan-500/30 rounded-full animate-[spin_12s_linear_infinite]" />
        <div className="absolute w-48 h-48 border border-double border-purple-500/20 rounded-full animate-[spin_8s_linear_infinite_reverse]" />
        <div className="absolute w-64 h-64 border-t-2 border-r-2 border-cyan-400/40 rounded-full animate-[spin_3s_linear_infinite]" />
        
        {/* Contenedor del Logo con Escáner Láser */}
        <div className="relative w-36 h-36 rounded-2xl overflow-hidden bg-[#111420] border border-gray-800/80 shadow-[0_0_50px_rgba(139,92,246,0.15)] flex items-center justify-center p-4">
          <Image
            src="/logooriginal_raw.webp"
            alt="LocalEcomer Logo"
            width={128}
            height={128}
            className="object-contain animate-float"
            priority
          />
          
          {/* Línea de escaneo láser */}
          <div className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-scanner" />
        </div>
      </div>

      {/* Consola de carga */}
      <div className="mt-12 flex flex-col items-center max-w-xs w-full px-6 text-center">
        {/* Barra de progreso de carga estilizada */}
        <div className="w-full h-[4px] bg-gray-900 rounded-full overflow-hidden border border-gray-800/50">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / LOADING_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Consola de Telemetría (Textos Dinámicos) */}
        <div className="mt-4 min-h-[40px] flex items-center justify-center">
          <p className="text-[13px] font-mono tracking-wider text-cyan-400/90 animate-pulse">
            <span className="text-purple-400 mr-1.5">&gt;</span>
            {LOADING_STEPS[stepIndex]}
          </p>
        </div>

        {/* Indicador de porcentaje */}
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
          {Math.min(Math.round(((stepIndex + 1) / LOADING_STEPS.length) * 100), 100)}% Completado
        </span>
      </div>

      <style jsx>{`
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.02); }
        }
        .animate-scanner {
          animation: scanner 2.2s ease-in-out infinite;
        }
        @keyframes scanner {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
        .animate-pulse-slow {
          animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
