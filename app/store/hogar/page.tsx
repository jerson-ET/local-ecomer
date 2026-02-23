'use client'

import { useState } from 'react'
import { ShoppingBag, Search, Menu, X, Home, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'

interface HomeProduct {
    id: string
    name: string
    cat: string
    price: number
    image: string
    category: string
}

const PRODUCTS: HomeProduct[] = [
    {
        id: '1',
        name: 'Sofá Modular Oslo',
        cat: 'Sala de estar',
        price: 2850000,
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
        category: 'Muebles'
    },
    {
        id: '2',
        name: 'Lámpara Nórdica',
        cat: 'Iluminación',
        price: 185000,
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?auto=format&fit=crop&w=600&q=80',
        category: 'Decoración'
    },
    {
        id: '3',
        name: 'Set Cojines Lino',
        cat: 'Textil',
        price: 125000,
        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
        category: 'Textiles'
    },
    {
        id: '4',
        name: 'Maceta Cerámica',
        cat: 'Plantas',
        price: 65000,
        image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80',
        category: 'Decoración'
    },
    {
        id: '5',
        name: 'Mesa Centro Roble',
        cat: 'Sala de estar',
        price: 890000,
        image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=600&q=80',
        category: 'Muebles'
    },
    {
        id: '6',
        name: 'Velas Aromáticas',
        cat: 'Ambientación',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1602523961358-f9c8c0e67fae?auto=format&fit=crop&w=600&q=80',
        category: 'Decoración'
    }
]

export default function HogarPage() {
    const [cartOpen, setCartOpen] = useState(false)
    const [filter, setFilter] = useState('Todos')
    const [cart, setCart] = useState<{ item: HomeProduct; qty: number }[]>([])

    const filtered = filter === 'Todos' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter)
    const fmt = (p: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p)

    const addToCart = (product: HomeProduct) => {
        setCart(prev => {
            const ex = prev.find(i => i.item.id === product.id)
            if (ex) return prev.map(i => i.item.id === product.id ? { ...i, qty: i.qty + 1 } : i)
            return [...prev, { item: product, qty: 1 }]
        })
    }

    return (
        <div className="hogar-store">
            <div className="hg-header">
                <button className="hg-icon-btn"><Menu size={24} /></button>
                <Link href="/tiendas" className="no-underline">
                    <div className="hg-logo">Casa <span>Viva</span></div>
                </Link>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="hg-icon-btn"><Search size={24} /></button>
                    <button className="hg-icon-btn" onClick={() => setCartOpen(true)}>
                        <ShoppingBag size={24} />
                    </button>
                </div>
            </div>

            <div className="hg-hero">
                <p className="hg-hero-sub">✨ Diseño de interiores</p>
                <h1>Tu hogar, tu <span>refugio</span></h1>
                <img
                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80"
                    alt="Hogar"
                    className="hg-hero-img"
                />
            </div>

            <div className="hg-cats">
                {['Todos', 'Muebles', 'Decoración', 'Textiles'].map(cat => (
                    <div key={cat} className={`hg-cat ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
                        {cat}
                    </div>
                ))}
            </div>

            <div className="hg-grid">
                {filtered.map(product => (
                    <div key={product.id} className="hg-prod">
                        <img src={product.image} className="hg-prod-img" alt={product.name} />
                        <div className="hg-prod-info">
                            <div className="hg-prod-cat">{product.cat}</div>
                            <div className="hg-prod-name">{product.name}</div>
                            <div className="hg-prod-bottom">
                                <span className="hg-prod-price">{fmt(product.price)}</span>
                                <button className="hg-add-btn" onClick={() => addToCart(product)}>+</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="hg-banner">
                <h2>Envío gratis en muebles</h2>
                <p>En compras superiores a $500.000. Entrega en tu puerta.</p>
                <button className="hg-banner-btn">Ver Catálogo</button>
            </div>

            <div className="hg-nav">
                <button className="hg-nav-item active"><Home size={24} /></button>
                <button className="hg-nav-item"><Search size={24} /></button>
                <button className="hg-nav-item" onClick={() => setCartOpen(true)}><ShoppingCart size={24} /></button>
                <button className="hg-nav-item"><User size={24} /></button>
            </div>

            {cartOpen && (
                <div className="hg-cart-overlay" onClick={() => setCartOpen(false)}>
                    <div className="hg-cart-box" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--hg-dark)' }}>Tu Carrito</h2>
                            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--hg-dark)', cursor: 'pointer' }}><X /></button>
                        </div>
                        {cart.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>Carrito vacío</div>
                        ) : cart.map((c, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
                                <img src={c.item.image} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 12 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.item.name}</div>
                                    <div style={{ color: 'var(--hg-terra)', fontSize: 12 }}>{fmt(c.item.price * c.qty)}</div>
                                    <div style={{ fontSize: 10, color: '#888' }}>x{c.qty}</div>
                                </div>
                            </div>
                        ))}
                        {cart.length > 0 && (
                            <button style={{ width: '100%', padding: 14, background: 'var(--hg-sage)', color: 'white', border: 'none', fontWeight: 700, fontSize: 16, borderRadius: 25, marginTop: 10, cursor: 'pointer' }}>
                                Finalizar Compra
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
