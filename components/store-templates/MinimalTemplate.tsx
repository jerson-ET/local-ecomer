'use client'

import { useState, useEffect } from 'react'
import { Search, ShoppingBag, Heart, Plus, Star, ChevronRight, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ProductBottomSheet, { SheetProduct } from '@/components/ui/ProductBottomSheet'
import AIStoreAssistant from '@/components/features/store-assistant/AIStoreAssistant'
import { Monitor, Smartphone } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           TIPOS Y PROPS                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface RealStore {
  id: string
  name: string
  slug: string
  description: string | null
  theme_color: string | null
  banner_url: string | null
  whatsapp_number?: string | null
}

export interface RealProduct {
  id: string
  name: string
  description: string | null
  price: number
  discount_price?: number | null
  category_id: string | null
  images: { full: string; thumbnail: string; isMain: boolean }[] | unknown
  stock: number
  is_active: boolean
}

interface CartItem {
  product: RealProduct
  quantity: number
}

interface MinimalTemplateProps {
  store: RealStore
  products: RealProduct[]
  initialProductId?: string | undefined
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        COMPONENTE TEMPLATE                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function MinimalTemplate({ store, products }: MinimalTemplateProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [wishlist, setWishlist] = useState<string[]>([])

  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile')

  const [selectedSheetProduct, setSelectedSheetProduct] = useState<SheetProduct | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Extraer categorías únicas de los productos reales
  const dynamicCats = Array.from(
    new Set(products.map((p) => p.category_id || 'Otros').filter(Boolean))
  )
  const categories = ['Todos', ...dynamicCats]

  const filteredProducts =
    activeCategory === 'Todos'
      ? products
      : products.filter((p) => (p.category_id || 'Otros') === activeCategory)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.product.discount_price || item.product.price) * item.quantity,
    0
  )

  const handleOpenSheet = (p: RealProduct) => {
    let imagesArr: string[] = []
    if (Array.isArray(p.images)) {
      imagesArr = p.images.map((img) => img.full || img.thumbnail).filter(Boolean) as string[]
    }

    setSelectedSheetProduct({
      id: p.id,
      name: p.name,
      price: p.discount_price || p.price,
      originalPrice: p.price,
      discount: p.discount_price ? Math.round((1 - p.discount_price / p.price) * 100) : 0,
      image: getMainImage(p.images),
      images: imagesArr,
      storeName: store.name,
      storeColor: store.theme_color || undefined,
      category: p.category_id || '',
    })
    setIsSheetOpen(true)
  }

  // Effect to automatically open sheet if initialProductId is present
  useEffect(() => {
    if (store.id && products.length > 0 && typeof store === 'object') {
      const urlParams = new URLSearchParams(window.location.search)
      const paramId = urlParams.get('productId')
      if (paramId) {
        const prod = products.find((p) => p.id === paramId)
        if (prod) {
          handleOpenSheet(prod)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]) // Only run once or when products arrive

  const addToCart = (product: RealProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  // Helper para obtener imagen principal
  const getMainImage = (imgs: unknown) => {
    if (Array.isArray(imgs) && imgs.length > 0) {
      const main =
        imgs.find((i: { isMain?: boolean; full?: string; thumbnail?: string }) => i.isMain) ||
        imgs[0]
      return main.full || main.thumbnail || '/placeholder.png'
    }
    return '/placeholder.png'
  }

  // CSS Inyectado para personalizar el color
  const customStyle = {
    '--mn-accent': store.theme_color || '#111',
    '--mn-accent-rgb': (store.theme_color || '#111').replace('#', ''), // simplificado
  } as React.CSSProperties

  const handleCheckout = async () => {
    try {
      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }))

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          items,
          paymentMethod: 'cash_on_delivery',
          shippingAddress: 'Acordar por WhatsApp',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(
          data.error ||
            'Ocurrió un error al procesar tu pedido. Comprueba que tengas sesión iniciada.'
        )
        return
      }

      // Éxito: Crear mensaje preformateado para WhatsApp con el ID validado
      const orderId = data.order.id
      const orderText =
        `¡Hola! Acabo de registrar el pedido *#${orderId.slice(0, 8)}* en tu tienda virtual ${store.name}.\n\n` +
        `*Total facturado:* $${cartTotal.toLocaleString('es-CO')}\n` +
        `*Artículos:* ${cartCount}\n\n` +
        `Por favor indícame cómo proceder con el pago y envío. (Asistente IA guiando la venta)`

      setCart([])

      const targetPhone = store.whatsapp_number ? `57${store.whatsapp_number}` : '573000000000'
      window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(orderText)}`, '_blank')
    } catch {
      alert('Error de conexión. Intenta nuevamente.')
    }
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        background: '#eaeaea',
      }}
    >
      <div
        className="mn-store"
        style={{
          ...customStyle,
          width: '100%',
          maxWidth: viewMode === 'desktop' ? '1200px' : '480px',
          background: 'white',
          position: 'relative',
          boxShadow: viewMode === 'desktop' ? '0 0 40px rgba(0,0,0,0.1)' : 'none',
          transition: 'max-width 0.3s ease',
        }}
      >
        {/* ─────────── Header ─────────── */}
        <header className="mn-header">
          <div className="mn-header-left">
            <Link href="/tiendas" className="mn-icon-btn" title="Volver al Directorio">
              <ArrowLeft size={20} />
            </Link>
            <div className="mn-brand">{store.name.toUpperCase()}</div>
          </div>
          <div className="mn-header-right" style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                background: viewMode === 'mobile' ? 'black' : 'transparent',
                color: viewMode === 'mobile' ? 'white' : 'black',
                border: '1px solid black',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
              }}
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone size={16} />
            </button>
            <button
              style={{
                background: viewMode === 'desktop' ? 'black' : 'transparent',
                color: viewMode === 'desktop' ? 'white' : 'black',
                border: '1px solid black',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
              }}
              onClick={() => setViewMode('desktop')}
            >
              <Monitor size={16} />
            </button>

            <button className="mn-icon-btn">
              <Search size={20} />
            </button>
            <button className="mn-icon-btn">
              <User size={20} />
            </button>
          </div>
        </header>

        {/* ─────────── Hero Banner ─────────── */}
        <section className="mn-hero">
          <div
            className="mn-hero-badge"
            style={{ background: store.theme_color || '#111', color: '#fff' }}
          >
            ✦ BIENVENIDO A {store.name.toUpperCase()}
          </div>
          <h1>
            {store.name.split(' ')[0] || 'Nuestra'}{' '}
            <strong>{store.name.split(' ').slice(1).join(' ') || 'Colección'}</strong>
          </h1>
          <p className="mn-hero-subtitle">
            {store.description || 'Productos premium seleccionados para ti'}
          </p>
          <button className="mn-hero-btn" style={{ background: store.theme_color || '#111' }}>
            Explorar Colección
            <ChevronRight size={16} />
          </button>
        </section>

        {/* ─────────── Categories ─────────── */}
        {categories.length > 1 && (
          <section className="mn-section">
            <div className="mn-section-header">
              <h2 className="mn-section-title">Categorías</h2>
            </div>
            <div className="mn-categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`mn-category-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                  style={
                    activeCategory === cat
                      ? { background: store.theme_color || '#111', color: '#fff' }
                      : {}
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ─────────── Products ─────────── */}
        <section className="mn-section" style={{ paddingTop: categories.length > 1 ? 0 : '2rem' }}>
          <div className="mn-section-header">
            <h2 className="mn-section-title">
              {activeCategory === 'Todos' ? 'Todos los Productos' : activeCategory}
            </h2>
            <span className="mn-section-link">{filteredProducts.length} resultados</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
              <ShoppingBag size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
              <p>No hay productos disponibles por ahora.</p>
            </div>
          ) : (
            <div className="mn-products-grid">
              {filteredProducts.map((product) => {
                const isDiscounted =
                  product.discount_price && product.discount_price < product.price
                const finalPrice = product.discount_price || product.price

                return (
                  <div
                    key={product.id}
                    className="mn-product-card"
                    onClick={() => handleOpenSheet(product)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="mn-product-image">
                      <img src={getMainImage(product.images)} alt={product.name} loading="lazy" />
                      {isDiscounted && (
                        <span
                          className="mn-product-badge"
                          style={{ background: store.theme_color || '#e94560' }}
                        >
                          OFERTA
                        </span>
                      )}
                      <button
                        className={`mn-product-wishlist ${wishlist.includes(product.id) ? 'liked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleWishlist(product.id)
                        }}
                      >
                        <Heart
                          size={16}
                          fill={
                            wishlist.includes(product.id) ? store.theme_color || '#e94560' : 'none'
                          }
                          stroke={
                            wishlist.includes(product.id) ? store.theme_color || '#e94560' : '#111'
                          }
                        />
                      </button>
                    </div>
                    <div className="mn-product-info">
                      <h3 className="mn-product-name">{product.name}</h3>
                      <div className="mn-product-price-row">
                        <span className="mn-product-price">
                          ${finalPrice.toLocaleString('es-CO')}
                        </span>
                        {isDiscounted && (
                          <>
                            <span className="mn-product-original-price">
                              ${product.price.toLocaleString('es-CO')}
                            </span>
                            <span
                              className="mn-product-discount"
                              style={{ color: store.theme_color || '#e94560' }}
                            >
                              -{Math.round((1 - finalPrice / product.price) * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mn-product-footer">
                        <div className="mn-product-rating">
                          <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
                          <span>5.0 (N/A)</span>
                        </div>
                        <button
                          className="mn-add-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            addToCart(product)
                          }}
                          style={{ background: store.theme_color || '#111' }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ─────────── Featured Banner ─────────── */}
        {filteredProducts.length > 0 && (
          <section
            className="mn-featured-banner"
            style={{
              background: `linear-gradient(135deg, ${store.theme_color || '#111'}dd, ${store.theme_color || '#111'})`,
            }}
          >
            <div className="mn-featured-label" style={{ color: store.theme_color || '#111' }}>
              ✦ GARANTIZADO
            </div>
            <h3 className="mn-featured-title">Calidad {store.name}</h3>
            <p className="mn-featured-desc">
              Todos nuestros productos están respaldados por nuestra política de calidad.
            </p>
            <button className="mn-featured-btn" style={{ color: store.theme_color || '#111' }}>
              Ver Política
              <ChevronRight size={14} />
            </button>
          </section>
        )}

        {/* ─────────── Footer ─────────── */}
        <footer className="mn-footer">
          <div className="mn-footer-brand" style={{ color: store.theme_color || '#111' }}>
            {store.name.toUpperCase()}
          </div>
          <p>{store.description || 'La mejor tienda en LocalEcomer'}</p>
          <div className="mn-footer-links">
            <a href="#">Términos</a>
            <a href="#">Privacidad</a>
            <a href="#">Contacto</a>
            <a href="#">FAQ</a>
          </div>
        </footer>

        {/* Renderizamos el Bottom Sheet */}
        <ProductBottomSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          product={selectedSheetProduct}
        />

        <AIStoreAssistant
          store={store}
          products={products}
          cart={cart}
          onAddToCart={addToCart}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  )
}
