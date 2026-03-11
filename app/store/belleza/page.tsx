'use client'

import { useState } from 'react'
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Heart,
  ShoppingCart,
  User,
  Star,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

interface BeautyProduct {
  id: string
  name: string
  category: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  isNew?: boolean
  isBest?: boolean
}

const PRODUCTS: BeautyProduct[] = [
  {
    id: '1',
    name: 'Sérum Vitamina C Radiance',
    category: 'Skincare',
    price: 89000,
    originalPrice: 120000,
    image:
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: 342,
    isBest: true,
  },
  {
    id: '2',
    name: 'Paleta Sombras Sunset',
    category: 'Maquillaje',
    price: 135000,
    image:
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: 189,
    isNew: true,
  },
  {
    id: '3',
    name: 'Crema Hidratante Rose',
    category: 'Skincare',
    price: 68000,
    originalPrice: 85000,
    image:
      'https://images.unsplash.com/photo-1611930022073-b7a4ba5fbbe6?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviews: 256,
  },
  {
    id: '4',
    name: 'Labial Matte Velvet',
    category: 'Labiales',
    price: 45000,
    image:
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    reviews: 412,
    isNew: true,
  },
  {
    id: '5',
    name: 'Perfume Floral Nocturne',
    category: 'Fragancias',
    price: 250000,
    originalPrice: 310000,
    image:
      'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: 134,
    isBest: true,
  },
  {
    id: '6',
    name: 'Set Brochas Pro 12pcs',
    category: 'Accesorios',
    price: 95000,
    image:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80',
    rating: 4.5,
    reviews: 78,
  },
]

export default function BellezaPage() {
  const [cartOpen, setCartOpen] = useState(false)
  const [filter, setFilter] = useState('Todos')
  const [cart, setCart] = useState<{ item: BeautyProduct; qty: number }[]>([])
  const [liked, setLiked] = useState<string[]>([])

  const filtered = filter === 'Todos' ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter)
  const fmt = (p: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(p)

  const addToCart = (product: BeautyProduct) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.item.id === product.id)
      if (ex) return prev.map((i) => (i.item.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { item: product, qty: 1 }]
    })
  }

  const toggleLike = (id: string) => {
    setLiked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const totalItems = cart.reduce((s, c) => s + c.qty, 0)
  const totalPrice = cart.reduce((s, c) => s + c.item.price * c.qty, 0)

  return (
    <div className="beauty-store">
      {/* Header */}
      <div className="bg-header">
        <button className="bg-icon-btn">
          <Menu size={22} />
        </button>
        <Link href="/tiendas" className="no-underline">
          <div className="bg-logo">
            Beauty <span>Glow</span>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="bg-icon-btn">
            <Search size={20} />
          </button>
          <button className="bg-icon-btn" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  background: 'var(--bg-gradient-rose)',
                  borderRadius: '50%',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-hero">
        <span className="bg-hero-tag">✨ NUEVA COLECCIÓN</span>
        <h1>
          Descubre tu <span>Brillo</span>
        </h1>
        <p className="bg-hero-subtitle">
          Cosméticos premium y skincare para que brilles con luz propia.
        </p>
        <img
          src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80"
          alt="Beauty Products"
          className="bg-hero-img"
        />
      </div>

      {/* Promo Strip */}
      <div className="bg-promo-strip">
        <div className="bg-promo-item">
          <span className="bg-promo-icon">🚚</span>
          <span className="bg-promo-label">Envío Gratis</span>
        </div>
        <div
          className="bg-promo-item"
          style={{
            borderLeft: '1px solid var(--bg-border)',
            borderRight: '1px solid var(--bg-border)',
          }}
        >
          <span className="bg-promo-icon">🌿</span>
          <span className="bg-promo-label">Cruelty Free</span>
        </div>
        <div className="bg-promo-item">
          <span className="bg-promo-icon">💎</span>
          <span className="bg-promo-label">Premium</span>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-cats">
        {['Todos', 'Skincare', 'Maquillaje', 'Labiales', 'Fragancias', 'Accesorios'].map((cat) => (
          <div
            key={cat}
            className={`bg-cat-chip ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </div>
        ))}
      </div>

      {/* Section Header */}
      <div className="bg-section-header">
        <span className="bg-section-title">Más Populares</span>
        <span className="bg-section-link">Ver todo →</span>
      </div>

      {/* Grid */}
      <div className="bg-grid">
        {filtered.map((product) => (
          <div key={product.id} className="bg-prod">
            <div className="bg-prod-img-wrap">
              <img src={product.image} className="bg-prod-img" alt={product.name} />
              {product.isNew && <span className="bg-prod-badge bg-badge-new">Nuevo</span>}
              {product.isBest && <span className="bg-prod-badge bg-badge-best">⭐ Best</span>}
              <button
                className={`bg-prod-fav ${liked.includes(product.id) ? 'liked' : ''}`}
                onClick={() => toggleLike(product.id)}
              >
                <Heart size={14} fill={liked.includes(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="bg-prod-info">
              <div className="bg-prod-category">{product.category}</div>
              <div className="bg-prod-name">{product.name}</div>
              <div className="bg-prod-rating">
                <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
                <span>
                  {product.rating} ({product.reviews})
                </span>
              </div>
              <div className="bg-prod-bottom">
                <div>
                  <span className="bg-prod-price">{fmt(product.price)}</span>
                  {product.originalPrice && (
                    <span className="bg-prod-original">{fmt(product.originalPrice)}</span>
                  )}
                </div>
                <button className="bg-add-btn" onClick={() => addToCart(product)}>
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Beauty Tip Banner */}
      <div className="bg-tip-banner">
        <div className="bg-tip-content">
          <h2>Rutina de Noche</h2>
          <p>Descubre los 5 pasos esenciales para una piel radiante al despertar.</p>
          <button className="bg-tip-btn">
            <Sparkles size={14} style={{ marginRight: 6 }} />
            Descubrir
          </button>
        </div>
        <span className="bg-tip-emoji">🌙</span>
      </div>

      {/* Bottom Nav */}
      <div className="bg-nav">
        <button className="bg-nav-item active">
          <Sparkles size={20} />
          <span>Inicio</span>
        </button>
        <button className="bg-nav-item">
          <Search size={20} />
          <span>Buscar</span>
        </button>
        <button className="bg-nav-item" onClick={() => setCartOpen(true)}>
          <ShoppingCart size={20} />
          <span>Carrito</span>
        </button>
        <button className="bg-nav-item">
          <User size={20} />
          <span>Perfil</span>
        </button>
      </div>

      {/* Cart Modal */}
      {cartOpen && (
        <div className="bg-cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="bg-cart-box" onClick={(e) => e.stopPropagation()}>
            <div className="bg-cart-header">
              <h2>Mi Bolsa ✨</h2>
              <button className="bg-cart-close" onClick={() => setCartOpen(false)}>
                <X size={18} />
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="bg-cart-empty">
                <ShoppingBag
                  size={48}
                  style={{ marginBottom: 12, opacity: 0.3, color: 'var(--bg-rose)' }}
                />
                <p>Tu bolsa está vacía</p>
              </div>
            ) : (
              <>
                {cart.map((c, i) => (
                  <div key={i} className="bg-cart-item">
                    <img src={c.item.image} alt="" />
                    <div style={{ flex: 1 }}>
                      <div className="bg-cart-item-name">{c.item.name}</div>
                      <div className="bg-cart-item-price">{fmt(c.item.price * c.qty)}</div>
                      <div className="bg-cart-item-qty">x{c.qty}</div>
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderTop: '1px solid var(--bg-border)',
                    marginTop: 10,
                  }}
                >
                  <span style={{ color: 'var(--bg-muted)', fontSize: 14 }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--bg-dark)' }}>
                    {fmt(totalPrice)}
                  </span>
                </div>
                <button className="bg-checkout-btn">Proceder al Pago</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
