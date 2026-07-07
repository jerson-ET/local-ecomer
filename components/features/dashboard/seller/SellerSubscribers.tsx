'use client'

import { useState, useEffect } from 'react'
import { Users, MapPin, ShoppingBag, Calendar, Loader2 } from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'

interface Subscriber {
  id: string
  name: string
  location: string
  joined_at: string
  order_count: number
  total_spent: number
}

interface SubscribersData {
  stats: {
    totalSubscribers: number
    totalProductsBought: number
  }
  subscribers: Subscriber[]
}

export default function SellerSubscribers() {
  const [data, setData] = useState<SubscribersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/seller/subscribers')
        if (!res.ok) throw new Error('Error al cargar suscriptores')
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-bold">Cargando suscriptores...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-rose-500">
        <p className="font-bold">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors">
          Reintentar
        </button>
      </div>
    )
  }

  const subscribers = data?.subscribers || []
  const stats = data?.stats || { totalSubscribers: 0, totalProductsBought: 0 }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Tus Suscriptores</h2>
          <p className="text-sm text-gray-500 mt-1">Clientes que siguen tu tienda y compran regularmente.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{stats.totalSubscribers}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Suscriptores</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{stats.totalProductsBought}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Productos Comprados</div>
          </div>
        </div>
      </div>

      {/* Subscribers List */}
      <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <h3 className="font-black text-gray-900">Lista de Suscriptores</h3>
        </div>

        {subscribers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Users size={40} className="text-gray-200 mb-4" />
            <h4 className="font-black text-gray-900 mb-2">Aún no tienes suscriptores</h4>
            <p className="text-sm text-gray-500 max-w-sm">
              Comparte tu tienda para conseguir más clientes fieles.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {subscribers.map((sub) => (
              <div key={sub.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg">
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-black text-sm text-gray-900">{sub.name}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                        <MapPin size={12} className="text-gray-400" /> {sub.location}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                        <Calendar size={12} className="text-gray-400" /> Se unió el {new Date(sub.joined_at).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                  <div className="text-sm font-black text-gray-900">
                    {formatCOP(sub.total_spent)}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase mt-0 sm:mt-1">
                    {sub.order_count} pedido{sub.order_count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
