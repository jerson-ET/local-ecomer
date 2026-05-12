'use client'

import React, { useState, useEffect } from 'react'
import ChatiLogo from '@/components/ui/ChatiLogo'
import ChatCenter from '@/components/features/dashboard/ChatCenter'
import { ShieldCheck, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import InstallPWA from '@/components/pwa/InstallPWA'

export default function MessengerApp() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col font-sans">
      {/* Barra de estado tipo App Nativa */}
      <div className="bg-slate-800 px-6 py-3 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-3">
          <ChatiLogo size={42} />
          <div>
            <h1 className="text-white font-black text-xl tracking-tighter leading-none">Chati</h1>
            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">by LocalEcomer</span>
          </div>
          <div className="px-2 py-0.5 bg-amber-400 text-black font-black text-[9px] rounded-md uppercase tracking-tighter animate-pulse shadow-lg shadow-amber-400/20">
            En Desarrollo
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Servidor Activo</span>
          </div>
          <div className="flex items-center gap-2">
            <InstallPWA />
            <Zap size={16} className="text-amber-400" />
          </div>
        </div>
      </div>

      {/* El Chat Center que construimos, ahora en pantalla completa */}
      <div className="flex-1 overflow-hidden">
        <ChatCenter />
      </div>

      {/* Footer de Seguridad */}
      <div className="bg-slate-800 px-6 py-2 flex items-center justify-center gap-2 border-t border-slate-700">
        <ShieldCheck size={12} className="text-slate-500" />
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Chati utiliza conexión encriptada</span>
      </div>

      <style jsx global>{`
        /* Reset de estilos para que se vea como una App nativa */
        body {
          overflow: hidden !important;
          background-color: #0f172a;
        }
        /* Ajustar el ChatCenter para este layout oscuro */
        .dashboard-layout {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
