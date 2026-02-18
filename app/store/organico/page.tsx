'use client'

import { useState } from 'react'
import { ShoppingBag, Search, Menu, X, Leaf, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'

interface OrganicProduct {
    id: string
    name: string
    tag: string
    weight: string
    price: number
    image: string
    category: string
    badge?: string
}

const PRODUCTS: OrganicProduct[] = [
    {
        id: '1',
        name: 'Canasta de Frutas',
        tag: 'Orgánico Certificado',
        weight: '3 kg variado',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
        category: 'Frutas',
        badge: 'Fresco'
    },
    {
        id: '2',
        name: 'Mix Ensalada',
        tag: 'Hidropónico',
        weight: '500g',
        price: 12000,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
        category: 'Verduras'
    },
    {
        id: '3',
        name: 'Miel Pura de Abeja',
        tag: 'Apiario Local',
        weight: '500ml',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
        category: 'Despensa',
        badge: 'Artesanal'
    },
    {
        id: '4',
        name: 'Granola Premium',
        tag: 'Sin Azúcar Añadida',
        weight: '400g',
        price: 22000,
        image: 'https://images.unsplash.com/photo-1517093728432-a0440f8d45af?auto=format&fit=crop&w=600&q=80',
        category: 'Despensa'
    },
    {
        id: '5',
        name: 'Aguacate Hass',
        tag: 'Cosecha del Día',
        weight: '1 kg (4 uds)',
        price: 15000,
        image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80',
        category: 'Frutas'
    },
    {
        id: '6',
        name: 'Leche de Almendras',
        tag: 'Plant-Based',
        weight: '1 litro',
        price: 18000,
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
        category: 'Bebidas'
    }
]

export default function OrganicoPage() {
    const [cartOpen, setCartOpen] = useState(false)
    const [filter, setFilter] = useState('Todos')
    const [cart, setCart] = useState<{ item: OrganicProduct; qty: number }[]>([])

    const filtered = filter === 'Todos' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter)
    const fmt = (p: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p)

    const addToCart = (product: OrganicProduct) => {
        setCart(prev => {
            const ex = prev.find(i => i.item.id === product.id)
            if (ex) return prev.map(i => i.item.id === product.id ? { ...i, qty: i.qty + 1 } : i)
            return [...prev, { item: product, qty: 1 }]
        })
    }

    return (
        <div className="organic-store">
            <div className="og-header">
                <button className="og-icon-btn"><Menu size={24} /></button>
                <Link href="/dashboard" className="no-underline">
                    <div className="og-logo">Fresh <span>& Organic</span></div>
                </Link>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="og-icon-btn"><Search size={24} /></button>
                    <button className="og-icon-btn" onClick={() => setCartOpen(true)}>
                        <ShoppingBag size={24} />
                    </button>
                </div>
            </div>

            <div className="og-hero">
                <p className="og-hero-sub">🌿 Del campo a tu mesa</p>
                <h1>Vida <span>Natural</span></h1>
                <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
                    alt="Productos orgánicos"
                    className="og-hero-img"
                />
            </div>

            <div className="og-cats">
                {['Todos', 'Frutas', 'Verduras', 'Despensa', 'Bebidas'].map(cat => (
                    <div key={cat} className={`og-cat ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
                        {cat}
                    </div>
                ))}
            </div>

            <div className="og-grid">
                {filtered.map(product => (
                    <div key={product.id} className="og-prod">
                        {product.badge && <span className="og-prod-badge">{product.badge}</span>}
                        <img src={product.image} className="og-prod-img" alt={product.name} />
                        <div className="og-prod-info">
                            <div className="og-prod-tag">{product.tag}</div>
                            <div className="og-prod-name">{product.name}</div>
                            <div className="og-prod-weight">{product.weight}</div>
                            <div className="og-prod-bottom">
                                <span className="og-prod-price">{fmt(product.price)}</span>
                                <button className="og-add-btn" onClick={() => addToCart(product)}>+</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="og-banner">
                <h2>🚚 Envío Hoy</h2>
                <p>Pedidos antes de las 12pm, entrega el mismo día.</p>
                <button className="og-banner-btn">Pedir Ahora</button>
            </div>

            <div className="og-nav">
                <button className="og-nav-item active"><Leaf size={24} /></button>
                <button className="og-nav-item"><Search size={24} /></button>
                <button className="og-nav-item" onClick={() => setCartOpen(true)}><ShoppingCart size={24} /></button>
                <button className="og-nav-item"><User size={24} /></button>
            </div>

            {cartOpen && (
                <div className="og-cart-overlay" onClick={() => setCartOpen(false)}>
                    <div className="og-cart-box" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontWeight: 800, color: 'var(--og-green)' }}>🛒 Tu Canasta</h2>
                            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--og-dark)', cursor: 'pointer' }}><X /></button>
                        </div>
                        {cart.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>Canasta vacía</div>
                        ) : cart.map((c, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
                                <img src={c.item.image} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 12 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.item.name}</div>
                                    <div style={{ color: 'var(--og-green)', fontSize: 12 }}>{fmt(c.item.price * c.qty)}</div>
                                    <div style={{ fontSize: 10, color: '#888' }}>x{c.qty}</div>
                                </div>
                            </div>
                        ))}
                        {cart.length > 0 && (
                            <button style={{ width: '100%', padding: 14, background: 'var(--og-green)', color: 'white', border: 'none', fontWeight: 700, fontSize: 16, borderRadius: 25, marginTop: 10, cursor: 'pointer' }}>
                                Finalizar Pedido
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
