'use client'

import { useState } from 'react'
import {
    ShoppingCart, Search, Menu, X, ChevronRight,
    Trophy, Zap, Shield
} from 'lucide-react'
import Link from 'next/link'

interface Product {
    id: string
    name: string
    price: number
    image: string
    category: string
    badge?: string
    specs?: string
}

const PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'Casco AGV Pista GP RR',
        price: 4500000,
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600',
        category: 'Cascos',
        badge: 'PRO',
        specs: 'Carbon Fiber'
    },
    {
        id: '2',
        name: 'Chaqueta Alpinestars GP Plus',
        price: 1850000,
        image: 'https://images.unsplash.com/photo-1544600742-9908caee8f39?w=600',
        category: 'Indumentaria',
        badge: 'NUEVO',
        specs: 'Level 2 Protection'
    },
    {
        id: '3',
        name: 'Escape Akrapovic Titanium',
        price: 2900000,
        image: 'https://images.unsplash.com/photo-1563297003-888dd8439df4?w=600',
        category: 'Repuestos',
        badge: 'RACING',
        specs: '+5 HP'
    },
    {
        id: '4',
        name: 'Guantes Dainese Full Metal',
        price: 850000,
        image: 'https://images.unsplash.com/photo-1621600411688-4be93cd68504?w=600',
        category: 'Indumentaria',
        specs: 'Titanium Knuckles'
    },
    {
        id: '5',
        name: 'Aceite Motul 300V 4T',
        price: 95000,
        image: 'https://images.unsplash.com/photo-1635334185794-c7c4f447728f?w=600',
        category: 'Mantenimiento',
        badge: 'BEST SELLER'
    },
    {
        id: '6',
        name: 'Botas Sidi Rex Air',
        price: 1200000,
        image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600',
        category: 'Indumentaria',
        specs: 'Vented'
    },
    {
        id: '7',
        name: 'Kit de Arrastre Racing',
        price: 450000,
        image: 'https://images.unsplash.com/photo-1599256621168-02686f775276?w=600',
        category: 'Repuestos',
        specs: 'Gold Series'
    },
    {
        id: '8',
        name: 'Intercomunicador Cardo Packtalk',
        price: 1100000,
        image: 'https://images.unsplash.com/photo-1511252178229-232d30836484?w=600',
        category: 'Accesorios',
        badge: 'JBL AUDIO'
    }
]

const CATEGORIES = [
    { id: 'all', name: 'Todo', icon: '🏍️' },
    { id: 'Cascos', name: 'Cascos', icon: '🪖' },
    { id: 'Indumentaria', name: 'Ropa', icon: '🧥' },
    { id: 'Repuestos', name: 'Piezas', icon: '⚙️' },
    { id: 'Accesorios', name: 'Gadgets', icon: '🔌' }
]

export default function MotoPage() {
    const [cartOpen, setCartOpen] = useState(false)
    const [cart, setCart] = useState<{ product: Product, qty: number }[]>([])
    const [activeCat, setActiveCat] = useState('all')

    const filtered = activeCat === 'all'
        ? PRODUCTS
        : PRODUCTS.filter(p => p.category === activeCat)

    const addToCart = (p: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === p.id)
            if (existing) {
                return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i)
            }
            return [...prev, { product: p, qty: 1 }]
        })
        setCartOpen(true)
    }

    const fmtPrice = (p: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p)

    return (
        <div className="moto-store">
            {/* Header */}
            <header className="mt-header">
                <button className="mt-icon-btn"><Menu size={20} /></button>
                <Link href="/dashboard" className="no-underline">
                    <div className="mt-logo">MOTO<span style={{ color: 'var(--mt-primary)', fontStyle: 'italic' }}>RACER</span></div>
                </Link>
                <div className="mt-nav-icons">
                    <button className="mt-icon-btn"><Search size={20} /></button>
                    <button className="mt-icon-btn" onClick={() => setCartOpen(true)}>
                        <ShoppingCart size={20} />
                        {cart.length > 0 && <span className="mt-cart-badge">{cart.reduce((a, c) => a + c.qty, 0)}</span>}
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section className="mt-hero">
                <img src="https://images.unsplash.com/photo-1558981806-ec527fa84c3d?w=1200&q=80" alt="Moto Background" className="mt-hero-bg" />
                <div className="mt-hero-content">
                    <h1>DOMINA EL <span>ASFALTO</span></h1>
                    <p>EQUIPAMIENTO PROFESIONAL PARA PILOTOS REALES</p>
                    <button className="mt-btn-primary">
                        COMPRAR AHORA <ChevronRight size={20} />
                    </button>
                </div>
            </section>

            {/* Stats */}
            <div className="mt-stats">
                <div className="mt-stat">
                    <div className="mt-stat-val"><Zap size={24} color="#e74c3c" /></div>
                    <div className="mt-stat-lbl">Potencia</div>
                </div>
                <div className="mt-stat">
                    <div className="mt-stat-val"><Shield size={24} color="#e74c3c" /></div>
                    <div className="mt-stat-lbl">Seguridad</div>
                </div>
                <div className="mt-stat">
                    <div className="mt-stat-val"><Trophy size={24} color="#e74c3c" /></div>
                    <div className="mt-stat-lbl">Calidad</div>
                </div>
            </div>

            {/* Categories */}
            <div className="mt-cats">
                {CATEGORIES.map(c => (
                    <div
                        key={c.id}
                        className={`mt-cat-item ${activeCat === c.id ? 'active' : ''}`}
                        onClick={() => setActiveCat(c.id)}
                    >
                        <div className="mt-cat-icon">{c.icon}</div>
                        <div className="mt-cat-name">{c.name}</div>
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="mt-grid">
                {filtered.map(p => (
                    <div key={p.id} className="mt-card">
                        <div className="mt-card-img-container">
                            <img src={p.image} alt={p.name} className="mt-card-img" />
                            {p.badge && <span className="mt-tag">{p.badge}</span>}
                        </div>
                        <div className="mt-card-body">
                            <h3 className="mt-card-title">{p.name}</h3>
                            {p.specs && <div style={{ fontSize: 10, color: 'var(--mt-text-muted)', marginBottom: 4 }}>{p.specs}</div>}
                            <div className="mt-card-price">
                                {fmtPrice(p.price)}
                                <button className="mt-add-btn" onClick={() => addToCart(p)}>+</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cart Sidebar */}
            {cartOpen && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 199 }} onClick={() => setCartOpen(false)} />
                    <div className="mt-cart-sidebar">
                        <div className="mt-cart-title">
                            GARAGE <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X /></button>
                        </div>
                        <div className="mt-cart-items">
                            {cart.map((item, idx) => (
                                <div key={idx} className="mt-cart-item">
                                    <img src={item.product.image} style={{ width: 50, height: 50, objectFit: 'cover', marginRight: 10 }} />
                                    <div className="mt-cart-info">
                                        <h4>{item.product.name}</h4>
                                        <div style={{ color: 'var(--mt-primary)', fontWeight: 'bold' }}>{fmtPrice(item.product.price * item.qty)}</div>
                                        <div style={{ fontSize: 12, color: '#888' }}>Cant: {item.qty}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-checkout-btn">
                            PROCESAR PAGO
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
