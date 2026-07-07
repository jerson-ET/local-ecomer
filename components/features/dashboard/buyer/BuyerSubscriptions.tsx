'use client'

import { useState, useEffect } from 'react'
import { Heart, Store, ExternalLink, UserMinus, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface FollowedStore {
  id: string
  name: string
  slug: string
  theme_color: string | null
  follower_count: number
}

export default function BuyerSubscriptions() {
  const [stores, setStores] = useState<FollowedStore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null)

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stores/follow?list=true')
      if (!res.ok) throw new Error('Error al cargar suscripciones')
      const data = await res.json()
      setStores(data.stores || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUnfollow = async (storeId: string) => {
    try {
      setUnfollowingId(storeId)
      const res = await fetch('/api/stores/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId })
      })
      if (!res.ok) throw new Error('Error al cancelar suscripción')
      
      // Remove from list
      setStores(prev => prev.filter(s => s.id !== storeId))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUnfollowingId(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-bold">Cargando tus suscripciones...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-rose-500">
        <p className="font-bold">{error}</p>
        <button onClick={fetchStores} className="mt-4 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Heart className="text-rose-500" fill="currentColor" /> Mis Suscripciones
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Sistemas de Ventas a los que estás suscrito
          </p>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-2xl">
          <span className="text-2xl font-black text-gray-900">{stores.length}</span>
        </div>
      </div>

      {stores.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
            <Store size={40} />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">Aún no sigues ninguna tienda</h3>
          <p className="text-gray-500 font-medium max-w-sm mb-8">
            Explora el marketplace y suscríbete a tus favoritas para recibir recomendaciones personalizadas.
          </p>
          <Link href="/" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 hover:shadow-lg">
            Explorar Tiendas
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map(store => (
            <div key={store.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm"
                    style={{ backgroundColor: store.theme_color || '#6366f1' }}
                  >
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 leading-tight">{store.name}</h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {store.follower_count} {store.follower_count === 1 ? 'suscriptor' : 'suscriptores'}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleUnfollow(store.id)}
                  disabled={unfollowingId === store.id}
                  className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                  title="Dejar de seguir"
                >
                  {unfollowingId === store.id ? <Loader2 className="animate-spin" size={18} /> : <UserMinus size={18} />}
                </button>
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                <Link 
                  href={`/tienda/${store.slug}`}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-900 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink size={14} /> Visitar Tienda
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
