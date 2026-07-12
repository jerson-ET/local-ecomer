'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, MessageCircle, Users, DollarSign } from 'lucide-react'

export default function BuyerEarnSection() {
  const [storeWhatsapp, setStoreWhatsapp] = useState('')
  const [storeName, setStoreName] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wa = localStorage.getItem('last_visited_store_whatsapp') || '573000000000'
      const name = localStorage.getItem('last_visited_store_name') || 'la tienda'
      setStoreWhatsapp(wa)
      setStoreName(name)
    }
  }, [])

  const handleActivate = () => {
    let cleanPhone = storeWhatsapp.replace(/[^0-9]/g, '')
    if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
      cleanPhone = '57' + cleanPhone
    }
    const msg = 'Quiero activar sistema de ventas por valor de 50.000'
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden border border-slate-800 text-center">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-60 h-60 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated Icon */}
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-white/5 animate-pulse relative">
            <Users size={28} className="text-slate-900 absolute translate-x-[-8px] translate-y-[-6px]" />
            <DollarSign size={24} className="text-emerald-500 bg-slate-900 rounded-full p-1 border-2 border-white absolute translate-x-[12px] translate-y-[10px] shadow-md" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black mb-3 leading-tight">
            Adquiere Sistema de Ventas Inteligente
          </h2>
          
          <p className="text-indigo-400 font-extrabold text-sm sm:text-base tracking-wide uppercase mb-6">
            Y empieza a generar ingresos
          </p>

          <p className="text-white leading-relaxed max-w-sm mb-8 font-semibold" style={{ fontSize: '18px' }}>
            Para activar tu cuenta por <span className="text-white font-black inline-block mx-1" style={{ fontSize: '24px' }}>50.000</span> pesos toca este botón <span className="text-white font-black">ACTIVAR CUENTA</span>
          </p>

          {/* Perks list */}
          <div className="w-full max-w-xs text-left space-y-3 mb-8 bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2.5 text-xs text-slate-300 font-semibold">
              <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
              <span>Tu propio catálogo virtual en segundos</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300 font-semibold">
              <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
              <span>Pedidos directos a tu WhatsApp</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300 font-semibold">
              <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
              <span>Gestiona inventarios y ventas</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleActivate}
            className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 uppercase tracking-widest text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/10 cursor-pointer"
          >
            <MessageCircle size={18} className="fill-current" />
            ACTIVAR CUENTA
          </button>

          {/* Secondary info */}
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-4">
            Soporte inmediato vía WhatsApp con {storeName}
          </p>
        </div>
      </div>
    </div>
  )
}
