'use client'

import { useEffect, useState, useMemo } from 'react'
import { DollarSign, Loader2, AlertCircle, Clock, CheckCircle2, TrendingUp, PiggyBank, Users } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                 MIS GANANCIAS (COMISIONES GENERADAS POR INVITAR)            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function MisGananciasPanel() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Payout Config State
  const [showPayoutConfig, setShowPayoutConfig] = useState(false)
  const [payoutName, setPayoutName] = useState('')
  const [payoutDoc, setPayoutDoc] = useState('')
  const [payoutType, setPayoutType] = useState('Nequi')
  const [payoutNumber, setPayoutNumber] = useState('')
  const [savingPayout, setSavingPayout] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/affiliate')
      const data = await res.json()
      if (res.ok) {
        setProfile(data)
      } else {
        throw new Error(data.error || 'Error cargando ganancias')
      }
    } catch(e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (profile?.payout_info) {
      setPayoutName(profile.payout_info.fullName || '')
      setPayoutDoc(profile.payout_info.documentId || '')
      setPayoutType(profile.payout_info.accountType || 'Nequi')
      setPayoutNumber(profile.payout_info.accountNumber || '')
    }
  }, [profile])

  const handleSavePayout = async () => {
    if (!payoutName.trim() || !payoutDoc.trim() || !payoutNumber.trim()) {
      return alert('Por favor llena todos los campos obligatorios.')
    }
    setSavingPayout(true)
    try {
      const res = await fetch('/api/user/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'save_payout_info', 
          fullName: payoutName,
          documentId: payoutDoc,
          accountType: payoutType,
          accountNumber: payoutNumber
        })
      })
      if (res.ok) {
        alert('Datos de cobro guardados correctamente. El administrador los verá el día de pago.')
        setShowPayoutConfig(false)
        loadData()
      } else {
        alert('Error al guardar los datos.')
      }
    } catch(e) {
      console.error(e)
    } finally {
      setSavingPayout(false)
    }
  }

  const { activeCount, pendingCount, totalEarningsStr, currentCycleEarningsStr } = useMemo(() => {
    if (!profile) return { activeCount: 0, pendingCount: 0, totalEarningsStr: '0', currentCycleEarningsStr: '0' }
    
    const prospects = profile.prospects || []
    
    // o simplemente por cada prospecto activo se estima $10.000 COP
    const active = prospects.filter((p: any) => p.status === 'active')
    const pending = prospects.filter((p: any) => p.status === 'pending')
    
    // Si la API devuelve 'earnings', las sumamos, si no, lo calculamos fijo x 10000
    let totalE = 0
    if (profile.earnings && Array.isArray(profile.earnings)) {
        totalE = profile.earnings.reduce((s: number, e: any) => s + Number(e.amount || 0), 0)
    } else {
        totalE = active.length * 10000
    }

    // Ganancia Pendiente (lo que el admin te debe pagar por prospectos activos este mes, o prospectos pendientes)
    // Para simplificar la UI de lo que el Admin te DEBE pagar ahora mismo
    const current = (active.length * 10000)

    return { 
      activeCount: active.length, 
      pendingCount: pending.length, 
      totalEarningsStr: totalE.toLocaleString('es-CO'),
      currentCycleEarningsStr: current.toLocaleString('es-CO')
    }
  }, [profile])


  if (loading) {
    return (
      <div className="flex bg-white items-center justify-center p-20 rounded-3xl border border-slate-100 shadow-sm w-full gap-3">
        <Loader2 className="animate-spin text-purple-600" size={24} />
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sincronizando Ganancias...</span>
      </div>
    )
  }

  if (error) {
    return (
       <div className="bg-rose-50 rounded-3xl border border-rose-100 p-8 flex items-start gap-4 text-rose-700 w-full">
         <AlertCircle size={24} className="mt-0.5" />
         <div>
            <h3 className="font-black">No se pudieron cargar tus ganancias</h3>
            <p className="text-sm font-medium opacity-80">{error}</p>
         </div>
       </div>
    )
  }

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto pb-20">
      
      {/* ═══ ENCABEZADO ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20 text-white relative">
            <DollarSign size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Mis Ganancias</h1>
            <p className="text-sm font-medium text-slate-500">
              Dinero generado a través de tu red de invitados.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPayoutConfig(true)}
            className="bg-emerald-50 border-2 border-emerald-100 px-5 py-2.5 rounded-xl font-bold text-sm text-emerald-700 hover:border-emerald-200 transition-colors shadow-sm flex items-center gap-2"
          >
            <PiggyBank size={18} /> Cargar Nequi / Banco
          </button>
          <button
            onClick={loadData}
            className="bg-white border-2 border-slate-100 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:border-slate-200 transition-colors shadow-sm"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* ═══ TARJETAS DE MÉTRICAS GLOBALES ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Ganancia Pendiente de Pago */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl border border-slate-700 group hover:shadow-slate-500/20 transition-all">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
          <PiggyBank className="absolute -right-6 -bottom-6 text-white/5" size={160} />
          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Pagos por Recibir
            </p>
            <div className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-md">
               <span className="text-emerald-500 mr-2">$</span>{currentCycleEarningsStr}
            </div>
            <p className="text-sm font-medium text-slate-400 mt-4 max-w-sm leading-relaxed">
               Este es el saldo que el <span className="text-white font-bold">Administrador General</span> tiene pendiente por pagarte por las personas que has invitado y activado.
            </p>
            <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 max-w-sm">
              <p className="text-emerald-400 text-sm font-bold flex items-start gap-2 mb-2">
                <span className="mt-0.5">•</span> Los pagos se realizan de lunes a martes.
              </p>
              <p className="text-emerald-400/90 text-xs font-medium leading-relaxed flex items-start gap-2">
                <span className="mt-0.5">•</span> La comisión que ganes de lunes a domingo se paga el siguiente martes. ¡Por favor pon tu llave bre-b o tu número Nequi!
              </p>
            </div>
          </div>
        </div>

        {/* Métrica Secundaria */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
             <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
               <TrendingUp size={14} className="text-purple-500" /> Total Histórico
             </p>
             <div className="text-4xl font-black text-slate-800 tracking-tighter">
                ${totalEarningsStr}
             </div>
           </div>
           <div className="mt-8 pt-6 border-t border-slate-100">
               <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">Invitados Activos:</span>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black text-xs">{activeCount}</span>
               </div>
               <div className="flex items-center justify-between text-sm mt-3">
                  <span className="font-bold text-slate-500">Invitados Pendientes:</span>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-black text-xs">{pendingCount}</span>
               </div>
           </div>
        </div>
      </div>

      {/* ═══ FORMULARIO DATOS DE COBRO ═══ */}
      {showPayoutConfig && (
        <div className="bg-slate-800/90 backdrop-blur-md border border-emerald-500/30 rounded-[2rem] p-8 animate-in fade-in slide-in-from-top-4 shadow-xl shadow-emerald-900/20">
          <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
            <PiggyBank className="text-emerald-400" /> Configurar Cuenta de Pago
          </h2>
          <p className="text-sm font-medium text-emerald-100/70 mb-6">Ingresa los datos donde quieres que el administrador consigne tus ganancias.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-500 uppercase ml-2">Nombre Completo del Titular</label>
                <input 
                   placeholder="Ej: Juan Perez" 
                   value={payoutName}
                   onChange={(e) => setPayoutName(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm font-bold text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition-colors"
                />
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-500 uppercase ml-2">Cédula del Titular</label>
                <input 
                   placeholder="Ej: 1000123456" 
                   value={payoutDoc}
                   onChange={(e) => setPayoutDoc(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm font-bold text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition-colors"
                />
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-500 uppercase ml-2">Tipo de Cuenta o App</label>
                <select 
                   value={payoutType}
                   onChange={(e) => setPayoutType(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm font-bold text-white focus:border-emerald-500 outline-none transition-colors appearance-none"
                >
                   <option value="Nequi">Nequi</option>
                   <option value="Daviplata">Daviplata</option>
                   <option value="Bancolombia A la mano">Bancolombia A la mano</option>
                   <option value="Cuenta Ahorros Bancolombia">Cuenta Ahorros Bancolombia</option>
                   <option value="Otro">Otro Banco</option>
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-500 uppercase ml-2">Número de Cuenta</label>
                <input 
                   placeholder="Ej: 3001234567" 
                   value={payoutNumber}
                   onChange={(e) => setPayoutNumber(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm font-bold text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition-colors"
                />
             </div>
          </div>
          
          <div className="flex gap-4">
             <button 
               onClick={handleSavePayout}
               disabled={savingPayout}
               className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black p-4 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 border border-emerald-400"
             >
               {savingPayout ? 'GUARDANDO...' : 'GUARDAR DATOS'}
             </button>
             <button 
               onClick={() => setShowPayoutConfig(false)}
               className="w-full bg-slate-800 text-slate-300 font-black p-4 rounded-xl border border-slate-600 hover:bg-slate-700 transition-all active:scale-95"
             >
               CANCELAR
             </button>
          </div>
        </div>
      )}

      {/* ═══ HISTORIAL / DESGLOSE DE LA RED ═══ */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
             <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-blue-500" /> Detalle de Invitados
             </h2>
             <p className="text-xs font-bold text-slate-400 mt-1">Cómo se conforma el dinero que te deben.</p>
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black border border-emerald-100/50 border-r border-b">
             Ganas $10.000 por cada Activación
          </div>
        </div>

        <div className="divide-y divide-slate-50">
           {(!profile?.prospects || profile.prospects.length === 0) ? (
             <div className="p-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                   <PiggyBank size={32} />
                </div>
                <h3 className="font-black text-slate-800 mb-1">Empieza a ganar dinero</h3>
                <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">Comparte tu código de invitación a tus conocidos y aumenta el saldo que te pagará el administrador.</p>
             </div>
           ) : (
             profile.prospects.map((p: any, i: number) => (
                <div key={i} className="p-6 md:p-8 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${p.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                       {p.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                       <div className="font-black text-slate-800 text-base">{p.name}</div>
                       <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mt-1">
                          WA: {p.whatsapp}
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:mb-0 mb-2 gap-6 ml-16 md:ml-0 bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl">
                     <div className="text-left md:text-right">
                        <div className="text-xs font-black text-slate-400 uppercase mb-1">Aporte Generado</div>
                        {p.status === 'active' ? (
                          <div className="font-black text-emerald-600 text-lg">+$10.000 COP</div>
                        ) : (
                          <div className="font-black text-slate-300 text-lg">+$0 COP</div>
                        )}
                     </div>

                     <div>
                        {p.status === 'active' ? (
                           <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-emerald-100">
                             <CheckCircle2 size={12} /> ACTIVO
                           </div>
                        ) : (
                           <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-amber-100">
                             <Clock size={12} /> PROCESANDO
                           </div>
                        )}
                     </div>
                  </div>
                </div>
             ))
           )}
        </div>
      </div>
    </div>
  )
}
