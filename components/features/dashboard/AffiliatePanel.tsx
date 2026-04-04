'use client'

import { useState, useEffect } from 'react'
import { Copy, PlusCircle, CheckCircle, Send, Activity, Share2, MapPin, Search, Clock, Users, Timer, Sparkles } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                 PANEL DE INVITADOS — RED TIPO ÁRBOL                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AffiliatePanel() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  // Registrar Invitado
  const [prospectName, setProspectName] = useState('')
  const [prospectWhatsapp, setProspectWhatsapp] = useState('')
  const [prospectCedula, setProspectCedula] = useState('')
  const [prospectLocation, setProspectLocation] = useState('')
  const [submittingProspect, setSubmittingProspect] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Timer Estado
  const [timeLeft, setTimeLeft] = useState({ days: 7, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    fetchProfile()
    
    // Simulate fake countdown from 7 days
    const targetDate = new Date().getTime() + (7 * 24 * 60 * 60 * 1000)
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate - now
      
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/affiliate')
      const data = await res.json()
      if (res.ok) setProfile(data)
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterProspect = async () => {
    if (!prospectName.trim() || !prospectWhatsapp.trim()) {
      return alert('Por favor llena los campos obligatorios: Nombre y WhatsApp.')
    }
    setSubmittingProspect(true)
    try {
      const res = await fetch('/api/user/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'register_prospect', 
          name: prospectName, 
          whatsapp: prospectWhatsapp,
          cedula: prospectCedula,
          location: prospectLocation,
          referrerName: profile?.nombre || 'Afiliado'
        })
      })
      if (res.ok) {
        alert('¡Solicitud enviada! Tu invitado ha sido registrado.')
        setProspectName('')
        setProspectWhatsapp('')
        setProspectCedula('')
        setProspectLocation('')
        setShowForm(false)
        fetchProfile()
      }
    } catch(e) {
      console.error(e)
    } finally {
      setSubmittingProspect(false)
    }
  }

  const handleCopyCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode)
      alert('Código copiado: ' + profile.referralCode)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando Red...</span>
    </div>
  )

  const prospects = profile?.prospects || []
  const maxSlots = 5

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 pb-24 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                 <Share2 size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-black text-white drop-shadow-md">Tu Red de Invitados</h1>
            </div>
            <p className="text-sm text-purple-200 font-medium ml-1">Invita amigos y construye tu red para obtener beneficios.</p>
          </div>

          {/* TIMER */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 p-4 rounded-3xl shadow-xl flex items-center gap-4 group hover:border-purple-500/50 transition-colors">
            <div className="bg-purple-900/50 p-3 rounded-xl">
              <Timer className="text-purple-400 group-hover:animate-spin" size={24} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Tiempo para Pagar</p>
              <div className="flex gap-2 text-center text-white">
                <div className="bg-slate-900 px-2 py-1 rounded border border-slate-700 min-w-[40px] shadow-inner">
                  <span className="block text-lg font-black">{timeLeft.days}</span><span className="text-[9px] text-gray-500">DÍAS</span>
                </div>
                <div className="bg-slate-900 px-2 py-1 rounded border border-slate-700 min-w-[40px] shadow-inner">
                  <span className="block text-lg font-black">{timeLeft.hours}</span><span className="text-[9px] text-gray-500">HRS</span>
                </div>
                <div className="bg-slate-900 px-2 py-1 rounded border border-slate-700 min-w-[40px] shadow-inner">
                  <span className="block text-lg font-black">{timeLeft.minutes}</span><span className="text-[9px] text-gray-500">MIN</span>
                </div>
                <div className="bg-slate-900 px-2 py-1 rounded border border-slate-700 min-w-[40px] shadow-inner">
                  <span className="block text-lg font-black text-purple-400">{timeLeft.seconds}</span><span className="text-[9px] text-gray-500">SEG</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CÓDIGO Y ACCIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Código Box */}
          <div className="md:col-span-2 bg-gradient-to-br from-purple-900/40 to-slate-800/60 backdrop-blur-md rounded-[2rem] p-8 border border-purple-500/20 relative overflow-hidden flex items-center flex-col sm:flex-row justify-between gap-6">
            <div className="absolute right-0 top-0 opacity-10"><Sparkles size={200} /></div>
            <div className="relative z-10 w-full sm:w-auto text-center sm:text-left">
              <span className="text-[10px] font-black tracking-widest uppercase text-purple-300">Tu Código de Invitación</span>
              <div className="text-4xl sm:text-5xl font-black mt-2 tracking-tighter text-white drop-shadow-md">
                {profile?.referralCode || '----'}
              </div>
            </div>
            <button onClick={handleCopyCode} className="relative z-10 bg-purple-600 hover:bg-purple-500 text-white font-black px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-2 active:scale-95 w-full sm:w-auto justify-center">
              <Copy size={18} /> COPIAR CÓDIGO
            </button>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => setShowForm(!showForm)}>
            <div className={`p-4 rounded-full mb-3 transition-colors ${showForm ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {showForm ? <Activity size={32} /> : <PlusCircle size={32} />}
            </div>
            <h3 className="font-black text-lg">Invitar Persona</h3>
            <p className="text-xs text-gray-400 mt-1">Registra aquí los datos</p>
          </div>
        </div>

        {/* ═══ FORMULARIO INVITACIÓN ═══ */}
        {showForm && (
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-[2rem] p-8 mb-12 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <UserCheck className="text-blue-400" /> Nuevo Invitado
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nombre del Prospecto</label>
                  <input 
                     placeholder="Ej: Tienda Maria" 
                     value={prospectName}
                     onChange={(e) => setProspectName(e.target.value)}
                     className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm font-bold text-white placeholder-slate-500 focus:border-purple-500 outline-none transition-colors"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">WhatsApp</label>
                  <input 
                     placeholder="Ej: 300 123 4567" 
                     value={prospectWhatsapp}
                     onChange={(e) => setProspectWhatsapp(e.target.value)}
                     className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm font-bold text-white placeholder-slate-500 focus:border-purple-500 outline-none transition-colors"
                  />
               </div>
            </div>
            
            <button 
              onClick={handleRegisterProspect}
              disabled={submittingProspect}
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black p-4 rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 border border-purple-500/50"
            >
              <Send size={20} /> {submittingProspect ? 'ENVIANDO...' : 'REGISTRAR INVITADO'}
            </button>
          </div>
        )}

        {/* ═══ DIAGRAMA TIPO ÁRBOL (RED) ═══ */}
        <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm rounded-[3rem] p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(147,197,253,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(147,197,253,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          <h2 className="relative z-10 text-2xl font-black mb-2 text-white">Afiliados de tu red</h2>
          <p className="relative z-10 text-sm text-gray-400 font-medium mb-12 max-w-lg mx-auto">
            Este es tu árbol de conexiones. Los puestos en gris están vacíos. 
            ¡Invita personas para iluminarlos de color neón!
          </p>

          <div className="relative z-10 flex flex-col items-center">
            {/* TÚ (TOP) */}
            <div className="relative flex flex-col items-center z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center p-1 shadow-[0_0_30px_rgba(139,92,246,0.6)] z-10 border-2 border-white">
                 <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-black text-white">TÚ</span>
                 </div>
              </div>
            </div>

            {/* Línea Central (Tronco) */}
            <div className="w-1 h-12 bg-purple-500/50 relative z-0" />

            {/* Línea Horizontal (Ramas distribuidoras) */}
            {/* Adaptativo: en móvil se ve en grid, en desktop en línea recta. 
                Para diagrama de árbol clásico lo mantendremos en flex wrap o grid. */}
            
            <div className="w-full max-w-3xl relative">
              {/* Barra conectora superior (visible en pantallas md+) */}
              <div className="hidden md:block absolute top-0 left-[10%] right-[10%] h-1 bg-purple-500/50" />

              <div className="grid grid-cols-2 md:grid-cols-5 gap-y-10 gap-x-4 pt-0 md:pt-6">
                {[0, 1, 2, 3, 4].map((index) => {
                  const prospect = prospects[index] // Tomamos el prospecto si existe
                  const isActive = prospect?.status === 'active'
                  const isPending = prospect?.status === 'pending'
                  const isFilled = prospect !== undefined

                  return (
                    <div key={index} className="flex flex-col items-center relative">
                      {/* Conector individual hacia la barra horizontal (solo desktop) */}
                      <div className="hidden md:block absolute -top-6 left-1/2 w-1 h-6 bg-purple-500/50 -translate-x-1/2" />
                      
                      {/* Avatar Nodo */}
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center z-10 border-2 transition-all duration-500 shadow-xl ${
                        isActive 
                          ? 'bg-purple-900 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.8)]' 
                          : isPending 
                            ? 'bg-amber-900 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                            : 'bg-slate-800 border-slate-600 border-dashed opacity-60'
                      }`}>
                        {isActive ? (
                          <CheckCircle className="text-purple-300" size={28} />
                        ) : isPending ? (
                          <Clock className="text-amber-300" size={28} />
                        ) : (
                          <Users className="text-slate-500" size={28} />
                        )}
                      </div>

                      {/* Info Nodo */}
                      <div className="mt-4 text-center">
                        {isFilled ? (
                          <>
                            <h4 className="font-black text-sm text-white truncate w-24 mx-auto">{prospect.name}</h4>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase mt-1 inline-block ${
                              isActive ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                            }`}>
                              {isActive ? 'Activo' : 'Pendiente'}
                            </span>
                          </>
                        ) : (
                          <>
                            <h4 className="font-black text-xs text-slate-500 uppercase tracking-widest mt-2">Vacío</h4>
                            <span className="text-[9px] text-slate-600 block mt-1">Gana invitando</span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
