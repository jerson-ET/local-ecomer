'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronRight, Smartphone, QrCode, Sparkles } from 'lucide-react'

export function TelegramProductUpload({ onBack }: { onBack: () => void; storeId: string | null }) {
  const [qrLoaded, setQrLoaded] = useState(false)
  const botUrl = `https://t.me/Localecomerbot`

  useEffect(() => {
    // Simulamos la carga del QR para dar un efecto smooth
    const timer = setTimeout(() => setQrLoaded(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="product-upload-section min-h-[80vh] flex flex-col font-sans">
      <div className="breadcrumb">
        <button className="breadcrumb-back" onClick={onBack}><ArrowLeft size={18} /></button>
        <span className="breadcrumb-item">Catálogo</span><ChevronRight size={14} /><span className="breadcrumb-item active">Subir vía Telegram</span>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 p-4 lg:p-8 relative">
        
        {/* Lado Izquierdo: Instrucciones */}
        <div className="max-w-md relative z-10">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 font-black text-xs px-3 py-1.5 rounded-full uppercase tracking-widest mb-6">
            <Sparkles size={14} /> Función con IA
          </div>
          <h2 className="text-3xl lg:text-5xl font-black text-slate-800 tracking-tight leading-tight mb-6">
            Sube tu catálogo en <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">tiempo récord</span>.
          </h2>
          <p className="text-slate-600 text-lg mb-8 leading-relaxed">
            Escanea el código QR con la cámara de tu celular. Nuestro asistente de Inteligencia Artificial extraerá los datos de tu imagen y publicará el producto en tu catálogo por ti.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0">1</div>
              <div>
                <h4 className="font-bold text-slate-800">Abre tu cámara</h4>
                <p className="text-sm text-slate-500">Apunta al código QR para abrir Telegram.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0">2</div>
              <div>
                <h4 className="font-bold text-slate-800">Envía la Foto</h4>
                <p className="text-sm text-slate-500">Toma una foto al producto y pon el precio y nombre en el mensaje.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0">3</div>
              <div>
                <h4 className="font-bold text-slate-800">¡Producto Publicado!</h4>
                <p className="text-sm text-slate-500">La IA se encarga de subirlo a tu tienda en segundos.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Tarjeta QR */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[3rem] blur-2xl opacity-20 transform rotate-6"></div>
          <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col items-center text-center w-80">
            <div className="bg-slate-50 p-4 rounded-3xl mb-6 shadow-inner w-64 h-64 flex items-center justify-center relative overflow-hidden">
              {!qrLoaded ? (
                <div className="animate-pulse flex flex-col items-center gap-2 text-slate-400">
                   <QrCode size={40} />
                   <span className="text-xs font-bold uppercase">Generando QR...</span>
                </div>
              ) : (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(botUrl)}&format=svg&color=1e293b`}
                  alt="QR Telegram Bot" 
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              )}
            </div>

            <h3 className="font-black text-xl text-slate-800 mb-1">@Localecomerbot</h3>
            <p className="text-slate-500 text-xs mb-6 px-4">Escanea para charlar con tu asistente IA.</p>
            
            <a 
              href={botUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Smartphone size={18} />
              Abrir en este dispositivo
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
