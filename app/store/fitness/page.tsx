'use client'

import { useState } from 'react'
import { ShoppingBag, Search, Menu, X, Flame, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'

interface FitnessProduct {
    id: string
    name: string
    desc: string
    price: number
    image: string
    category: string
    badge?: string
}

const PRODUCTS: FitnessProduct[] = [
    {
        id: '1',
        name: 'Whey Protein 2kg',
        desc: '30g proteína por scoop',
        price: 195000,
        image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2c216?auto=format&fit=crop&w=600&q=80',
        category: 'Suplementos',
        badge: 'Best Seller'
    },
    {
        id: '2',
        name: 'Top Training',
        desc: 'Top deportivo compresión',
        price: 89000,
        image: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&w=600&q=80',
        category: 'Ropa'
    },
    {
        id: '3',
        name: 'Kettlebell 16kg',
        desc: 'Hierro fundido premium',
        price: 165000,
        image: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=600&q=80',
        category: 'Equipos',
        badge: 'Pro'
    },
    {
        id: '4',
        name: 'Pre-Workout',
        desc: 'Energía explosiva, 300g',
        price: 125000,
        image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80',
        category: 'Suplementos'
    },
    {
        id: '5',
        name: 'Leggings Pro',
        desc: 'Lycra premium, squat proof',
        price: 135000,
        image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=600&q=80',
        category: 'Ropa'
    },
    {
        id: '6',
        name: 'Banda Resistencia',
        desc: 'Set 5 bandas, portátil',
        price: 55000,
        image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=600&q=80',
        category: 'Accesorios'
    }
]

export default function FitnessPage() {
    const [cartOpen, setCartOpen] = useState(false)
    const [filter, setFilter] = useState('Todos')
    const [cart, setCart] = useState<{ item: FitnessProduct; qty: number }[]>([])

    const filtered = filter === 'Todos' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter)
    const fmt = (p: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p)

    const addToCart = (product: FitnessProduct) => {
        setCart(prev => {
            const ex = prev.find(i => i.item.id === product.id)
            if (ex) return prev.map(i => i.item.id === product.id ? { ...i, qty: i.qty + 1 } : i)
            return [...prev, { item: product, qty: 1 }]
        })
    }

    return (
        <div className="fitness-store">
            <div className="ft-header">
                <button className="ft-icon-btn"><Menu size={24} /></button>
                <Link href="/dashboard" className="no-underline">
                    <div className="ft-logo">IRON <span>PULSE</span></div>
                </Link>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="ft-icon-btn"><Search size={24} /></button>
                    <button className="ft-icon-btn" onClick={() => setCartOpen(true)}>
                        <ShoppingBag size={24} />
                    </button>
                </div>
            </div>

            <div className="ft-hero">
                <p className="ft-hero-sub">🔥 Sin Excusas</p>
                <h1>Beast <span>Mode</span></h1>
                <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
                    alt="Fitness"
                    className="ft-hero-img"
                />
            </div>

            <div className="ft-cats">
                {['Todos', 'Suplementos', 'Ropa', 'Equipos', 'Accesorios'].map(cat => (
                    <div key={cat} className={`ft-cat ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
                        {cat}
                    </div>
                ))}
            </div>

            <div className="ft-grid">
                {filtered.map(product => (
                    <div key={product.id} className="ft-prod">
                        {product.badge && <span className="ft-prod-badge">{product.badge}</span>}
                        <img src={product.image} className="ft-prod-img" alt={product.name} />
                        <div className="ft-prod-info">
                            <div className="ft-prod-name">{product.name}</div>
                            <div className="ft-prod-desc">{product.desc}</div>
                            <div className="ft-prod-bottom">
                                <span className="ft-prod-price">{fmt(product.price)}</span>
                                <button className="ft-add-btn" onClick={() => addToCart(product)}>+</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="ft-banner">
                <h2>Plan 90 Días Fit</h2>
                <p>Programa de entrenamiento + nutrición personalizado.</p>
                <button className="ft-banner-btn">Empezar Ahora</button>
            </div>

            <div className="ft-nav">
                <button className="ft-nav-item active"><Flame size={24} /></button>
                <button className="ft-nav-item"><Search size={24} /></button>
                <button className="ft-nav-item" onClick={() => setCartOpen(true)}><ShoppingCart size={24} /></button>
                <button className="ft-nav-item"><User size={24} /></button>
            </div>

            {cartOpen && (
                <div className="ft-cart-overlay" onClick={() => setCartOpen(false)}>
                    <div className="ft-cart-box" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 3, color: 'var(--ft-red)' }}>Tu Carrito</h2>
                            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
                        </div>
                        {cart.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>Carrito vacío</div>
                        ) : cart.map((c, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 10 }}>
                                <img src={c.item.image} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.item.name}</div>
                                    <div style={{ color: 'var(--ft-red)', fontSize: 12 }}>{fmt(c.item.price * c.qty)}</div>
                                    <div style={{ fontSize: 10, color: '#888' }}>x{c.qty}</div>
                                </div>
                            </div>
                        ))}
                        {cart.length > 0 && (
                            <button style={{ width: '100%', padding: 14, background: 'var(--ft-red)', color: 'white', border: 'none', fontWeight: 700, fontSize: 16, borderRadius: 8, marginTop: 10, cursor: 'pointer', textTransform: 'uppercase', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2 }}>
                                Checkout
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
