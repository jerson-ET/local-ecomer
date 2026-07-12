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
      <div className="w-full h-full max-w-5xl bg-[#0a0e17] border border-white/10 rounded-3xl p-8 sm:p-14 shadow-2xl flex flex-col justify-center items-center text-center gap-8 animate-in slide-in-from-bottom-8 duration-500 overflow-y-auto relative overflow-hidden">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img 
            src="/logooriginal.webp" 
            alt="LocalEcomer Background Logo" 
            className="w-full h-full object-cover opacity-25" 
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-transparent to-[#0a0e17] opacity-60" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 max-w-3xl">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Valoramos tu privacidad
          </h2>
          
          <p className="text-gray-300 text-lg sm:text-xl leading-relaxed">
            Utilizamos cookies propias y de terceros para asegurar el correcto funcionamiento de LocalEcomer, mostrarte contenido personalizado y analizar nuestro tráfico. ¿Nos permites usar cookies para mejorar tu experiencia?
          </p>

          <div className="w-full max-w-md flex flex-col gap-4 mt-4">
            {/* Botón principal */}
            <button 
              onClick={handleAccept}
              className="w-full py-5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xl sm:text-2xl transition-transform active:scale-[0.98] shadow-lg shadow-indigo-600/30"
            >
              Aceptar cookies
            </button>
            
            {/* Opción muy pequeña con flechita cerrada */}
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors mx-auto mt-4 px-4 py-2"
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
    </div>
  )
}
