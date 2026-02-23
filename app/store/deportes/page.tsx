'use client'

import { useState } from 'react'
import { ShoppingBag, Search, Menu, X, ShoppingCart, User, Trophy } from 'lucide-react'
import Link from 'next/link'

interface SportProduct {
    id: string
    name: string
    desc: string
    price: number
    image: string
    category: string
    badge?: string
}

const PRODUCTS: SportProduct[] = [
    {
        id: '1',
        name: 'Running Pro X',
        desc: 'Zapatillas de alto rendimiento',
        price: 389000,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
        category: 'Calzado',
        badge: 'Nuevo'
    },
    {
        id: '2',
        name: 'Camiseta Dry-Fit',
        desc: 'Tecnología anti-transpirante',
        price: 129000,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
        category: 'Ropa'
    },
    {
        id: '3',
        name: 'Balón Pro Match',
        desc: 'Balón oficial de competición',
        price: 185000,
        image: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=600&q=80',
        category: 'Accesorios',
        badge: 'Top'
    },
    {
        id: '4',
        name: 'Mancuernas Set',
        desc: 'Set ajustable 5-25kg',
        price: 450000,
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
        category: 'Equipos'
    },
    {
        id: '5',
        name: 'Shorts Training',
        desc: 'Shorts elásticos con bolsillos',
        price: 89000,
        image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=80',
        category: 'Ropa'
    },
    {
        id: '6',
        name: 'Botella Hydro',
        desc: 'Aislamiento térmico 24h',
        price: 65000,
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
        category: 'Accesorios'
    }
]

export default function DeportesPage() {
    const [cartOpen, setCartOpen] = useState(false)
    const [filter, setFilter] = useState('Todos')
    const [cart, setCart] = useState<{ item: SportProduct; qty: number }[]>([])

    const filtered = filter === 'Todos' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter)
    const fmt = (p: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p)

    const addToCart = (product: SportProduct) => {
        setCart(prev => {
            const ex = prev.find(i => i.item.id === product.id)
            if (ex) return prev.map(i => i.item.id === product.id ? { ...i, qty: i.qty + 1 } : i)
            return [...prev, { item: product, qty: 1 }]
        })
    }

    return (
        <div className="sport-store">
            <div className="sp-header">
                <button className="sp-icon-btn"><Menu size={24} /></button>
                <Link href="/tiendas" className="no-underline">
                    <div className="sp-logo">Sport <span>Zone</span></div>
                </Link>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="sp-icon-btn"><Search size={24} /></button>
                    <button className="sp-icon-btn" onClick={() => setCartOpen(true)}>
                        <ShoppingBag size={24} />
                    </button>
                </div>
            </div>

            <div className="sp-hero">
                <p className="sp-hero-sub">🏆 Alto Rendimiento</p>
                <h1>Supera tus <span>Límites</span></h1>
                <img
                    src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80"
                    alt="Deportes"
                    className="sp-hero-img"
                />
            </div>

            <div className="sp-cats">
                {['Todos', 'Calzado', 'Ropa', 'Accesorios', 'Equipos'].map(cat => (
                    <div key={cat} className={`sp-cat ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
                        {cat}
                    </div>
                ))}
            </div>

            <div className="sp-grid">
                {filtered.map(product => (
                    <div key={product.id} className="sp-prod">
                        {product.badge && <span className="sp-prod-badge">{product.badge}</span>}
                        <img src={product.image} className="sp-prod-img" alt={product.name} />
                        <div className="sp-prod-info">
                            <div className="sp-prod-name">{product.name}</div>
                            <div className="sp-prod-desc">{product.desc}</div>
                            <div className="sp-prod-bottom">
                                <span className="sp-prod-price">{fmt(product.price)}</span>
                                <button className="sp-add-btn" onClick={() => addToCart(product)}>+</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="sp-banner">
                <h2>Descuento 30% en Running</h2>
                <p>Válido hasta agotar existencias. Solo en línea.</p>
                <button className="sp-banner-btn">Ver Ofertas</button>
            </div>

            <div className="sp-nav">
                <button className="sp-nav-item active"><Trophy size={24} /></button>
                <button className="sp-nav-item"><Search size={24} /></button>
                <button className="sp-nav-item" onClick={() => setCartOpen(true)}><ShoppingCart size={24} /></button>
                <button className="sp-nav-item"><User size={24} /></button>
            </div>

            {cartOpen && (
                <div className="sp-cart-overlay" onClick={() => setCartOpen(false)}>
                    <div className="sp-cart-box" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', color: 'var(--sp-blue)' }}>Tu Carrito</h2>
                            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
                        </div>
                        {cart.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>Carrito vacío</div>
                        ) : cart.map((c, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 10 }}>
                                <img src={c.item.image} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 10 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.item.name}</div>
                                    <div style={{ color: 'var(--sp-blue)', fontSize: 12 }}>{fmt(c.item.price * c.qty)}</div>
                                    <div style={{ fontSize: 10, color: '#888' }}>x{c.qty}</div>
                                </div>
                            </div>
                        ))}
                        {cart.length > 0 && (
                            <button style={{ width: '100%', padding: 14, background: 'var(--sp-blue)', color: 'white', border: 'none', fontWeight: 700, fontSize: 16, borderRadius: 10, marginTop: 10, cursor: 'pointer', textTransform: 'uppercase' }}>
                                Checkout
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
