'use client'

import { useState } from 'react'
import {
    ShoppingCart, Search, Menu, X,
    Heart
} from 'lucide-react'
import Link from 'next/link'

const PRODUCTS = [
    {
        id: '1',
        brand: 'JORDAN',
        name: 'Air Jordan 1 High OG',
        price: 890000,
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
        tag: 'DROP'
    },
    {
        id: '2',
        brand: 'NIKE',
        name: 'Dunk Low Retro White Black',
        price: 650000,
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
        tag: 'HOT'
    },
    {
        id: '3',
        brand: 'ADIDAS',
        name: 'Yeezy Boost 350 V2',
        price: 1200000,
        image: 'https://images.unsplash.com/photo-1520256788229-d4640c639e4b?auto=format&fit=crop&w=600&q=80',
        tag: 'NEW'
    },
    {
        id: '4',
        brand: 'NEW BALANCE',
        name: '550 White Grey',
        price: 580000,
        image: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: '5',
        brand: 'NIKE',
        name: 'Air Max 90 Infrared',
        price: 720000,
        image: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: '6',
        brand: 'CONVERSE',
        name: 'Chuck 70 High Top',
        price: 450000,
        image: 'https://images.unsplash.com/photo-1627637454030-5ccc5364d93d?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: '7',
        brand: 'VANS',
        name: 'Old Skool Pro',
        price: 320000,
        image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: '8',
        brand: 'JORDAN',
        name: 'Air Jordan 4 Retro',
        price: 1050000,
        image: 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=600&q=80',
        tag: 'RARE'
    }
]

export default function SneakerPage() {
    const [cartOpen, setCartOpen] = useState(false)
    const [filter, setFilter] = useState('ALL')
    const [wishlist, setWishlist] = useState<string[]>([])
    const [cart, setCart] = useState<string[]>([])

    const fmt = (p: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p)

    const toggleWish = (id: string) => {
        setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const addToCart = (id: string) => {
        if (!cart.includes(id)) setCart([...cart, id])
        setCartOpen(true)
    }

    const filtered = filter === 'ALL' ? PRODUCTS : PRODUCTS.filter(p => p.brand === filter)

    return (
        <div className="sneaker-store">
            {/* Header */}
            <header className="snk-header">
                <button className="snk-btn-icon"><Menu size={20} /></button>
                <Link href="/dashboard" className="no-underline">
                    <div className="snk-logo">SNEAKER<span style={{ color: 'var(--snk-secondary)' }}>VAULT</span></div>
                </Link>
                <div className="snk-nav">
                    <button className="snk-btn-icon"><Search size={20} /></button>
                    <button className="snk-btn-icon" onClick={() => setCartOpen(true)}>
                        <ShoppingCart size={20} />
                        {cart.length > 0 && <span className="snk-badge" />}
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section className="snk-hero">
                <h1>THE <br /><span>GRAIL</span> DROPS</h1>
                <img
                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"
                    alt="Hero Sneaker"
                    className="snk-float"
                />
                <button className="snk-drops-btn">
                    COMPRAR AHORA
                </button>
            </section>

            {/* Brands Marquee */}
            <div className="snk-brands">
                <div className="snk-brands-track">
                    {['NIKE', 'ADIDAS', 'JORDAN', 'YEEZY', 'NEW BALANCE', 'VANS', 'PUMA', 'NIKE', 'ADIDAS', 'JORDAN'].map((b, i) => (
                        <span key={i} className="snk-brand-item">{b}</span>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, padding: '0 24px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {['ALL', 'NIKE', 'JORDAN', 'ADIDAS', 'YEEZY'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            background: filter === f ? 'var(--snk-primary)' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                        }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="snk-grid">
                {filtered.map(p => (
                    <div key={p.id} className="snk-card">
                        <div className="snk-card-overlay">
                            <button className="snk-like-btn" onClick={() => toggleWish(p.id)}>
                                <Heart size={16} fill={wishlist.includes(p.id) ? '#ff005c' : 'none'} color={wishlist.includes(p.id) ? '#ff005c' : 'white'} />
                            </button>
                        </div>
                        <img src={p.image} className="snk-card-img" alt={p.name} onClick={() => addToCart(p.id)} />
                        <div className="snk-card-info">
                            <div className="snk-card-brand">{p.brand}</div>
                            <div className="snk-card-title">{p.name}</div>
                            <div className="snk-card-price">{fmt(p.price)}</div>
                        </div>
                        {p.tag && (
                            <div style={{
                                position: 'absolute', top: 10, left: 10,
                                background: p.tag === 'DROP' ? 'var(--snk-primary)' : 'var(--snk-secondary)',
                                color: p.tag === 'DROP' ? 'white' : 'black',
                                fontSize: 10, fontWeight: 900, padding: '2px 6px',
                                borderRadius: 4, transform: 'rotate(-5deg)'
                            }}>
                                {p.tag}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Cart Modal */}
            {cartOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }} onClick={() => setCartOpen(false)} />
                    <div className="snk-cart">
                        <div className="snk-cart-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            YOUR STASH
                            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X /></button>
                        </div>
                        {cart.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>EMPTY STASH</div>
                        ) : (
                            <div>
                                {cart.map(id => {
                                    const p = PRODUCTS.find(pr => pr.id === id)
                                    if (!p) return null
                                    return (
                                        <div key={id} className="snk-cart-item">
                                            <img src={p.image} style={{ width: 60, height: 60, objectFit: 'contain', background: 'white', borderRadius: 10 }} />
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 700 }}>{p.brand}</div>
                                                <div style={{ fontSize: 14 }}>{p.name}</div>
                                                <div style={{ color: 'var(--snk-secondary)', fontWeight: 800 }}>{fmt(p.price)}</div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <button className="snk-drops-btn" style={{ width: '100%', marginTop: 20 }}>CHECKOUT</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
