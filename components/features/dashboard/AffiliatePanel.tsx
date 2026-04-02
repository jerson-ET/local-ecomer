'use client'

import { useState, useEffect } from 'react'
import { Copy, PlusCircle, CheckCircle, CreditCard, Send, Activity, Share2, MapPin, UserCheck, ShieldCheck, Search } from 'lucide-react'

export default function AffiliatePanel() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  // Formulario para inscribir referido
  const [prospectName, setProspectName] = useState('')
  const [prospectWhatsapp, setProspectWhatsapp] = useState('')
  const [prospectCedula, setProspectCedula] = useState('')
  const [prospectLocation, setProspectLocation] = useState('')
  const [submittingProspect, setSubmittingProspect] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const [nequiInput, setNequiInput] = useState('')
  const [savingNequi, setSavingNequi] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/affiliate')
      const data = await res.json()
      if (res.ok) {
        setProfile(data)
        setNequiInput(data.nequiNumber || '')
      }
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNequi = async () => {
    if (!nequiInput.trim()) return alert('Ingresa un número válido')
    setSavingNequi(true)
    try {
      const res = await fetch('/api/user/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_nequi', nequiNumber: nequiInput })
      })
      if (res.ok) {
        alert('Datos de pago guardados exitosamente')
        fetchProfile()
      } else {
        alert('Error al guardar datos de pago')
      }
    } catch(e) {
      console.error(e)
    } finally {
      setSavingNequi(false)
    }
  }

  const handleRegisterProspect = async () => {
    if (!prospectName.trim() || !prospectWhatsapp.trim() || !prospectCedula.trim()) {
      return alert('Por favor llena los campos obligatorios: Nombre, WhatsApp y Cédula.')
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
        alert('¡Solicitud enviada! Tu referido ha sido registrado como PENDIENTE. Una vez que el Super Admin lo active, verás tu comisión de $5.000 acreditada.')
        setProspectName('')
        setProspectWhatsapp('')
        setProspectCedula('')
        setProspectLocation('')
        setShowForm(false)
        fetchProfile()
      } else {
        alert('Error al registrar prospecto')
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
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Cargando Red de Afiliados...</span>
    </div>
  )

  if (!profile) return <div style={{ padding: 40, textAlign: 'center' }}>Error al cargar los datos. Revisa tu conexión.</div>

  const prospects = profile.prospects || []
  const totalEarnings = (profile.earnings || []).reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        
        {/* Header con diseño premium */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-100">
               <Share2 size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-[#0f172a]">Red de Recomendados</h1>
          </div>
          <p className="text-sm text-gray-500 font-medium">Digitaliza negocios colombianos y gana por cada activación.</p>
        </div>

        {/* Dashboard de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#0f172a] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
               <ShieldCheck size={200} />
            </div>
            <span className="text-[10px] font-black tracking-widest uppercase opacity-60">Tu Código Personal</span>
            <div className="flex items-center gap-6 mt-2">
               <span className="text-5xl font-black tracking-tighter">{profile.referralCode || '----'}</span>
               <button onClick={handleCopyCode} className="bg-white/10 hover:bg-white/20 transition-all p-2 rounded-xl border border-white/10 backdrop-blur-sm">
                  <Copy size={18} />
               </button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-gray-400">Tus Ganancias</span>
              <div className="text-5xl font-black text-emerald-500 mt-2 tracking-tighter">
                ${totalEarnings.toLocaleString('es-CO')}
              </div>
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">
               {prospects.filter((p:any) => p.status === 'active').length} Referidos Activos
            </div>
          </div>
        </div>

        {/* Configuración de Pago (Nequi) */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm mb-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                 <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={18} className="text-indigo-500" /> Método de Pago
                 </h2>
                 <p className="text-xs text-gray-400 font-bold mt-1 uppercase">Donde recibirás tus comisiones mensuales</p>
              </div>
              {profile.nequiNumber && (
                 <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl font-black text-xs border border-emerald-100 flex items-center gap-2">
                    <CheckCircle size={14} /> ACTIVO: {profile.nequiNumber}
                 </div>
              )}
           </div>
           
           <div className="flex flex-col sm:flex-row gap-3">
              <input 
                 type="text" 
                 placeholder="Número de Nequi / Daviplata" 
                 value={nequiInput}
                 onChange={(e) => setNequiInput(e.target.value)}
                 className="flex-1 bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-100 transition-all"
              />
              <button 
                 onClick={handleSaveNequi}
                 disabled={savingNequi}
                 className="bg-indigo-600 text-white font-black px-6 py-4 rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                 {savingNequi ? 'GUARDANDO...' : 'ACTUALIZAR NÚMERO'}
              </button>
           </div>
        </div>

        {/* Sección de Inscripción de Referidos */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <UserCheck size={22} className="text-emerald-500" /> Inscribir Nuevo Referido
              </h2>
              <p className="text-xs text-gray-400 font-medium">Registra a un amigo/familiar para que ganes comisión.</p>
            </div>
            <button 
               onClick={() => setShowForm(!showForm)}
               className={`p-3 rounded-2xl transition-all ${showForm ? 'bg-rose-50 text-rose-500 rotate-45' : 'bg-emerald-50 text-emerald-600'}`}
            >
               <PlusCircle size={24} />
            </button>
          </div>

          {showForm && (
             <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nombre del Prospecto</label>
                      <input 
                         placeholder="Ej: Tienda Maria" 
                         value={prospectName}
                         onChange={(e) => setProspectName(e.target.value)}
                         className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">WhatsApp del Nuevo</label>
                      <input 
                         placeholder="Ej: 300 123 4567" 
                         value={prospectWhatsapp}
                         onChange={(e) => setProspectWhatsapp(e.target.value)}
                         className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Cédula de Ciudadanía</label>
                      <input 
                         placeholder="Documento ID" 
                         value={prospectCedula}
                         onChange={(e) => setProspectCedula(e.target.value)}
                         className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Ubicación / Ciudad</label>
                      <div className="relative">
                         <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                         <input 
                            placeholder="Ej: Medellin" 
                            value={prospectLocation}
                            onChange={(e) => setProspectLocation(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold"
                         />
                      </div>
                   </div>
                </div>
                
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                   <p className="text-[11px] text-indigo-700 font-bold leading-relaxed">
                      💡 Al enviar esta solicitud, el Super Admin la revisará. Si se activa, recibirás $5.000 mensuales.
                   </p>
                </div>

                <button 
                  onClick={handleRegisterProspect}
                  disabled={submittingProspect}
                  className="w-full bg-emerald-500 text-white font-black p-5 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Send size={20} /> {submittingProspect ? 'ENVIANDO...' : 'REGISTRAR AHORA'}
                </button>
             </div>
          )}
        </div>

        {/* Lista de Referidos Registrados */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-white sticky top-0 z-10 flex justify-between items-center">
             <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                   <Activity size={22} className="text-indigo-500" /> Mis Recomendados
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Estado en tiempo real de tus solicitudes</p>
             </div>
             <div className="p-2 bg-gray-50 rounded-xl"><Search size={18} className="text-gray-300" /></div>
          </div>
          
          <div className="divide-y divide-gray-50">
            {prospects.length === 0 ? (
              <div className="p-16 text-center text-gray-300 font-black text-xs uppercase tracking-widest">Aún no tienes referidos registrados</div>
            ) : (
              prospects.map((p: any, i: number) => (
                <div key={i} className="p-6 md:p-8 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${p.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {p.name?.[0]?.toUpperCase() || '?'}
                     </div>
                     <div>
                       <div className="text-sm font-black text-slate-800">{p.name}</div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-2">
                          <span>Wa: {p.whatsapp}</span>
                          <span className="w-1 h-1 bg-gray-200 rounded-full" />
                          <span>Ced: {p.cedula}</span>
                       </div>
                     </div>
                  </div>
                  <div>
                    {p.status === 'pending' ? (
                      <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-amber-100/50">
                         <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" /> PENDIENTE
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-emerald-100/50">
                         <CheckCircle size={14} className="text-emerald-500" /> ACTIVO
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
