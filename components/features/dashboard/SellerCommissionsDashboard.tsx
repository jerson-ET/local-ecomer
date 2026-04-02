'use client'

import { useEffect, useMemo, useState } from 'react'
import { DollarSign, Loader2, AlertCircle, CheckCircle2, Clock, CreditCard, XCircle } from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'

type CommissionStatus = 'pending' | 'paid' | 'cancelled'

type CommissionRow = {
  id: string
  order_id: string
  reseller_id: string
  amount: number
  status: CommissionStatus
  referral_code: string | null
  created_at: string
  paid_at: string | null
  paid_method: string | null
  paid_note: string | null
  profiles?: { nombre?: string | null; name?: string | null; email?: string | null } | null
}

export default function SellerCommissionsDashboard({ storeId }: { storeId: string }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commissions, setCommissions] = useState<CommissionRow[]>([])

  const [payModalId, setPayModalId] = useState<string | null>(null)
  const [paidMethod, setPaidMethod] = useState('')
  const [paidNote, setPaidNote] = useState('')
  const [isPaying, setIsPaying] = useState(false)

  const load = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/commissions?storeId=${encodeURIComponent(storeId)}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las comisiones')
      setCommissions((data.commissions || []) as CommissionRow[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando comisiones')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!storeId) return
    load()
  }, [storeId])

  const filtered = useMemo(() => {
    if (filter === 'all') return commissions
    return commissions.filter((c) => c.status === filter)
  }, [commissions, filter])

  const totals = useMemo(() => {
    const pending = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + (c.amount || 0), 0)
    const paid = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0)
    return { pending, paid }
  }, [commissions])

  const openPay = (commissionId: string) => {
    setPayModalId(commissionId)
    setPaidMethod('')
    setPaidNote('')
  }

  const markPaid = async () => {
    if (!payModalId) return
    setIsPaying(true)
    setError(null)
    try {
      const res = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark-paid',
          storeId,
          commissionId: payModalId,
          paidMethod: paidMethod.trim() || null,
          paidNote: paidNote.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo marcar como pagada')
      setPayModalId(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error pagando comisión')
    } finally {
      setIsPaying(false)
    }
  }

  const getStatusPill = (status: CommissionStatus) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle2 size={14} /> Pagada
        </span>
      )
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-100">
          <Clock size={14} /> Pendiente
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-600 border border-gray-200">
        <XCircle size={14} /> Cancelada
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
            <DollarSign size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Comisiones por Referidos</h2>
            <p className="text-sm text-gray-500 font-medium">
              Pendiente: {formatCOP(totals.pending)} • Pagado: {formatCOP(totals.paid)}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-sm"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-white rounded-2xl border border-rose-100 p-4 flex items-start gap-2 text-rose-700 font-bold">
          <AlertCircle size={18} className="mt-0.5" /> {error}
        </div>
      )}

      <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm gap-1">
        {[
          { id: 'pending', label: 'Pendientes' },
          { id: 'paid', label: 'Pagadas' },
          { id: 'all', label: 'Todas' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
              filter === t.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center gap-2 text-gray-600 font-bold">
          <Loader2 className="spinning" size={18} /> Cargando comisiones...
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <div className="font-black text-gray-900">Listado</div>
            <div className="text-xs font-black text-gray-500">{filtered.length} items</div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-600">
              <div className="font-black text-gray-900 mb-1">No hay comisiones en este filtro</div>
              <div className="text-sm">Comparte productos con revendedores para generar ventas por referido.</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((c) => {
                const resellerName =
                  c.profiles?.nombre?.trim() ||
                  c.profiles?.name?.trim() ||
                  c.profiles?.email?.split('@')[0] ||
                  c.reseller_id
                return (
                  <div key={c.id} className="p-4 flex items-start gap-3">
                    <div className="mt-0.5">{getStatusPill(c.status)}</div>
                    <div className="flex-1">
                      <div className="font-black text-gray-900">{formatCOP(c.amount)}</div>
                      <div className="text-xs text-gray-500 font-bold">
                        Pedido #{c.order_id.slice(0, 8)} • Código: {c.referral_code || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 font-bold">Revendedor: {resellerName}</div>
                      {c.status === 'paid' && c.paid_at && (
                        <div className="text-[11px] text-gray-400 font-bold mt-1">
                          Pagada: {new Date(c.paid_at).toLocaleString('es-CO')}
                          {c.paid_method ? ` • Método: ${c.paid_method}` : ''}
                        </div>
                      )}
                    </div>
                    {c.status === 'pending' ? (
                      <button
                        onClick={() => openPay(c.id)}
                        className="px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2"
                      >
                        <CreditCard size={16} /> Pagar
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {payModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="font-black text-gray-900">Marcar comisión como pagada</div>
              <button
                onClick={() => setPayModalId(null)}
                className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs font-black text-gray-500 uppercase mb-1">Método</div>
                <input
                  value={paidMethod}
                  onChange={(e) => setPaidMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  placeholder="Ej: Nequi, Transferencia, Efectivo"
                />
              </div>
              <div>
                <div className="text-xs font-black text-gray-500 uppercase mb-1">Nota</div>
                <textarea
                  value={paidNote}
                  onChange={(e) => setPaidNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white min-h-[90px]"
                  placeholder="Ej: Pago realizado a las 3:15pm, comprobante #123"
                />
              </div>
              <button
                onClick={markPaid}
                disabled={isPaying}
                className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-black text-sm flex items-center justify-center gap-2"
              >
                {isPaying ? <Loader2 className="spinning" size={16} /> : <CheckCircle2 size={16} />}
                Confirmar pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

