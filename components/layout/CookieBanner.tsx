'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Cookie } from 'lucide-react'

export default function CookieBanner() {
  const [show, setShow] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    // Verificar si ya hay consentimiento en localStorage al entrar por primera vez
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShow(false)
  }

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] p-4 sm:p-8 flex items-center justify-center bg-black/90 backdrop-blur-md pointer-events-auto">
      {/* Contenedor que ocupa casi toda la pantalla */}
      <div className="w-full h-full max-w-5xl bg-[#0a0e17] border border-white/10 rounded-3xl p-8 sm:p-14 shadow-2xl flex flex-col justify-center items-center text-center gap-8 animate-in slide-in-from-bottom-8 duration-500 overflow-y-auto">
        <Cookie className="h-16 w-16 sm:h-20 sm:w-20 text-indigo-400 mb-2" />
        
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Valoramos tu privacidad
        </h2>
        
        <p className="text-gray-400 text-lg sm:text-xl leading-relaxed max-w-3xl">
          Utilizamos cookies propias y de terceros para asegurar el correcto funcionamiento de LocalEcomer, mostrarte contenido personalizado y analizar nuestro tráfico. ¿Nos permites usar cookies para mejorar tu experiencia?
        </p>

        <div className="w-full max-w-md flex flex-col gap-4 mt-8">
          {/* Botón principal */}
          <button 
            onClick={handleAccept}
            className="w-full py-5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xl sm:text-2xl transition-transform active:scale-[0.98]"
          >
            Aceptar cookies
          </button>
          
          {/* Opción muy pequeña con flechita cerrada */}
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-300 transition-colors mx-auto mt-6 px-4 py-2"
          >
            {showOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Opciones de cookies
          </button>

          {/* Menú desplegable con las dos opciones */}
          <div 
            className={`flex flex-col gap-3 transition-all duration-300 w-full overflow-hidden ${
              showOptions ? 'opacity-100 max-h-60 mt-2' : 'opacity-0 max-h-0'
            }`}
          >
             <button 
              onClick={handleAccept}
              className="w-full py-4 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold text-sm sm:text-base transition-colors"
            >
              Aceptar cookies
            </button>
            <button 
              onClick={handleReject}
              className="w-full py-4 px-4 bg-transparent hover:bg-white/5 text-gray-400 border border-white/10 rounded-xl font-bold text-sm sm:text-base transition-colors"
            >
              Rechazar cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
