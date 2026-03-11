'use client'

import { useState } from 'react'
import { ShoppingBag, Search, Menu, X, MapPin, Heart, Leaf } from 'lucide-react'
import Link from 'next/link'

interface WayuuItem {
  id: string
  name: string
  price: number
  image: string
  category: string
  artisan?: string
}

const ITEMS: WayuuItem[] = [
  {
    id: '1',
    name: 'Mochila Susu Tradicional',
    price: 180000,
    category: 'Mochilas',
    artisan: 'Ana Pushaina',
    image:
      'https://images.unsplash.com/photo-1590874102752-ce22975f0f5d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '2',
    name: 'Chinchorro Doble Faz',
    price: 450000,
    category: 'Chinchorros',
    artisan: 'Maria Epieyu',
    image:
      'https://images.unsplash.com/photo-1544965838-54ef8406f868?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3',
    name: 'Gasa Multicolor',
    price: 65000,
    category: 'Accesorios',
    image:
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '4',
    name: 'Sombrero Wayuu',
    price: 85000,
    category: 'Accesorios',
    artisan: 'Jose Uriana',
    image:
      'https://images.unsplash.com/photo-1572307480813-5b0aa701b0f5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '5',
    name: 'Mochila Unicolor',
    price: 150000,
    category: 'Mochilas',
    image:
      'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '6',
    name: 'Pulsera Tejida',
    price: 25000,
    category: 'Accesorios',
    image:
      'https://images.unsplash.com/photo-1611082163836-234251234978?auto=format&fit=crop&w=600&q=80',
  },
]

export default function WayuuPage() {
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCat, setActiveCat] = useState('Todos')
  const [cart, setCart] = useState<{ item: WayuuItem; qty: number }[]>([])

  const filtered = activeCat === 'Todos' ? ITEMS : ITEMS.filter((i) => i.category === activeCat)

  const addToCart = (it: WayuuItem) => {
    setCart((prev) => {
      const ex = prev.find((p) => p.item.id === it.id)
      if (ex) return prev.map((p) => (p.item.id === it.id ? { ...p, qty: p.qty + 1 } : p))
      return [...prev, { item: it, qty: 1 }]
    })
    setCartOpen(true)
  }

  const fmt = (p: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(p)

  return (
    <div className="wayuu-store">
      {/* Header */}
      <header className="wy-header">
        <button className="wy-menu-btn">
          <Menu size={24} />
        </button>
        <Link href="/tiendas" className="no-underline">
          <div className="wy-logo">
            WAYUU<span>ARTS</span>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="wy-menu-btn">
            <Search size={22} />
          </button>
          <button className="wy-cart-btn" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={22} />
            {cart.length > 0 && (
              <span
                style={{
                  fontSize: 10,
                  verticalAlign: 'top',
                  color: 'var(--wy-terra)',
                  fontWeight: 'bold',
                }}
              >
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="wy-hero">
        <div className="wy-hero-badge">100% HECHO A MANO</div>
        <div className="wy-hero-img-container">
          <img
            src="https://images.unsplash.com/photo-1596464716127-f9a0859b4b ce?auto=format&fit=crop&w=600&q=80"
            alt="Wayuu Artisan"
            className="wy-hero-img"
          />
        </div>
        <h1 className="wy-hero-title">
          El Espíritu del <em>Tejido</em>
        </h1>
        <p>
          Piezas únicas que cuentan historias ancestrales de la cultura Wayuu. Cada hilo es una
          tradición.
        </p>
        <button
          style={{
            background: 'var(--wy-terra)',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 30,
            fontSize: 14,
            letterSpacing: 1,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Descubrir Colección
        </button>
      </section>

      {/* Categories */}
      <div className="wy-cats">
        {[
          { name: 'Todos', icon: '🏺' },
          { name: 'Mochilas', icon: '🎒' },
          { name: 'Chinchorros', icon: '🕸️' },
          { name: 'Accesorios', icon: '📿' },
        ].map((c) => (
          <div
            key={c.name}
            className={`wy-cat-item ${activeCat === c.name ? 'active' : ''}`}
            onClick={() => setActiveCat(c.name)}
          >
            <div className="wy-cat-icon">{c.icon}</div>
            <div className="wy-cat-name">{c.name}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="wy-grid">
        {filtered.map((item) => (
          <div key={item.id} className="wy-product">
            <div className="wy-prod-img-box">
              <span style={{ position: 'absolute', top: 10, right: 10, color: '#ccc' }}>
                <Heart size={16} />
              </span>
              <img src={item.image} alt={item.name} className="wy-prod-img" />
            </div>
            <div className="wy-prod-info">
              <div className="wy-prod-title">{item.name}</div>
              {item.artisan && (
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4, fontStyle: 'italic' }}>
                  Por: {item.artisan}
                </div>
              )}
              <div className="wy-prod-price">{fmt(item.price)}</div>
              <button className="wy-add-btn" onClick={() => addToCart(item)}>
                Agregar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Story */}
      <section className="wy-story">
        <h3>Historias del Desierto</h3>
        <p>
          "Tejer es escribir pensamientos". Para la mujer Wayuu, cada mochila es una extensión de su
          alma y su creatividad. Compra con propósito y apoya a las comunidades de La Guajira.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, opacity: 0.8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Leaf size={24} />
            <span style={{ fontSize: 10, marginTop: 4 }}>Eco-Friendly</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <MapPin size={24} />
            <span style={{ fontSize: 10, marginTop: 4 }}>La Guajira</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Heart size={24} />
            <span style={{ fontSize: 10, marginTop: 4 }}>Comercio Justo</span>
          </div>
        </div>
      </section>

      {/* Cart Panel */}
      {cartOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 199 }}
            onClick={() => setCartOpen(false)}
          />
          <div className="wy-cart-panel">
            <div className="wy-cart-header">
              <h2>Mi Bolsa</h2>
              <button
                onClick={() => setCartOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white' }}
              >
                <X />
              </button>
            </div>
            <div className="wy-cart-content">
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  Tu bolsa está vacía
                </div>
              ) : (
                cart.map((c, i) => (
                  <div key={i} className="wy-cart-item">
                    <img
                      src={c.item.image}
                      style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{c.item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--wy-terra)' }}>
                        {fmt(c.item.price * c.qty)}
                      </div>
                      <div style={{ fontSize: 11, color: '#888' }}>Cant: {c.qty}</div>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: '#aaa' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: 20, borderTop: '1px solid #eee' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                  fontWeight: 700,
                }}
              >
                <span>Total</span>
                <span>{fmt(cart.reduce((a, c) => a + c.item.price * c.qty, 0))}</span>
              </div>
              <button
                style={{
                  width: '100%',
                  padding: 16,
                  background: 'var(--wy-terra)',
                  color: 'white',
                  border: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Finalizar Compra
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
