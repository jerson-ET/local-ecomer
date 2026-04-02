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
      <div className="tiendas-list">
        {loading ? (
          <div className="tiendas-empty">
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid #e5e7eb',
                borderTopColor: '#FF5A26',
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
              <Link key={store.id} href={`/tienda/${store.slug}`} className="tienda-card">
                {/* Banner de tienda */}
                <div
                  className="tienda-card__banner"
                  style={{
                    background: displayBanner 
                      ? `url(${displayBanner}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${store.theme_color || '#6366f1'}, ${store.theme_color || '#6366f1'}cc)`,
                  }}
                >
                  {!displayBanner && (
                    <div className="tienda-card__avatar">
                      <Store size={22} />
                    </div>
                  )}
                  <div className="tienda-card__badge">
                    <Star size={10} fill="currentColor" />
                    <span>Nuevo</span>
                  </div>
                </div>

                {/* Info */}
                <div className="tienda-card__info">
                  <h3 className="tienda-card__name">{store.name}</h3>
                  <p className="tienda-card__desc">{store.description || 'Tienda en LocalEcomer'}</p>
                  <div className="tienda-card__meta">
                    <span className="tienda-card__count">
                      <Package size={12} />
                      {store.product_count} productos
                    </span>
                    {storeLocation && (
                      <span className="tienda-card__count">
                        <MapPin size={12} />
                        {storeLocation}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="tienda-card__cta">
                  <ShoppingBag size={14} />
                  <span>Ver Tienda</span>
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
