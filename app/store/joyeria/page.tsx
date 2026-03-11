'use client'

import { useState } from 'react'
import { ShoppingBag, Search, Menu, X, Gem, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'

interface Jewelry {
  id: string
  name: string
  collection: string
  price: number
  image: string
  category: string
}

const PRODUCTS: Jewelry[] = [
  {
    id: '1',
    name: 'Anillo Eternité',
    collection: 'Colección Clásica',
    price: 4500000,
    image:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
    category: 'Anillos',
  },
  {
    id: '2',
    name: 'Collar Lumière',
    collection: 'Colección Premium',
    price: 3200000,
    image:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
    category: 'Collares',
  },
  {
    id: '3',
    name: 'Pulsera Rivière',
    collection: 'Colección Diamantes',
    price: 6800000,
    image:
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80',
    category: 'Pulseras',
  },
  {
    id: '4',
    name: 'Aretes Cascada',
    collection: 'Colección Gala',
    price: 2750000,
    image:
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
    category: 'Aretes',
  },
  {
    id: '5',
    name: 'Reloj Heritage',
    collection: 'Colección Tiempo',
    price: 8900000,
    image:
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80',
    category: 'Relojes',
  },
  {
    id: '6',
    name: 'Anillo Solitario',
    collection: 'Compromiso',
    price: 12500000,
    image:
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80',
    category: 'Anillos',
  },
]

export default function JoyeriaPage() {
  const [cartOpen, setCartOpen] = useState(false)
  const [filter, setFilter] = useState('Todos')
  const [cart, setCart] = useState<{ item: Jewelry; qty: number }[]>([])

  const filtered = filter === 'Todos' ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter)
  const fmt = (p: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(p)

  const addToCart = (product: Jewelry) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.item.id === product.id)
      if (ex) return prev.map((i) => (i.item.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { item: product, qty: 1 }]
    })
  }

  return (
    <div className="joyeria-store">
      <div className="jy-header">
        <button className="jy-icon-btn">
          <Menu size={24} />
        </button>
        <Link href="/tiendas" className="no-underline">
          <div className="jy-logo">
            Lumi<span>ère</span>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="jy-icon-btn">
            <Search size={24} />
          </button>
          <button className="jy-icon-btn" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={24} />
          </button>
        </div>
      </div>

      <div className="jy-hero">
        <p className="jy-hero-sub">💎 Joyería Exclusiva</p>
        <h1>
          Elegancia <span>Eterna</span>
        </h1>
        <img
          src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=400&q=80"
          alt="Joyería fina"
          className="jy-hero-img"
        />
      </div>

      <div className="jy-cats">
        {['Todos', 'Anillos', 'Collares', 'Pulseras', 'Aretes', 'Relojes'].map((cat) => (
          <div
            key={cat}
            className={`jy-cat ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </div>
        ))}
      </div>

      <div className="jy-grid">
        {filtered.map((product) => (
          <div key={product.id} className="jy-prod">
            <img src={product.image} className="jy-prod-img" alt={product.name} />
            <div className="jy-prod-info">
              <div className="jy-prod-collection">{product.collection}</div>
              <div className="jy-prod-name">{product.name}</div>
              <div className="jy-prod-bottom">
                <span className="jy-prod-price">{fmt(product.price)}</span>
                <button className="jy-add-btn" onClick={() => addToCart(product)}>
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="jy-banner">
        <h2>Cita Privada</h2>
        <p>Agenda una experiencia personalizada en nuestro showroom.</p>
        <button className="jy-banner-btn">Reservar</button>
      </div>

      <div className="jy-nav">
        <button className="jy-nav-item active">
          <Gem size={24} />
        </button>
        <button className="jy-nav-item">
          <Search size={24} />
        </button>
        <button className="jy-nav-item" onClick={() => setCartOpen(true)}>
          <ShoppingCart size={24} />
        </button>
        <button className="jy-nav-item">
          <User size={24} />
        </button>
      </div>

      {cartOpen && (
        <div className="jy-cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="jy-cart-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: 'var(--jy-gold)',
                  fontWeight: 400,
                  letterSpacing: 2,
                }}
              >
                Selección
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--jy-champagne)',
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
                  letterSpacing: 2,
                  fontSize: 12,
                }}
              >
                SIN SELECCIÓN
              </div>
            ) : (
              cart.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 16,
                    borderBottom: '1px solid rgba(212,175,55,0.2)',
                    paddingBottom: 10,
                  }}
                >
                  <img src={c.item.image} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.item.name}</div>
                    <div style={{ color: 'var(--jy-gold)', fontSize: 12 }}>
                      {fmt(c.item.price * c.qty)}
                    </div>
                    <div style={{ fontSize: 10, color: '#888' }}>x{c.qty}</div>
                  </div>
                </div>
              ))
            )}
            {cart.length > 0 && (
              <button
                style={{
                  width: '100%',
                  padding: 14,
                  background: 'var(--jy-gold)',
                  color: 'var(--jy-black)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 12,
                  marginTop: 10,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: 3,
                }}
              >
                Finalizar Compra
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
