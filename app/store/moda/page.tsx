'use client'

import { useState } from 'react'
import {
  Search,
  ShoppingBag,
  Heart,
  Plus,
  X,
  Minus,
  Trash2,
  Star,
  ChevronRight,
  User,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           TIPOS                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  category: string
  image: string
  rating: number
  reviews: number
  badge?: string
}

interface CartItem {
  product: Product
  quantity: number
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           DATOS DE PRODUCTOS                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

const products: Product[] = [
  {
    id: 'mn-1',
    name: 'Reloj Sovereign Chronograph',
    price: 2500,
    originalPrice: 3200,
    category: 'Relojes',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600',
    rating: 4.9,
    reviews: 312,
    badge: 'BESTSELLER',
  },
  {
    id: 'mn-2',
    name: 'Gafas Celestial Gold',
    price: 450,
    category: 'Accesorios',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600',
    rating: 4.7,
    reviews: 189,
    badge: 'NEW',
  },
  {
    id: 'mn-3',
    name: 'Bolso Leather Artisan',
    price: 890,
    originalPrice: 1200,
    category: 'Bolsos',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
    rating: 4.8,
    reviews: 256,
  },
  {
    id: 'mn-4',
    name: 'Perfume Noir Essence',
    price: 180,
    category: 'Fragancias',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600',
    rating: 4.6,
    reviews: 420,
    badge: 'POPULAR',
  },
  {
    id: 'mn-5',
    name: 'Pulsera Diamond Chain',
    price: 750,
    originalPrice: 950,
    category: 'Joyería',
    image: 'https://images.unsplash.com/photo-1515562141589-67f0d0d6e6af?w=600',
    rating: 4.9,
    reviews: 98,
  },
  {
    id: 'mn-6',
    name: 'Billetera Premium Slim',
    price: 120,
    category: 'Accesorios',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600',
    rating: 4.5,
    reviews: 534,
    badge: 'SALE',
  },
  {
    id: 'mn-7',
    name: 'Cinturón Italian Leather',
    price: 195,
    originalPrice: 280,
    category: 'Accesorios',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',
    rating: 4.7,
    reviews: 167,
  },
  {
    id: 'mn-8',
    name: 'Gemelos Royal Onyx',
    price: 340,
    category: 'Joyería',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600',
    rating: 4.8,
    reviews: 73,
    badge: 'EXCLUSIVE',
  },
]

const categories = ['Todos', 'Relojes', 'Accesorios', 'Bolsos', 'Joyería', 'Fragancias']

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        COMPONENTE PRINCIPAL                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ModaStorePage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [wishlist, setWishlist] = useState<string[]>([])

  const filteredProducts =
    activeCategory === 'Todos' ? products : products.filter((p) => p.category === activeCategory)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const addToCart = (product: Product) => {
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

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  return (
    <div className="mn-store">
      {/* ─────────── Header ─────────── */}
      <header className="mn-header">
        <div className="mn-header-left">
          <Link href="/tiendas" className="mn-icon-btn" title="Volver a Tiendas">
            <ArrowLeft size={20} />
          </Link>
          <div className="mn-brand">
            ÉLITE<span className="mn-brand-accent">.</span>
          </div>
        </div>
        <div className="mn-header-right">
          <button className="mn-icon-btn">
            <Search size={20} />
          </button>
          <button className="mn-icon-btn">
            <User size={20} />
          </button>
          <button className="mn-icon-btn" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="mn-cart-count">{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* ─────────── Hero Banner ─────────── */}
      <section className="mn-hero">
        <div className="mn-hero-badge">✦ COLECCIÓN EXCLUSIVA</div>
        <h1>
          Elegancia
          <strong>Atemporal</strong>
        </h1>
        <p className="mn-hero-subtitle">Productos premium seleccionados para ti</p>
        <button className="mn-hero-btn">
          Explorar Colección
          <ChevronRight size={16} />
        </button>
      </section>

      {/* ─────────── Categories ─────────── */}
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
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ─────────── Products ─────────── */}
      <section className="mn-section" style={{ paddingTop: 0 }}>
        <div className="mn-section-header">
          <h2 className="mn-section-title">
            {activeCategory === 'Todos' ? 'Todos los Productos' : activeCategory}
          </h2>
          <button className="mn-section-link">
            Ver todo <ChevronRight size={14} />
          </button>
        </div>
        <div className="mn-products-grid">
          {filteredProducts.map((product) => (
            <div key={product.id} className="mn-product-card">
              <div className="mn-product-image">
                <img src={product.image} alt={product.name} loading="lazy" />
                {product.badge && <span className="mn-product-badge">{product.badge}</span>}
                <button
                  className={`mn-product-wishlist ${wishlist.includes(product.id) ? 'liked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleWishlist(product.id)
                  }}
                >
                  <Heart size={16} fill={wishlist.includes(product.id) ? '#e94560' : 'none'} />
                </button>
              </div>
              <div className="mn-product-info">
                <h3 className="mn-product-name">{product.name}</h3>
                <div className="mn-product-price-row">
                  <span className="mn-product-price">${product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <>
                      <span className="mn-product-original-price">
                        ${product.originalPrice.toLocaleString()}
                      </span>
                      <span className="mn-product-discount">
                        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>
                <div className="mn-product-footer">
                  <div className="mn-product-rating">
                    <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
                    <span>
                      {product.rating} ({product.reviews})
                    </span>
                  </div>
                  <button
                    className="mn-add-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      addToCart(product)
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── Featured Banner ─────────── */}
      <section className="mn-featured-banner">
        <div className="mn-featured-label">✦ EXCLUSIVO</div>
        <h3 className="mn-featured-title">Colección VIP</h3>
        <p className="mn-featured-desc">Accede a productos exclusivos solo para miembros premium</p>
        <button className="mn-featured-btn">
          Explorar VIP
          <ChevronRight size={14} />
        </button>
      </section>

      {/* ─────────── Footer ─────────── */}
      <footer className="mn-footer">
        <div className="mn-footer-brand">ÉLITE BOUTIQUE</div>
        <p>Productos premium seleccionados con cuidado</p>
        <div className="mn-footer-links">
          <a href="#">Términos</a>
          <a href="#">Privacidad</a>
          <a href="#">Contacto</a>
          <a href="#">FAQ</a>
        </div>
      </footer>

      {/* ─────────── Cart Sidebar ─────────── */}
      {cartOpen && (
        <>
          <div className="mn-cart-overlay" onClick={() => setCartOpen(false)} />
          <div className="mn-cart-sidebar">
            <div className="mn-cart-header">
              <h2>Carrito ({cartCount})</h2>
              <button className="mn-cart-close" onClick={() => setCartOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="mn-cart-empty">
                <div className="mn-cart-empty-icon">
                  <ShoppingBag size={32} />
                </div>
                <h3>Tu carrito está vacío</h3>
                <p>Explora nuestra colección premium</p>
              </div>
            ) : (
              <>
                <div className="mn-cart-items">
                  {cart.map((item) => (
                    <div key={item.product.id} className="mn-cart-item">
                      <div className="mn-cart-item-image">
                        <img src={item.product.image} alt={item.product.name} />
                      </div>
                      <div className="mn-cart-item-info">
                        <div className="mn-cart-item-name">{item.product.name}</div>
                        <div className="mn-cart-item-price">
                          ${(item.product.price * item.quantity).toLocaleString()}
                        </div>
                        <div className="mn-cart-qty">
                          <button
                            className="mn-qty-btn"
                            onClick={() => updateQty(item.product.id, -1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            className="mn-qty-btn"
                            onClick={() => updateQty(item.product.id, 1)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <button
                        className="mn-cart-remove"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mn-cart-footer">
                  <div className="mn-cart-total">
                    <span className="mn-cart-total-label">Total</span>
                    <span className="mn-cart-total-value">${cartTotal.toLocaleString()}</span>
                  </div>
                  <button className="mn-checkout-btn">Proceder al Pago</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
