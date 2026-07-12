'use client'

import { useState, useEffect } from 'react'
import { DollarSign, MessageCircle, Clock, Loader2, AlertCircle, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCOP } from '@/lib/store/marketplace'

export default function SellerEarnSection() {
  const [loading, setLoading] = useState(true)
  const [commission, setCommission] = useState<number>(0)
  const [advisorPhone, setAdvisorPhone] = useState<string | null>(null)
  const [advisorName, setAdvisorName] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchCommissionAndAdvisor = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('comision_generada, created_by_sales_id')
          .eq('id', user.id)
          .single()

        if (profile) {
          setCommission(Number(profile.comision_generada) || 0)

          if (profile.created_by_sales_id) {
            const { data: advisor } = await supabase
              .from('profiles')
              .select('telefono, nombre')
              .eq('id', profile.created_by_sales_id)
              .single()
            if (advisor?.telefono) {
              setAdvisorPhone(advisor.telefono)
              setAdvisorName(advisor.nombre)
            }
          } else {
            // Fallback: buscar el primer asesor oficial disponible
            const { data: advisors } = await supabase
              .from('profiles')
              .select('telefono, nombre')
              .eq('role', 'sales')
              .limit(1)
            if (advisors && advisors.length > 0 && advisors[0].telefono) {
              setAdvisorPhone(advisors[0].telefono)
              setAdvisorName(advisors[0].nombre)
            } else {
              setAdvisorPhone('3005730682') // Teléfono admin general por defecto
              setAdvisorName('Soporte LocalEcomer')
            }
          }
        }
      } catch (err) {
        console.error('Error cargando comisión/asesor:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCommissionAndAdvisor()
  }, [])

  const formatWithdrawLink = () => {
    const targetPhone = advisorPhone || '3005730682'
    const cleanPhone = targetPhone.replace(/\D/g, '')
    const fullPhone = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone
    const message = `Hola${advisorName ? ' ' + advisorName : ''}, te contacto desde mi panel de vendedor de LocalEcomer. Quiero solicitar el retiro de mi saldo de comisiones acumulado que es de ${formatCOP(commission)}.`
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mb-4 text-indigo-600" size={32} />
        <p className="font-bold">Cargando tus comisiones...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-10"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3">
            <DollarSign size={14} /> Centro de Retiros
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-2 leading-tight">Mis Comisiones & Saldo</h2>
          <p className="text-indigo-200 text-sm max-w-xl">
            Aquí puedes ver el saldo que has acumulado en comisiones. Solicita tu retiro de manera directa por WhatsApp con tu asesor asignado para que consigne a tu cuenta.
          </p>
        </div>
      </div>

      {/* Comisión Generada Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saldo de Comisión */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Mi Comisión Acumulada</div>
            <div className="text-4xl font-black text-slate-900 mb-2">{formatCOP(commission)}</div>
            <p className="text-xs text-slate-500 font-medium">Este es el saldo que el área de ventas ha registrado para tu cuenta.</p>
          </div>

          <div className="mt-8">
            <a
              href={formatWithdrawLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
            >
              <MessageCircle size={18} />
              Retirar Saldo por WhatsApp
            </a>
          </div>
        </div>

        {/* Información de Pagos */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Información Importante</div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <Clock className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Días de Pago</h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-semibold">Los pagos son procesados únicamente en días hábiles (de lunes a viernes).</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <AlertCircle className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Método de Cobro</h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-semibold">Al hacer clic en retirar, te comunicarás con el asesor del área de ventas. Debes indicarle tus datos de cuenta para que proceda a realizar la consignación.</p>
                </div>
              </div>

              {advisorName && (
                <div className="flex gap-3">
                  <ShieldAlert className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Asesor Asignado</h4>
                    <p className="text-xs text-indigo-600 mt-0.5 font-bold">{advisorName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
