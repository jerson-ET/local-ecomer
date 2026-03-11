'use client'

import { useState } from 'react'
import { ShoppingBag, Search, Menu, X, Crown, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'

interface LuxuryProduct {
  id: string
  name: string
  label: string
  price: number
  image: string
  category: string
}

const PRODUCTS: LuxuryProduct[] = [
  {
    id: '1',
    name: 'Bolso Piel Italiana',
    label: 'Edición Limitada',
    price: 5800000,
    image:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
    category: 'Accesorios',
  },
  {
    id: '2',
    name: 'Perfume Noir',
    label: 'Fragancia Exclusiva',
    price: 890000,
    image:
      'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80',
    category: 'Fragancias',
  },
  {
    id: '3',
    name: 'Gafas Titanium',
    label: 'Colección 2026',
    price: 2300000,
    image:
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
    category: 'Accesorios',
  },
  {
    id: '4',
    name: 'Zapatos Oxford',
    label: 'Artesanía Española',
    price: 1850000,
    image:
      'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=600&q=80',
    category: 'Calzado',
  },
  {
    id: '5',
    name: 'Billetera Croc',
    label: 'Piel de Cocodrilo',
    price: 3200000,
    image:
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80',
    category: 'Accesorios',
  },
  {
    id: '6',
    name: 'Cinturón Reversible',
    label: 'Doble Cara',
    price: 750000,
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    category: 'Accesorios',
  },
]

export default function LuxuryPage() {
  const [cartOpen, setCartOpen] = useState(false)
  const [filter, setFilter] = useState('Todos')
  const [cart, setCart] = useState<{ item: LuxuryProduct; qty: number }[]>([])

  const filtered = filter === 'Todos' ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter)
  const fmt = (p: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(p)

  const addToCart = (product: LuxuryProduct) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.item.id === product.id)
      if (ex) return prev.map((i) => (i.item.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { item: product, qty: 1 }]
    })
  }

  return (
    <div className="luxury-store">
      <div className="lx-header">
        <button className="lx-icon-btn">
          <Menu size={24} />
        </button>
        <Link href="/tiendas" className="no-underline">
          <div className="lx-logo">
            Dark <span>Luxury</span>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="lx-icon-btn">
            <Search size={24} />
          </button>
          <button className="lx-icon-btn" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={24} />
          </button>
        </div>
      </div>

      <div className="lx-hero">
        <p className="lx-hero-sub">Exclusividad Absoluta</p>
        <div className="lx-hero-line" />
        <h1>
          Beyond <span>Luxury</span>
        </h1>
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
          alt="Luxury"
          className="lx-hero-img"
        />
      </div>

      <div className="lx-cats">
        {['Todos', 'Accesorios', 'Fragancias', 'Calzado'].map((cat) => (
          <div
            key={cat}
            className={`lx-cat ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </div>
        ))}
      </div>

      <div className="lx-grid">
        {filtered.map((product) => (
          <div key={product.id} className="lx-prod">
            <img src={product.image} className="lx-prod-img" alt={product.name} />
            <div className="lx-prod-info">
              <div className="lx-prod-label">{product.label}</div>
              <div className="lx-prod-name">{product.name}</div>
              <div className="lx-prod-bottom">
                <span className="lx-prod-price">{fmt(product.price)}</span>
                <button className="lx-add-btn" onClick={() => addToCart(product)}>
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="lx-banner">
        <h2>VIP Access</h2>
        <p>Acceso anticipado a colecciones exclusivas.</p>
        <button className="lx-banner-btn">Unirse</button>
      </div>

      <div className="lx-nav">
        <button className="lx-nav-item active">
          <Crown size={24} />
        </button>
        <button className="lx-nav-item">
          <Search size={24} />
        </button>
        <button className="lx-nav-item" onClick={() => setCartOpen(true)}>
          <ShoppingCart size={24} />
        </button>
        <button className="lx-nav-item">
          <User size={24} />
        </button>
      </div>

      {cartOpen && (
        <div className="lx-cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="lx-cart-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: 'var(--lx-gold)',
                  fontWeight: 400,
                  letterSpacing: 4,
                }}
              >
                Selección
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--lx-silver)',
                  cursor: 'pointer',
                }}
              >
                <X />
              </button>
            </div>
            {cart.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 20,
                  color: '#555',
                  letterSpacing: 3,
                  fontSize: 11,
                  textTransform: 'uppercase',
                }}
              >
                Selección vacía
              </div>
            ) : (
              cart.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 16,
                    borderBottom: '1px solid rgba(212,175,55,0.15)',
                    paddingBottom: 10,
                  }}
                >
                  <img src={c.item.image} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: 1 }}>
                      {c.item.name}
                    </div>
                    <div style={{ color: 'var(--lx-gold)', fontSize: 12 }}>
                      {fmt(c.item.price * c.qty)}
                    </div>
                    <div style={{ fontSize: 10, color: '#666' }}>x{c.qty}</div>
                  </div>
                </div>
              ))
            )}
            {cart.length > 0 && (
              <button
                style={{
                  width: '100%',
                  padding: 16,
                  background: 'var(--lx-gold)',
                  color: 'var(--lx-black)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 11,
                  marginTop: 10,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: 4,
                }}
              >
                Checkout
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
