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

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Search,
  Zap,
  Star,
  TrendingUp,
  Store,
  Heart,
  Filter,
  X,
  Shirt,
  Smartphone,
  ShoppingBag,
  Gamepad2,
  Sofa,
  Dumbbell,
  Crown,
  Bike,
  Gem,
  Users,
  Grid3X3,
  Tag,
  CreditCard,
  LogIn,
  UserPlus,
  ChevronRight,
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
  getFlashDeals,
  searchMarketplace,
  formatCOP,
} from '@/lib/store/marketplace'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                         ICONOS POR CATEGORÍA                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

const categoryIcons: Record<string, React.ReactNode> = {
  'Todos': <Grid3X3 size={16} />,
  'Moda': <Shirt size={16} />,
  'Tecnología': <Smartphone size={16} />,
  'Calzado': <Footprints size={16} />,
  'Gaming': <Gamepad2 size={16} />,
  'Hogar': <Sofa size={16} />,
  'Deportes': <Dumbbell size={16} />,
  'Belleza': <Sparkles size={16} />,
  'Accesorios': <Crown size={16} />,
  'Alimentos': <Coffee size={16} />,
  'Motos': <Bike size={16} />,
  'Joyería': <Gem size={16} />,
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                     TABS DE NAVEGACIÓN SUPERIOR                              */
/* ─────────────────────────────────────────────────────────────────────────── */

type TopTab = 'marketplace' | 'tiendas' | 'comunidad'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                        COMPONENTE PRINCIPAL                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<TopTab>('marketplace')
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory>('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set())
  const [swipeOpen, setSwipeOpen] = useState(false)
  const carouselTrackRef = useRef<HTMLDivElement>(null)

  // Productos filtrados
  const products = useMemo(() => {
    if (searchQuery.trim()) return searchMarketplace(searchQuery)
    return getMarketplaceProducts(selectedCategory)
  }, [selectedCategory, searchQuery])

  // Flash deals (top descuentos)
  const flashDeals = useMemo(() => getFlashDeals(6), [])

  // Producto destacado para el banner
  const featuredProduct = flashDeals[0]

  // All products for carousel — duplicated for infinite loop
  const carouselProducts = useMemo(() => getMarketplaceProducts('Todos'), [])
  const carouselLoop = useMemo(() => [...carouselProducts, ...carouselProducts], [carouselProducts])

  // Continuous scroll animation with U-curve path
  useEffect(() => {
    const track = carouselTrackRef.current
    if (!track || carouselProducts.length === 0) return

    let offset = 0
    let animId: number
    const SPEED = 0.45
    const CARD_W = 108
    const GAP = 10
    const STEP = CARD_W + GAP
    const N = carouselProducts.length
    const LOOP_W = N * STEP
    const MAX_DIP = 22

    const animate = () => {
      offset += SPEED
      if (offset >= LOOP_W) offset -= LOOP_W

      const containerW = track.parentElement?.offsetWidth || 370
      const centerX = containerW / 2
      const cards = track.children

      for (let i = 0; i < cards.length; i++) {
        const el = cards[i] as HTMLElement
        let x = i * STEP - offset

        // Wrap cards for seamless infinite loop
        if (x < -CARD_W - 10) x += LOOP_W * 2
        if (x > containerW + CARD_W + LOOP_W) x -= LOOP_W * 2

        // U-curve: center dips DOWN, sides stay UP
        const cardCenter = x + CARD_W / 2
        const norm = (cardCenter - centerX) / (centerX + CARD_W / 2)
        const clamped = Math.max(-1, Math.min(1, norm))
        const yOffset = MAX_DIP * (1 - clamped * clamped)

        el.style.transform = `translate3d(${x}px, ${yOffset}px, 0)`
        el.style.opacity = (x > -CARD_W && x < containerW + 10) ? '1' : '0'
      }

      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [carouselProducts.length])

  const toggleLike = (productId: string) => {
    setLikedProducts(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  return (
    <div className="mp-app">

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*     TABS SUPERIORES - MarketPlace | Tiendas | Comunidad       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <header className="mp-header">
        <nav className="mp-top-tabs">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`mp-tab ${activeTab === 'marketplace' ? 'mp-tab--active' : ''}`}
          >
            <Store size={16} />
            <span>MarketPlace</span>
          </button>
          <Link href="/dashboard" className={`mp-tab ${activeTab === 'tiendas' ? 'mp-tab--active' : ''}`}>
            <ShoppingBag size={16} />
            <span>Tiendas</span>
          </Link>
          <Link href="/community" className={`mp-tab ${activeTab === 'comunidad' ? 'mp-tab--active' : ''}`}>
            <Users size={16} />
            <span>Comunidad</span>
          </Link>
        </nav>

        {/* Botones derecha: Login | Registro | Planes */}
        <div className="mp-header-actions">
          <Link href="/dashboard" className="mp-action-btn">
            <LogIn size={14} />
            <span>Login</span>
          </Link>
          <Link href="/dashboard" className="mp-action-btn mp-action-btn--accent">
            <UserPlus size={14} />
            <span>Registro</span>
          </Link>
          <button className="mp-action-btn">
            <CreditCard size={14} />
            <span>Planes</span>
          </button>
        </div>
      </header>


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
        {/*         CARRUSEL CONTINUO CON CURVA U (conveyor belt)          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {!searchQuery && carouselLoop.length > 0 && (
          <section className="mp-row-section">
            <div className="mp-section-header">
              <h3><TrendingUp size={16} /> Tendencias</h3>
              <button className="mp-see-all">Ver todo <ChevronRight size={14} /></button>
            </div>
            <div className="mp-carousel">
              <div className="mp-carousel__track" ref={carouselTrackRef}>
                {carouselLoop.map((product, i) => (
                  <Link
                    href={`${product.storeUrl}?product=${product.id}`}
                    key={`cl-${i}`}
                    className="mp-carousel__card"
                  >
                    <div className="mp-carousel__img">
                      <img src={product.image} alt={product.name} />
                      {product.discount > 0 && (
                        <span className="mp-carousel__badge">-{product.discount}%</span>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); toggleLike(product.id); }}
                        className="mp-carousel__heart"
                      >
                        <Heart size={12} className={likedProducts.has(product.id) ? 'fill-current' : ''} />
                      </button>
                    </div>
                    <div className="mp-carousel__info">
                      <p className="mp-carousel__store">{product.storeName}</p>
                      <h4 className="mp-carousel__name">{product.name}</h4>
                      <span className="mp-carousel__price">{formatCOP(product.price)}</span>
                    </div>
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
            <h3><Filter size={16} /> Filtro</h3>
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
            <h3><Tag size={16} /> {searchQuery ? 'Resultados' : 'Productos'}</h3>
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
                    <img
                      src={product.image}
                      alt={product.name}
                      className="mp-card__img"
                    />
                    {product.discount > 0 && (
                      <span className="mp-card__discount">{product.discount}%</span>
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); toggleLike(product.id); }}
                      className="mp-card__like"
                    >
                      <Heart size={14} className={likedProducts.has(product.id) ? 'fill-current' : ''} />
                    </button>
                  </div>
                  <div className="mp-card__body">
                    <p className="mp-card__store">{product.storeName}</p>
                    <h4 className="mp-card__name">{product.name}</h4>
                    <div className="mp-card__pricing">
                      <span className="mp-card__price">{formatCOP(product.price)}</span>
                      {product.discount > 0 && (
                        <span className="mp-card__original">{formatCOP(product.originalPrice)}</span>
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
          <button
            onClick={() => setSwipeOpen(false)}
            className="mp-swipe-close"
          >
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
