'use client'

import { useState } from 'react'
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Gamepad2,
  ShoppingCart,
  User,
  Heart,
  Zap,
  Trophy,
} from 'lucide-react'
import Link from 'next/link'

interface GameProduct {
  id: string
  name: string
  platform: string
  price: number
  originalPrice?: number
  image: string
  category: string
  isNew?: boolean
  isSale?: boolean
}

const GAMES: GameProduct[] = [
  {
    id: '1',
    name: 'PS5 DualSense Edge',
    platform: 'PlayStation',
    price: 850000,
    originalPrice: 950000,
    image:
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=600&q=80',
    category: 'Controles',
    isNew: true,
  },
  {
    id: '2',
    name: 'Razer Huntsman V3',
    platform: 'PC Gaming',
    price: 620000,
    image:
      'https://images.unsplash.com/photo-1541140532154-b024d1c5748e?auto=format&fit=crop&w=600&q=80',
    category: 'Teclados',
    isNew: true,
  },
  {
    id: '3',
    name: 'HyperX Cloud Alpha',
    platform: 'Multiplataforma',
    price: 380000,
    originalPrice: 450000,
    image:
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=600&q=80',
    category: 'Auriculares',
    isSale: true,
  },
  {
    id: '4',
    name: 'Logitech G Pro X Superlight',
    platform: 'PC Gaming',
    price: 520000,
    image:
      'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=80',
    category: 'Mouse',
  },
  {
    id: '5',
    name: 'Nintendo Switch OLED',
    platform: 'Nintendo',
    price: 1450000,
    originalPrice: 1600000,
    image:
      'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=600&q=80',
    category: 'Consolas',
    isSale: true,
  },
  {
    id: '6',
    name: 'Gaming Chair Pro RGB',
    platform: 'Accesorios',
    price: 980000,
    image:
      'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=600&q=80',
    category: 'Sillas',
    isNew: true,
  },
]

export default function GamingPage() {
  const [cartOpen, setCartOpen] = useState(false)
  const [filter, setFilter] = useState('Todos')
  const [cart, setCart] = useState<{ item: GameProduct; qty: number }[]>([])
  const [liked, setLiked] = useState<string[]>([])

  const filtered = filter === 'Todos' ? GAMES : GAMES.filter((g) => g.category === filter)
  const fmt = (p: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(p)

  const addToCart = (game: GameProduct) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.item.id === game.id)
      if (ex) return prev.map((i) => (i.item.id === game.id ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { item: game, qty: 1 }]
    })
  }

  const toggleLike = (id: string) => {
    setLiked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const totalItems = cart.reduce((s, c) => s + c.qty, 0)
  const totalPrice = cart.reduce((s, c) => s + c.item.price * c.qty, 0)

  return (
    <div className="gaming-store">
      {/* Header */}
      <div className="gz-header">
        <button className="gz-icon-btn">
          <Menu size={22} />
        </button>
        <Link href="/tiendas" className="no-underline">
          <div className="gz-logo">GAMING ZONE</div>
        </Link>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="gz-icon-btn">
            <Search size={20} />
          </button>
          <button
            className="gz-icon-btn"
            onClick={() => setCartOpen(true)}
            style={{ position: 'relative' }}
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 16,
                  height: 16,
                  background: 'var(--gz-gradient)',
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
      <div className="gz-hero">
        <span className="gz-hero-tag">⚡ NUEVA TEMPORADA</span>
        <h1>
          LEVEL UP <span>YOUR GAME</span>
        </h1>
        <p className="gz-hero-subtitle">
          Los mejores periféricos y accesorios gaming al mejor precio.
        </p>
        <img
          src="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=600&q=80"
          alt="Gaming Setup"
          className="gz-hero-img"
        />
      </div>

      {/* Stats Bar */}
      <div className="gz-stats">
        <div className="gz-stat">
          <span className="gz-stat-number">2.5K</span>
          <span className="gz-stat-label">Productos</span>
        </div>
        <div
          className="gz-stat"
          style={{
            borderLeft: '1px solid var(--gz-border)',
            borderRight: '1px solid var(--gz-border)',
          }}
        >
          <span className="gz-stat-number">98%</span>
          <span className="gz-stat-label">Satisfacción</span>
        </div>
        <div className="gz-stat">
          <span className="gz-stat-number">24h</span>
          <span className="gz-stat-label">Envío</span>
        </div>
      </div>

      {/* Categories */}
      <div className="gz-cats">
        {['Todos', 'Consolas', 'Controles', 'Teclados', 'Auriculares', 'Mouse', 'Sillas'].map(
          (cat) => (
            <div
              key={cat}
              className={`gz-cat-chip ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </div>
          )
        )}
      </div>

      {/* Section Header */}
      <div className="gz-section-header">
        <span className="gz-section-title">🔥 Más Vendidos</span>
        <span className="gz-section-link">Ver todo →</span>
      </div>

      {/* Grid */}
      <div className="gz-grid">
        {filtered.map((game) => (
          <div key={game.id} className="gz-prod">
            <div className="gz-prod-img-wrap">
              <img src={game.image} className="gz-prod-img" alt={game.name} />
              {game.isNew && <span className="gz-prod-badge gz-badge-new">NEW</span>}
              {game.isSale && <span className="gz-prod-badge gz-badge-sale">SALE</span>}
              <button
                className={`gz-prod-fav ${liked.includes(game.id) ? 'liked' : ''}`}
                onClick={() => toggleLike(game.id)}
              >
                <Heart size={14} fill={liked.includes(game.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="gz-prod-info">
              <div className="gz-prod-platform">{game.platform}</div>
              <div className="gz-prod-name">{game.name}</div>
              <div className="gz-prod-bottom">
                <div>
                  <span className="gz-prod-price">{fmt(game.price)}</span>
                  {game.originalPrice && (
                    <span className="gz-prod-original">{fmt(game.originalPrice)}</span>
                  )}
                </div>
                <button className="gz-add-btn" onClick={() => addToCart(game)}>
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Featured Banner */}
      <div className="gz-featured">
        <div className="gz-featured-content">
          <h2>🏆 Pro League</h2>
          <p>Equípate como un profesional con nuestros bundles exclusivos.</p>
          <button className="gz-featured-btn">
            <Zap size={14} style={{ marginRight: 6 }} />
            Explorar Bundles
          </button>
        </div>
        <Trophy size={50} className="gz-featured-icon" />
      </div>

      {/* Bottom Nav */}
      <div className="gz-nav">
        <button className="gz-nav-item active">
          <Gamepad2 size={20} />
          <span>Inicio</span>
        </button>
        <button className="gz-nav-item">
          <Search size={20} />
          <span>Buscar</span>
        </button>
        <button className="gz-nav-item" onClick={() => setCartOpen(true)}>
          <ShoppingCart size={20} />
          <span>Carrito</span>
        </button>
        <button className="gz-nav-item">
          <User size={20} />
          <span>Perfil</span>
        </button>
      </div>

      {/* Cart Modal */}
      {cartOpen && (
        <div className="gz-cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="gz-cart-box" onClick={(e) => e.stopPropagation()}>
            <div className="gz-cart-header">
              <h2>🎮 Tu Carrito</h2>
              <button className="gz-cart-close" onClick={() => setCartOpen(false)}>
                <X size={18} />
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="gz-cart-empty">
                <Gamepad2 size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p>Tu carrito está vacío</p>
              </div>
            ) : (
              <>
                {cart.map((c, i) => (
                  <div key={i} className="gz-cart-item">
                    <img src={c.item.image} alt="" />
                    <div style={{ flex: 1 }}>
                      <div className="gz-cart-item-name">{c.item.name}</div>
                      <div className="gz-cart-item-price">{fmt(c.item.price * c.qty)}</div>
                      <div className="gz-cart-item-qty">x{c.qty}</div>
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderTop: '1px solid var(--gz-border)',
                    marginTop: 10,
                  }}
                >
                  <span style={{ color: 'var(--gz-muted)', fontSize: 14 }}>Total</span>
                  <span
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: 18,
                      fontWeight: 900,
                      background: 'var(--gz-gradient)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {fmt(totalPrice)}
                  </span>
                </div>
                <button className="gz-checkout-btn">⚡ Checkout</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
