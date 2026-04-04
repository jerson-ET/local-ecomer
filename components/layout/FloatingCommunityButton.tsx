'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  WhatsApp Floating Button — Asesor de Venta                                */
/*  Botón flotante con ícono de WhatsApp y texto de bienvenida.              */
/*  Aparece en todas las páginas. Si la tienda tiene WhatsApp, abre chat.    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function FloatingCommunityButton() {
  const [showGreeting, setShowGreeting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const pathname = usePathname()

  // Mostrar el saludo después de 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Ocultar en las tiendas dinámicas o dashboard para evitar superposición
  if (pathname?.startsWith('/tienda') || pathname?.startsWith('/dashboard')) {
    return null
  }

  const handleClick = () => {
    // Abrir WhatsApp genérico o redirigir al dashboard
    // En producción, se puede personalizar con el número de cada tienda
    window.open('https://wa.me/573005730682?text=Hola%2C%20quiero%20más%20información%20sobre%20LocalEcomer', '_blank')
  }

  const handleDismissGreeting = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-5 right-5 z-[99] pointer-events-auto flex flex-col items-end gap-2">
      {/* Greeting bubble */}
      {showGreeting && !dismissed && (
        <div
          className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-4 max-w-[220px] animate-in slide-in-from-bottom-2 fade-in duration-300"
          style={{ animationFillMode: 'forwards' }}
        >
          {/* Close */}
          <button
            onClick={handleDismissGreeting}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xs font-bold transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
          <p className="text-sm font-semibold text-gray-800 leading-snug">
            👋 ¡Hola! ¿Necesitas ayuda?
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Escríbenos por WhatsApp
          </p>
          {/* Triangle arrow */}
          <div
            className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45"
          />
        </div>
      )}

      {/* WhatsApp Button */}
      <button
        onClick={handleClick}
        className="group flex flex-col items-center gap-1.5 cursor-pointer"
        aria-label="Asesor de venta por WhatsApp"
      >
        <div className="w-[60px] h-[60px] bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all duration-200">
          {/* WhatsApp SVG Icon */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <span className="text-[10px] font-bold text-gray-600 tracking-wide uppercase bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-gray-100">
          Asesor de venta
        </span>
      </button>
    </div>
  )
}
