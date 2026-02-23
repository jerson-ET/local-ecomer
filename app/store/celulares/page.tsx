'use client'

import { useState } from 'react'
import {
    Menu, Search, ShoppingBag, X,
    BatteryCharging, Zap, Camera
} from 'lucide-react'
import Link from 'next/link'

interface Device {
    id: string
    name: string
    price: number
    image: string
    badge: string
    specs?: { battery: string, camera: string, chip: string }
}

const DEVICES: Device[] = [
    {
        id: '1',
        name: 'iPhone 15 Pro',
        price: 4999000,
        badge: 'NEW',
        specs: { battery: '29h', camera: '48MP', chip: 'A17 Pro' },
        image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: '2',
        name: 'Samsung S24 Ultra',
        price: 5299000,
        badge: 'AI PHONE',
        specs: { battery: '30h', camera: '200MP', chip: 'Snapdragon 8 Gen 3' },
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: '3',
        name: 'Google Pixel 8 Pro',
        price: 3899000,
        badge: 'BEST CAMERA',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff23?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: '4',
        name: 'AirPods Pro 2',
        price: 1199000,
        badge: 'USB-C',
        image: 'https://images.unsplash.com/photo-1603351154351-5cf99703f6a8?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: '5',
        name: 'Apple Watch Ultra 2',
        price: 3599000,
        badge: 'RUGGED',
        image: 'https://images.unsplash.com/photo-1558126319-c9feecbf57ee?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: '6',
        name: 'iPad Air M1',
        price: 2799000,
        badge: 'EDUCATION',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80'
    }
]

export default function TechPage() {
    const [cartOpen, setCartOpen] = useState(false)
    const [cart, setCart] = useState<Device[]>([])

    const addToCart = (d: Device) => {
        setCart([...cart, d])
        setCartOpen(true)
    }

    const fmt = (p: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p)

    return (
        <div className="tech-store">
            {/* Header */}
            <header className="tk-header">
                <Link href="/tiendas" className="tk-logo">
                    Tech<span style={{ color: 'var(--tk-blue)' }}>Store</span>
                </Link>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="tk-nav-item"><Search size={18} /></button>
                    <button className="tk-nav-item" onClick={() => setCartOpen(true)}>
                        <ShoppingBag size={18} />
                        {cart.length > 0 && <span style={{ fontSize: 10, marginLeft: 4, fontWeight: 700 }}>{cart.length}</span>}
                    </button>
                    <button className="tk-nav-item"><Menu size={18} /></button>
                </div>
            </header>

            {/* Hero */}
            <section className="tk-hero">
                <h1>iPhone 15 Pro</h1>
                <h3>Titanium. So strong. So light. So Pro.</h3>
                <div className="tk-hero-links">
                    <a href="#" className="tk-link">Learn more &gt;</a>
                    <a href="#" className="tk-link">Buy &gt;</a>
                </div>
                <div className="tk-hero-img-box">
                    <img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80" className="tk-hero-img" alt="Hero iPhone" />
                </div>
                <div className="tk-badges">
                    <div className="tk-badge-item">A17 Pro Chip</div>
                    <div className="tk-badge-item">Titanium Design</div>
                    <div className="tk-badge-item">48MP Camera</div>
                </div>
            </section>

            {/* Grid */}
            <section className="tk-grid">
                {DEVICES.map(d => (
                    <div key={d.id} className="tk-card">
                        <div className="tk-card-new">{d.badge}</div>
                        <div className="tk-card-title">{d.name}</div>
                        <img src={d.image} className="tk-card-img" alt={d.name} />
                        <div className="tk-price">From {fmt(d.price)}</div>
                        <button className="tk-buy-btn" onClick={() => addToCart(d)}>Buy</button>
                    </div>
                ))}
            </section>

            {/* Specs Comparison */}
            <section className="tk-specs">
                <h2>Which iPhone is right for you?</h2>
                <div className="tk-spec-grid">
                    <div className="tk-spec-item">
                        <div className="tk-spec-icon"><Camera /></div>
                        <div className="tk-spec-desc">Pro camera system <br /> 48MP Main | Ultra Wide | Telephoto</div>
                    </div>
                    <div className="tk-spec-item">
                        <div className="tk-spec-icon"><Zap /></div>
                        <div className="tk-spec-desc">A17 Pro chip <br /> with 6-core GPU</div>
                    </div>
                    <div className="tk-spec-item">
                        <div className="tk-spec-icon"><BatteryCharging /></div>
                        <div className="tk-spec-desc">Up to 29 hours <br /> video playback</div>
                    </div>
                </div>
            </section>

            {/* Cart Sidebar */}
            {cartOpen && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199 }} onClick={() => setCartOpen(false)} />
                    <div className="tk-cart">
                        <div className="tk-cart-head">
                            <div style={{ fontWeight: 600, fontSize: 18 }}>Bag</div>
                            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        {cart.length === 0 ? (
                            <div className="tk-cart-empty">Your bag is empty.</div>
                        ) : (
                            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                                {cart.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 15, marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 20 }}>
                                        <img src={item.image} style={{ width: 60, height: 60, objectFit: 'contain' }} />
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                                            <div style={{ color: 'var(--tk-blue)' }}>{fmt(item.price)}</div>
                                        </div>
                                    </div>
                                ))}
                                <button style={{ width: '100%', padding: 16, background: 'var(--tk-blue)', color: 'white', borderRadius: 12, border: 'none', fontWeight: 600, fontSize: 16 }}>
                                    Check Out
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
