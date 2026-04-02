'use client'

import { useEffect, useState } from 'react'
import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'
import { createClient } from '@/lib/supabase/client'

interface Commission {
  id: string
  orderId: string
  date: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  storeName: string
}

export default function CommissionsDashboard() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setCommissions([])
        setError('Debes iniciar sesión como revendedor.')
        return
      }

      const { data, error: qErr } = await supabase
        .from('commissions')
        .select('id, order_id, amount, status, created_at, stores(name)')
        .eq('reseller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200)
      if (qErr) throw qErr

      const mapped: Commission[] = (data || []).map((c: any) => ({
        id: c.id,
        orderId: c.order_id,
        date: new Date(c.created_at).toLocaleDateString('es-CO'),
        amount: Number(c.amount || 0),
        status: c.status,
        storeName: c.stores?.name || 'Tienda',
      }))
      setCommissions(mapped)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando comisiones')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = commissions.filter((c) => filter === 'all' || c.status === filter)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 size={16} className="text-emerald-600" />
      case 'pending':
        return <Clock size={16} className="text-amber-500" />
      case 'cancelled':
        return <XCircle size={16} className="text-rose-500" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelado'
      default:
        return 'Desconocido'
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <DollarSign size={20} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black text-gray-900">Comisiones</h2>
          <p className="text-sm text-gray-500 font-medium">Historial de ganancias por referidos.</p>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm"
        >
          {isLoading ? <Loader2 className="spinning" size={16} /> : 'Actualizar'}
        </button>
      </div>

      {error && (
        <div className="bg-white rounded-2xl border border-rose-100 p-4 flex items-start gap-2 text-rose-700 font-bold">
          <AlertCircle size={18} className="mt-0.5" /> {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm gap-1">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'paid', label: 'Pagados' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                filter === t.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2"
          onClick={() => alert('El flujo de pagos se activa al final (pasarela/transferencias).')}
        >
          <CreditCard size={16} /> Solicitar pago
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
          <div className="font-black text-gray-900">Movimientos</div>
          <div className="text-xs font-black text-gray-500">{filtered.length} items</div>
        </div>

        {isLoading && (
          <div className="p-8 flex items-center justify-center gap-2 text-gray-600 font-bold">
            <Loader2 className="spinning" size={16} /> Cargando...
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="p-10 text-center text-gray-600">
            <div className="font-black text-gray-900 mb-1">No hay comisiones</div>
            <div className="text-sm">Comparte enlaces para empezar a ganar.</div>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="divide-y divide-gray-50">
            {filtered.map((c) => (
              <div key={c.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
                  {getStatusIcon(c.status)}
                </div>
                <div className="flex-1">
                  <div className="font-black text-gray-900">{c.storeName}</div>
                  <div className="text-xs text-gray-500 font-bold">
                    #{c.orderId.slice(0, 8)} • {c.date}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-gray-900">{formatCOP(c.amount)}</div>
                  <div className="text-[10px] font-black uppercase text-gray-500">
                    {getStatusLabel(c.status)}
                  </div>
                </div>
                <ChevronRight className="text-gray-300" size={18} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
