'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Users, Share2, Copy, Gift, TrendingUp, CheckCircle, Clock, Zap, Loader2, Check, AlertCircle } from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'

interface ReferralStats {
  totalReferred: number
  converted: number
  totalEarned: number
}

interface Referral {
  id: string
  status: string
  commission_amount: number
  created_at: string
  converted_at?: string
  referred_name: string
}

export default function SellerEarnSection() {
  const [refCode, setRefCode] = useState<string | null>(null)
  const [refLink, setRefLink] = useState<string>('')
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/referrals')
      if (!res.ok) throw new Error('Error al cargar programa de referidos')
      const data = await res.json()
      
      setRefCode(data.refCode || null)
      setRefLink(data.refLink || '')
      setStats(data.stats || { totalReferred: 0, converted: 0, totalEarned: 0 })
      setReferrals(data.referrals || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' })
      })
      if (!res.ok) throw new Error('Error al generar código')
      await fetchData() // reload everything
    } catch (err: any) {
      alert(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!refLink) return
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-bold">Cargando programa de referidos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-rose-500">
        <p className="font-bold">{error}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors">
          Reintentar
        </button>
      </div>
    )
  }

  if (!refCode) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-12 text-center text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
            <Gift size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black mb-4">Programa de Referidos</h2>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-300 px-4 py-2 rounded-full text-sm font-black mb-4">
            <DollarSign size={16} />
            Comisión 50% · $25.000 por invitado
          </div>
          <p className="text-indigo-100 max-w-md mx-auto mb-8 text-lg">
            Invita a otros emprendedores a crear su propio Sistema de Ventas Inteligente y <span className="text-emerald-300 font-bold">gana $25.000 por cada persona que invites</span>.
          </p>
          
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-lg shadow-emerald-500/20 disabled:opacity-70 disabled:hover:scale-100 flex items-center gap-2"
          >
            {generating ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
            Activar Mi Código de Referido
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3">
              <Gift size={14} /> ¡Ganas el 50% ($25.000 COP) por invitado!
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-2 leading-tight">Invita Emprendedores y Gana $25.000 COP</h2>
            <p className="text-indigo-200 text-sm max-w-md mx-auto md:mx-0">
              Comparte tu enlace con otros emprendedores. Cuando adquieran su Sistema de Ventas Inteligente, tú ganas una comisión directa del 50% ($25.000 COP) por cada uno.
            </p>
          </div>
          
          <div className="w-full md:w-auto bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 text-center md:text-left">Tu Enlace de Invitación</div>
            <div className="flex items-center gap-2 bg-black/30 p-2 rounded-xl">
              <span className="text-sm font-bold text-emerald-400 px-2 truncate max-w-[200px] select-all">
                {refLink}
              </span>
              <button 
                onClick={handleCopy}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 p-2 rounded-lg transition-colors shrink-0"
                title="Copiar enlace"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning / Important info */}
      <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex items-start gap-3">
        <AlertCircle className="text-indigo-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-sm font-bold text-indigo-900">Transparencia Total</h4>
          <p className="text-xs text-indigo-700/80 mt-1 leading-relaxed">
            Este programa recompensa tu esfuerzo de recomendación <span className="font-bold">exclusivamente en primer nivel</span>. Recibes comisión del 50% ($25.000 COP) únicamente por los emprendedores que invites de manera directa. No es un esquema piramidal ni multinivel.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{stats?.totalReferred || 0}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Invitados</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 bg-emerald-50 w-20 h-20 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center relative z-10 shadow-sm">
            <DollarSign size={24} />
          </div>
          <div className="relative z-10">
            <div className="text-2xl font-black text-gray-900">{formatCOP(stats?.totalEarned || 0)}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Ganado (50%)</div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
        <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="text-indigo-500" /> ¿Cómo funciona?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm text-center">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 font-black">1</div>
            <h4 className="font-bold text-sm text-gray-900 mb-1">Comparte</h4>
            <p className="text-xs text-gray-500">Comparte tu enlace con otros emprendedores.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm text-center">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 font-black">2</div>
            <h4 className="font-bold text-sm text-gray-900 mb-1">Se registran</h4>
            <p className="text-xs text-gray-500">Ellos crean su Sistema de Ventas Inteligente.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm text-center border-2 border-emerald-100 relative">
            <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full rotate-12">50% COP</div>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 font-black">3</div>
            <h4 className="font-bold text-sm text-gray-900 mb-1">Ganas $25.000</h4>
            <p className="text-xs text-gray-500">Recibes una comisión del 50% ($25.000 COP) por cada tienda activa.</p>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <h3 className="font-black text-gray-900">Historial de Referidos</h3>
          <span className="text-xs font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">
            {referrals.length} total
          </span>
        </div>
        
        {referrals.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Share2 size={40} className="text-gray-200 mb-4" />
            <h4 className="font-black text-gray-900 mb-2">Aún no tienes invitados</h4>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              Empieza a compartir tu enlace para ganar comisiones por cada nueva tienda que se registre.
            </p>
            <button 
              onClick={handleCopy}
              className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <Copy size={16} /> Copiar Enlace
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {referrals.map(ref => (
              <div key={ref.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-black">
                    {ref.referred_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-black text-sm text-gray-900">{ref.referred_name}</div>
                    <div className="text-xs font-medium text-gray-400">
                      Invitado el {new Date(ref.created_at).toLocaleDateString('es-CO')}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {ref.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                      <Clock size={12} /> Pendiente
                    </span>
                  )}
                  {ref.status === 'converted' && (
                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase mb-1">
                        <CheckCircle size={12} /> Activo
                      </span>
                      <span className="text-sm font-black text-gray-900">+{formatCOP(ref.commission_amount)}</span>
                    </div>
                  )}
                  {ref.status === 'paid' && (
                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase mb-1">
                        <DollarSign size={12} /> Pagado
                      </span>
                      <span className="text-sm font-black text-gray-400">+{formatCOP(ref.commission_amount)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
