'use client'

import { useState } from 'react'
import { ShoppingBag, Search, Menu, X, Crown, Hexagon, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'
import VirtualTryOn from '@/components/features/ar/VirtualTryOn'

interface Cap {
  id: string
  name: string
  color: string
  price: number
  image: string
  category: string
  style?: string
}

const CAPS: Cap[] = [
  {
    id: '1',
    name: 'The King 59FIFTY',
    color: 'Black/Gold',
    price: 159900,
    image:
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89f?auto=format&fit=crop&w=600&q=80',
    category: 'Snapbacks',
  },
  {
    id: '2',
    name: 'Retro Dad Hat',
    color: 'Faded Blue',
    price: 89900,
    image:
      'https://images.unsplash.com/photo-1575428652377-a2697240dac0?auto=format&fit=crop&w=600&q=80',
    category: 'Dad Hats',
  },
  {
    id: '3',
    name: 'Bucket Brigade',
    color: 'Camo',
    price: 95000,
    image:
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=600&q=80',
    category: 'Buckets',
  },
  {
    id: '4',
    name: 'Neon Snap',
    color: 'Green',
    price: 120000,
    image:
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=600&q=80',
    category: 'Snapbacks',
  },
  {
    id: '5',
    name: 'Classic Trucker',
    color: 'Red/White',
    price: 75000,
    image:
      'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=600&q=80',
    category: 'Truckers',
  },
  {
    id: '6',
    name: 'Limited Drop',
    color: 'Purple',
    price: 180000,
    image:
      'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80',
    category: 'Snapbacks',
  },
]

export default function CapPage() {
  const [cartOpen, setCartOpen] = useState(false)
  const [arOpen, setArOpen] = useState(false)
  const [filter, setFilter] = useState('All')
  const [cart, setCart] = useState<{ item: Cap; qty: number }[]>([])

  const filtered = filter === 'All' ? CAPS : CAPS.filter((c) => c.category === filter)
  const fmt = (p: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(p)

  const addToCart = (cap: Cap) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.item.id === cap.id)
      if (ex) return prev.map((i) => (i.item.id === cap.id ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { item: cap, qty: 1 }]
    })
  }

  return (
    <div className="cap-store">
      {/* Header */}
      <div className="ck-header">
        <button className="ck-icon-btn">
          <Menu size={24} />
        </button>
        <Link href="/tiendas" className="no-underline">
          <div className="ck-logo">
            CAP <span>KINGS</span>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="ck-icon-btn">
            <Search size={24} />
          </button>
          <button className="ck-icon-btn" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={24} />
            {cart.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 15,
                  right: 20,
                  width: 8,
                  height: 8,
                  background: 'var(--ck-neon)',
                  borderRadius: '50%',
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="ck-hero">
        <img
          src="https://images.unsplash.com/photo-1588850561407-ed78c282e89f?auto=format&fit=crop&w=400&q=80"
          alt="New Era Cap"
          className="ck-hero-img"
        />
        <h1>
          CROWN <span>YOUR CITY</span>
        </h1>

        {/* Button to open AR Modal */}
        <button
          onClick={() => setArOpen(true)}
          style={{
            marginTop: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--ck-neon)',
            color: 'black',
            padding: '10px 20px',
            borderRadius: 30,
            fontWeight: 900,
            textTransform: 'uppercase',
            textDecoration: 'none',
            fontSize: 14,
            zIndex: 2,
            position: 'relative',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Hexagon size={18} /> Probador Virtual AR
        </button>
      </div>

      {/* Categories */}
      <div className="ck-cats">
        {['All', 'Snapbacks', 'Dad Hats', 'Buckets', 'Truckers'].map((cat) => (
          <div
            key={cat}
            className={`ck-cat-card ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="ck-grid">
        {filtered.map((cap) => (
          <div key={cap.id} className="ck-prod">
            <img src={cap.image} className="ck-prod-img" alt={cap.name} />
            <div className="ck-prod-name">{cap.name}</div>
            <div className="ck-prod-price">{fmt(cap.price)}</div>
            <button className="ck-add-btn" onClick={() => addToCart(cap)}>
              +
            </button>
          </div>
        ))}
      </div>

      {/* Custom Patch Lab */}
      <div className="ck-lab">
        <div className="ck-lab-content">
          <h2 style={{ color: 'var(--ck-white)' }}>
            CUSTOM <span style={{ color: 'var(--ck-neon)' }}>PATCH LAB</span>
          </h2>
          <p style={{ marginBottom: 16, fontSize: 12, color: 'var(--ck-white)' }}>
            Crea parches personalizados para tu gorra.
          </p>
          <button className="ck-lab-btn">Empieza Ahora</button>
        </div>
        <Hexagon size={60} color="#39ff14" strokeWidth={1} />
      </div>

      {/* Bottom Nav */}
      <div className="ck-nav">
        <button className="ck-nav-item active">
          <Crown size={24} />
        </button>
        <button className="ck-nav-item">
          <Search size={24} />
        </button>
        <button className="ck-nav-item" onClick={() => setCartOpen(true)}>
          <ShoppingCart size={24} />
        </button>
        <button className="ck-nav-item">
          <User size={24} />
        </button>
      </div>

      {/* AR Modal */}
      {arOpen && (
        <div className="ck-cart-overlay" style={{ zIndex: 100 }} onClick={() => setArOpen(false)}>
          <div
            className="ck-cart-box"
            style={{
              width: '90%',
              maxWidth: '600px',
              height: 'auto',
              background: 'black',
              border: '1px solid #333',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2
                style={{ fontFamily: 'Anton', textTransform: 'uppercase', color: 'var(--ck-neon)' }}
              >
                Probador Virtual
              </h2>
              <button
                onClick={() => setArOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white' }}
              >
                <X />
              </button>
            </div>

            <div style={{ borderRadius: 12, overflow: 'hidden' }}>
              <VirtualTryOn
                modelSrc="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
                productName="Gorra Edición Espacial"
              />
            </div>

            <p style={{ textAlign: 'center', color: '#666', fontSize: 12, marginTop: 16 }}>
              Toca "Ver en mi espacio" para usar la cámara.
            </p>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {cartOpen && (
        <div className="ck-cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="ck-cart-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2
                style={{ fontFamily: 'Anton', textTransform: 'uppercase', color: 'var(--ck-neon)' }}
              >
                Tu Stash
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white' }}
              >
                <X />
              </button>
            </div>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>STASH VACÍO</div>
            ) : (
              cart.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 16,
                    borderBottom: '1px solid #333',
                    paddingBottom: 10,
                  }}
                >
                  <img
                    src={c.item.image}
                    style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.item.name}</div>
                    <div style={{ color: 'var(--ck-neon)', fontSize: 12 }}>
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
                  padding: 16,
                  background: 'var(--ck-neon)',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: 16,
                  textTransform: 'uppercase',
                  marginTop: 10,
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
