'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Search, Star, ShoppingBag, Store, MapPin, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ─────── Tipos ─────── */

interface RealStore {
  id: string
  name: string
  slug: string
  theme_color: string
  description?: string
  is_active: boolean
  created_at: string
  product_count: number
  banner_url?: string
}

/* ─────── Componente Principal ─────── */

export default function TiendasPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [stores, setStores] = useState<RealStore[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  /* Cargar tiendas reales de Supabase */
  useEffect(() => {
    async function fetchStores() {
      setLoading(true)

      // Obtener todas las tiendas activas
      const { data: storesData, error } = await supabase
        .from('stores')
        .select('id, name, slug, theme_color, description, is_active, created_at, banner_url')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando tiendas:', error)
        setLoading(false)
        return
      }

      if (!storesData || storesData.length === 0) {
        setStores([])
        setLoading(false)
        return
      }

      // Contar productos por tienda
      const storeIds = storesData.map((s) => s.id)
      const { data: products } = await supabase
        .from('products')
        .select('store_id')
        .in('store_id', storeIds)
        .eq('is_active', true)

      const productCounts: Record<string, number> = {}
      for (const p of products || []) {
        productCounts[p.store_id] = (productCounts[p.store_id] || 0) + 1
      }

      const mapped: RealStore[] = storesData.map((s) => ({
        ...s,
        product_count: productCounts[s.id] || 0,
      }))

      setStores(mapped)
      setLoading(false)
    }

    fetchStores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Filtro de búsqueda */
  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores
    const q = searchQuery.toLowerCase()
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q)
    )
  }, [stores, searchQuery])

  return (
    <div className="tiendas-page">
      {/* ── Header ── */}
      <div className="tiendas-header">
        <div className="tiendas-header__title">
          <Store size={22} />
          <div>
            <h1>Tiendas</h1>
            <p>{stores.length} tiendas disponibles</p>
          </div>
        </div>
      </div>

      {/* ── Búsqueda ── */}
      <div className="tiendas-search-wrap">
        <div className="tiendas-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar tiendas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Lista de Tiendas ── */}
      <div className={loading || filteredStores.length === 0 ? "px-6 pb-12" : "grid grid-cols-2 lg:grid-cols-5 gap-1 px-1 pb-16"}>
        {loading ? (
          <div className="tiendas-empty">
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid #e5e7eb',
                borderTopColor: '#007AFF',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <h3>Cargando tiendas...</h3>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="tiendas-empty">
            <Store size={48} />
            <h3>
              {stores.length === 0 ? 'Aún no hay tiendas creadas' : 'No se encontraron tiendas'}
            </h3>
            <p>
              {stores.length === 0
                ? 'Sé el primero en crear tu tienda en LocalEcomer'
                : 'Intenta con otro término de búsqueda'}
            </p>
          </div>
        ) : (
          filteredStores.map((store) => {
            let displayBanner: string | null = null
            let storeLocation: string | null = null
            try {
              if (store.banner_url && store.banner_url.startsWith('{')) {
                const config = JSON.parse(store.banner_url)
                storeLocation = config.shippingLocation || config.location || null
                
                if (config.customUrls && config.customUrls.length > 0) {
                  displayBanner = config.customUrls[0]
                } else if (config.customUrl) {
                  displayBanner = config.customUrl
                } else if (config.bannerUrls && config.bannerUrls.length > 0) {
                  displayBanner = config.bannerUrls[0]
                } else if (config.bannerUrl) {
                  displayBanner = config.bannerUrl
                }
              } else if (store.banner_url && typeof store.banner_url === 'string') {
                displayBanner = store.banner_url
              }
            } catch (e) {
              if (typeof store.banner_url === 'string' && !store.banner_url.startsWith('{')) {
                displayBanner = store.banner_url
              }
            }

            return (
              <Link key={store.id} href={`/tienda/${store.slug}`}>
                <div className="w-full flex flex-col overflow-hidden group bg-slate-100 cursor-pointer rounded-2xl shadow-sm border border-slate-200/50 transition-all duration-300 hover:shadow-md hover:border-slate-300">
                  {/* Banner Image / Avatar Container */}
                  <div className="w-full aspect-square relative overflow-hidden bg-slate-100">
                    {displayBanner ? (
                      <img 
                        src={displayBanner} 
                        alt={store.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        draggable={false}
                        loading="lazy"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500"
                        style={{
                          background: `linear-gradient(135deg, ${store.theme_color || '#6366f1'}, ${store.theme_color || '#6366f1'}cc)`
                        }}
                      >
                        <Store size={48} className="text-white/80" />
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                      <span className="bg-white/95 text-[#0a1d37] font-black px-4 py-2 rounded-full transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 shadow-lg text-xs backdrop-blur-sm">
                        Ver tienda
                      </span>
                    </div>

                    {/* Store name overlay top */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span
                        className="font-black leading-none text-base sm:text-lg"
                        style={{
                          color: '#ffffff',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                      >
                        {store.name}
                      </span>
                    </div>
                  </div>

                  {/* Store Details bottom bar */}
                  <div 
                    className="w-full py-0.5 px-3 bg-white text-slate-900 flex items-center justify-between gap-2 border-t border-slate-200/80"
                  >
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1 flex-1 mb-0 leading-none py-1.5">
                      {storeLocation || store.description || 'Tienda Local'}
                    </h3>
                    <span className="text-slate-900 font-black text-xs sm:text-sm shrink-0 leading-none py-1.5 bg-slate-100 px-2 rounded-full">
                      {store.product_count} {store.product_count === 1 ? 'prod' : 'prods'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* ── Aviso para vendedores ── */}
      <Link
        href="/"
        className="tiendas-seller-cta"
        style={{ textDecoration: 'none', cursor: 'pointer' }}
      >
        <MapPin size={20} />
        <div>
          <strong>¿Tienes un negocio local?</strong>
          <p>Toca aquí para ver las opciones y crear tu cuenta</p>
        </div>
      </Link>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
