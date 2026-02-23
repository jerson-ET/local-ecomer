'use client'

import { useState } from 'react'
import { ShoppingBag, Search, Menu, X, Coffee, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'

interface CoffeeProduct {
    id: string
    name: string
    origin: string
    notes: string
    price: number
    image: string
    category: string
}

const COFFEES: CoffeeProduct[] = [
    {
        id: '1',
        name: 'Colombia Supremo',
        origin: 'Huila, Colombia',
        notes: 'Chocolate, caramelo, nuez',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80',
        category: 'Origen Único'
    },
    {
        id: '2',
        name: 'Ethiopia Yirgacheffe',
        origin: 'Sidamo, Etiopía',
        notes: 'Frutas cítricas, floral, miel',
        price: 62000,
        image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=600&q=80',
        category: 'Origen Único'
    },
    {
        id: '3',
        name: 'Blend Casa',
        origin: 'Mezcla Artesanal',
        notes: 'Equilibrado, suave, dulce',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?auto=format&fit=crop&w=600&q=80',
        category: 'Blends'
    },
    {
        id: '4',
        name: 'Cold Brew Pack',
        origin: 'Preparación Fría',
        notes: 'Listo para servir, refrescante',
        price: 28000,
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
        category: 'Cold Brew'
    },
    {
        id: '5',
        name: 'Geisha Premium',
        origin: 'Boquete, Panamá',
        notes: 'Jazmín, bergamota, tropical',
        price: 120000,
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
        category: 'Origen Único'
    },
    {
        id: '6',
        name: 'Kit Barista',
        origin: 'Accesorios',
        notes: 'Prensa, filtros, molino manual',
        price: 185000,
        image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80',
        category: 'Accesorios'
    }
]

export default function CafePage() {
    const [cartOpen, setCartOpen] = useState(false)
    const [filter, setFilter] = useState('Todos')
    const [cart, setCart] = useState<{ item: CoffeeProduct; qty: number }[]>([])

    const filtered = filter === 'Todos' ? COFFEES : COFFEES.filter(c => c.category === filter)
    const fmt = (p: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p)

    const addToCart = (coffee: CoffeeProduct) => {
        setCart(prev => {
            const ex = prev.find(i => i.item.id === coffee.id)
            if (ex) return prev.map(i => i.item.id === coffee.id ? { ...i, qty: i.qty + 1 } : i)
            return [...prev, { item: coffee, qty: 1 }]
        })
    }

    return (
        <div className="cafe-store">
            {/* Header */}
            <div className="cf-header">
                <button className="cf-icon-btn"><Menu size={24} /></button>
                <Link href="/tiendas" className="no-underline">
                    <div className="cf-logo">Café <span>Origen</span></div>
                </Link>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="cf-icon-btn"><Search size={24} /></button>
                    <button className="cf-icon-btn" onClick={() => setCartOpen(true)}>
                        <ShoppingBag size={24} />
                    </button>
                </div>
            </div>

            {/* Hero */}
            <div className="cf-hero">
                <p className="cf-hero-sub">☕ Tostado Artesanal</p>
                <h1>Descubre el <span>Sabor</span></h1>
                <img
                    src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=400&q=80"
                    alt="Café de especialidad"
                    className="cf-hero-img"
                />
            </div>

            {/* Categories */}
            <div className="cf-cats">
                {['Todos', 'Origen Único', 'Blends', 'Cold Brew', 'Accesorios'].map(cat => (
                    <div
                        key={cat}
                        className={`cf-cat-pill ${filter === cat ? 'active' : ''}`}
                        onClick={() => setFilter(cat)}
                    >
                        {cat}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="cf-grid">
                {filtered.map(coffee => (
                    <div key={coffee.id} className="cf-prod">
                        <img src={coffee.image} className="cf-prod-img" alt={coffee.name} />
                        <div className="cf-prod-info">
                            <div className="cf-prod-origin">{coffee.origin}</div>
                            <div className="cf-prod-name">{coffee.name}</div>
                            <div className="cf-prod-notes">{coffee.notes}</div>
                            <div className="cf-prod-bottom">
                                <span className="cf-prod-price">{fmt(coffee.price)}</span>
                                <button className="cf-add-btn" onClick={() => addToCart(coffee)}>+</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Banner */}
            <div className="cf-banner">
                <div>
                    <h2>Suscripción Mensual</h2>
                    <p>Recibe café fresco cada mes en tu puerta.</p>
                    <button className="cf-banner-btn">Suscribirme</button>
                </div>
                <Coffee size={50} color="#D4A574" strokeWidth={1} />
            </div>

            {/* Bottom Nav */}
            <div className="cf-nav">
                <button className="cf-nav-item active"><Coffee size={24} /></button>
                <button className="cf-nav-item"><Search size={24} /></button>
                <button className="cf-nav-item" onClick={() => setCartOpen(true)}><ShoppingCart size={24} /></button>
                <button className="cf-nav-item"><User size={24} /></button>
            </div>

            {/* Cart Modal */}
            {cartOpen && (
                <div className="cf-cart-overlay" onClick={() => setCartOpen(false)}>
                    <div className="cf-cart-box" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--cf-dark)' }}>Tu Pedido</h2>
                            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--cf-dark)', cursor: 'pointer' }}><X /></button>
                        </div>
                        {cart.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>Tu carrito está vacío</div>
                        ) : cart.map((c, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                                <img src={c.item.image} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 10 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.item.name}</div>
                                    <div style={{ color: 'var(--cf-gold)', fontSize: 12 }}>{fmt(c.item.price * c.qty)}</div>
                                    <div style={{ fontSize: 10, color: '#888' }}>x{c.qty}</div>
                                </div>
                            </div>
                        ))}
                        {cart.length > 0 && (
                            <button style={{ width: '100%', padding: 14, background: 'var(--cf-dark)', color: 'var(--cf-gold)', border: 'none', fontWeight: 700, fontSize: 16, borderRadius: 25, marginTop: 10, cursor: 'pointer' }}>
                                Pagar Pedido
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
