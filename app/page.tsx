/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                 MARKETPLACE - LOCAL ECOMER                                    */
/*                                                                              */
/*   Diseño basado en wireframe del usuario:                                    */
/*   - Tabs superiores: MarketPlace | Tiendas | Comunidad                       */
/*   - Barra de iconos de acceso rápido                                        */
/*   - Buscador                                                                 */
/*   - Banner de oferta destacada                                              */
/*   - Fila de productos (3 cols)                                              */
/*   - Filtros por categoría                                                   */
/*   - Grid de productos 2x2 con descuentos                                    */
/*   - Bottom nav: Login | Registro | Planes                                   */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  Zap,
  Star,
  Heart,
  Filter,
  X,
  Shirt,
  Smartphone,
  Gamepad2,
  Sofa,
  Dumbbell,
  Crown,
  Bike,
  Gem,
  Grid3X3,
  Tag,
  ArrowRight,
  Coffee,
  Footprints,
  Sparkles,
} from 'lucide-react'
import SwipeDeck from '@/components/features/swipe-shop/SwipeDeck'
import {
  type MarketplaceCategory,
  marketplaceCategories,
  getMarketplaceProducts,
  formatCOP,
} from '@/lib/store/marketplace'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                         ICONOS POR CATEGORÍA                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

const categoryIcons: Record<string, React.ReactNode> = {
  Todos: <Grid3X3 size={16} />,
  Moda: <Shirt size={16} />,
  Tecnología: <Smartphone size={16} />,
  Calzado: <Footprints size={16} />,
  Gaming: <Gamepad2 size={16} />,
  Hogar: <Sofa size={16} />,
  Deportes: <Dumbbell size={16} />,
  Belleza: <Sparkles size={16} />,
  Accesorios: <Crown size={16} />,
  Alimentos: <Coffee size={16} />,
  Motos: <Bike size={16} />,
  Joyería: <Gem size={16} />,
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                        COMPONENTE PRINCIPAL                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory>('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set())
  const [swipeOpen, setSwipeOpen] = useState(false)

  const [dbProducts, setDbProducts] = useState<typeof getMarketplaceProducts extends () => infer R ? R : any>([])

  useEffect(() => {
    async function fetchDb() {
      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select(`*, stores(name, slug, theme_color, banner_url)`)
        .eq('is_active', true)

      if (data) {
        const mapped = data.map((p: any) => {
          let templateId = 'minimal'
          try {
            const b = JSON.parse(p.stores?.banner_url || '{}')
            if (b.templateId) templateId = b.templateId
          } catch (e) { }

          let img = '/placeholder.png'
          if (Array.isArray(p.images) && p.images.length > 0) {
            const main = p.images.find((i: any) => i.isMain) || p.images[0]
            img = main.full || main.thumbnail || img
          }

          const original = p.price
          const currPrice = p.discount_price || p.price
          const discountPc = p.discount_price ? Math.round((1 - (currPrice / original)) * 100) : 0

          const baseObj = {
            id: p.id,
            name: p.name,
            price: currPrice,
            originalPrice: original,
            discount: discountPc,
            image: img,
            category: p.category_id || 'Otros',
            rating: 5.0,
            reviews: 'Nuevo',
            storeName: p.stores?.name || 'Tienda',
            storeUrl: `/tienda/${p.stores?.slug}`, // Ruta dinámica
            storeTemplate: templateId,
            storeColor: p.stores?.theme_color || '#6366f1'
          }

          return discountPc > 0 ? { ...baseObj, badge: 'OFERTA' } : baseObj
        })
        setDbProducts(mapped)
      }
    }
    fetchDb()
  }, [])

  // Combinar los productos DB con los mock
  const [allProducts, setAllProducts] = useState<any[]>([])

  useEffect(() => {
    // Para que el UI se vea vivo, combinamos DB (prioridad) + Demo
    const dummy = getMarketplaceProducts('Todos')
    setAllProducts([...dbProducts, ...dummy])
  }, [dbProducts])

  // Productos filtrados
  const products = useMemo(() => {
    let list = allProducts
    if (selectedCategory !== 'Todos') {
      list = list.filter(p => p.category === selectedCategory || (p.category === 'Otros'))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.storeName.toLowerCase().includes(q))
    }
    return list
  }, [allProducts, selectedCategory, searchQuery])

  // Flash deals (top descuentos) incluyendo ambas fuentes
  const flashDeals = useMemo(() => {
    return [...allProducts].sort((a, b) => b.discount - a.discount).slice(0, 6)
  }, [allProducts])

  // Producto destacado para el banner
  const featuredProduct = flashDeals[0]

  const toggleLike = (productId: string) => {
    setLikedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  return (
    <div className="mp-app">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*                     BARRA DE BÚSQUEDA                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="mp-search-wrap">
        <div className="mp-search">
          <Search size={18} className="mp-search__icon" />
          <input
            type="text"
            placeholder="Buscador de productos, tiendas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mp-search__input"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`mp-search__filter ${showFilters ? 'mp-search__filter--active' : ''}`}
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      <main className="mp-main">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*           BANNER DE OFERTA DESTACADA                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {!searchQuery && featuredProduct && (
          <section className="mp-featured">
            <div className="mp-featured__banner">
              {/* Lado izquierdo: Info del producto */}
              <div className="mp-featured__info">
                <div className="mp-featured__label">
                  <Zap size={12} />
                  <span>Oferta Destacada</span>
                </div>
                <div className="mp-featured__image-main">
                  <img
                    src={featuredProduct.image}
                    alt={featuredProduct.name}
                    className="mp-featured__img"
                  />
                </div>
                <h3 className="mp-featured__name">{featuredProduct.name}</h3>
                <div className="mp-featured__pricing">
                  <span className="mp-featured__price">{formatCOP(featuredProduct.price)}</span>
                  <span className="mp-featured__discount">-{featuredProduct.discount}%</span>
                </div>
                <Link
                  href={`${featuredProduct.storeUrl}?product=${featuredProduct.id}`}
                  className="mp-featured__cta"
                >
                  Obtener
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Lado derecho: Thumbnails de otros productos */}
              <div className="mp-featured__thumbs">
                {flashDeals.slice(1, 4).map((deal) => (
                  <Link
                    key={deal.id}
                    href={`${deal.storeUrl}?product=${deal.id}`}
                    className="mp-featured__thumb"
                  >
                    <img src={deal.image} alt={deal.name} />
                    <span className="mp-featured__thumb-price">{formatCOP(deal.price)}</span>
                    <span className="mp-featured__thumb-badge">-{deal.discount}%</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*                  SECCIÓN DE FILTROS                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="mp-filters">
          <div className="mp-section-header">
            <h3>
              <Filter size={16} /> Filtro
            </h3>
          </div>
          <div className="mp-filter-grid">
            {marketplaceCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`mp-filter-btn ${selectedCategory === cat ? 'mp-filter-btn--active' : ''}`}
              >
                {categoryIcons[cat]}
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*              GRID DE PRODUCTOS 2x2 CON DESCUENTOS             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="mp-grid-section">
          <div className="mp-section-header">
            <h3>
              <Tag size={16} /> {searchQuery ? 'Resultados' : 'Productos'}
            </h3>
            <span className="mp-count">{products.length} items</span>
          </div>

          {products.length === 0 ? (
            <div className="mp-empty">
              <Search size={32} />
              <h3>No se encontraron productos</h3>
              <p>Intenta con otra categoría o término</p>
            </div>
          ) : (
            <div className="mp-product-grid">
              {products.map((product) => (
                <Link
                  href={`${product.storeUrl}?product=${product.id}`}
                  key={product.id}
                  className="mp-card"
                >
                  <div className="mp-card__img-wrap">
                    <img src={product.image} alt={product.name} className="mp-card__img" />
                    {product.discount > 0 && (
                      <span className="mp-card__discount">{product.discount}%</span>
                    )}
                    <div
                      role="button"
                      onClick={(e) => {
                        e.preventDefault()
                        toggleLike(product.id)
                      }}
                      className="mp-card__like"
                    >
                      <Heart
                        size={14}
                        className={likedProducts.has(product.id) ? 'fill-current' : ''}
                      />
                    </div>
                  </div>
                  <div className="mp-card__body">
                    <p className="mp-card__store">{product.storeName}</p>
                    <h4 className="mp-card__name">{product.name}</h4>
                    <div className="mp-card__pricing">
                      <span className="mp-card__price">{formatCOP(product.price)}</span>
                      {product.discount > 0 && (
                        <span className="mp-card__original">
                          {formatCOP(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    <div className="mp-card__rating">
                      <Star size={10} fill="currentColor" />
                      <span>{product.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Swipe Shop Modal */}
      {swipeOpen && (
        <div className="mp-swipe-overlay">
          <button onClick={() => setSwipeOpen(false)} className="mp-swipe-close">
            <X size={28} />
          </button>
          <div className="mp-swipe-content">
            <div className="mp-swipe-header">
              <h2>SWIPE & SHOP</h2>
              <p>Desliza para descubrir ofertas locales</p>
            </div>
            <SwipeDeck />
          </div>
        </div>
      )}
    </div>
  )
}
