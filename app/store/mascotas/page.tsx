'use client'

import { useState } from 'react'
import {
  Search,
  ShoppingBag,
  Heart,
  Plus,
  X,
  Minus,
  Trash2,
  PawPrint,
  Home,
  User,
  Bone,
  Github,
} from 'lucide-react'
import Link from 'next/link'

interface PetProduct {
  id: string
  name: string
  price: number
  category: string
  brand: string
  image: string
  badge?: string
}

interface CartItem {
  product: PetProduct
  quantity: number
}

const products: PetProduct[] = [
  {
    id: 'pt-1',
    name: 'Alimento Premium Adultos x 15kg',
    price: 185000,
    category: 'Alimentación',
    brand: 'ProDog',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600',
    badge: 'MÁS VENDIDO',
  },
  {
    id: 'pt-2',
    name: 'Cama Ortopédica Extra Suave',
    price: 95000,
    category: 'Descanso',
    brand: 'PetDreams',
    image: 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=600',
  },
  {
    id: 'pt-3',
    name: 'Juguete Rascador Torre para Gatos',
    price: 120000,
    category: 'Juguetes',
    brand: 'CatFun',
    image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=600',
    badge: 'NUEVO',
  },
  {
    id: 'pt-4',
    name: 'Correa Retráctil Automática 5m',
    price: 45000,
    category: 'Paseo',
    brand: 'WalkSafe',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600',
  },
  {
    id: 'pt-5',
    name: 'Shampoo Avena Piel Sensible',
    price: 32000,
    category: 'Higiene',
    brand: 'VetCare',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600',
  },
  {
    id: 'pt-6',
    name: 'Comedero Lento Antiestrés',
    price: 28000,
    category: 'Accesorios',
    brand: 'SmartEat',
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600',
    badge: 'OFERTA',
  },
  {
    id: 'pt-7',
    name: 'Plato Cerámica Premium Paw & Co.',
    price: 65000,
    category: 'Accesorios',
    brand: 'PawBoutique',
    image: '/mascotas-bowl.png',
    badge: 'EXCLUSIVO',
  },
]

const categories = [
  { name: 'Todos', icon: PawPrint },
  { name: 'Alimentación', icon: Bone },
  { name: 'Descanso', icon: Home },
  { name: 'Juguetes', icon: Github },
]

export default function MascotasStorePage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [wishlist, setWishlist] = useState<string[]>([])

  const filteredProducts =
    activeCategory === 'Todos' ? products : products.filter((p) => p.category === activeCategory)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const addToCart = (product: PetProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) }
        }
        return item
      })
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const fmt = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val)

  return (
    <div className="pt-store">
      <header className="pt-header">
        <Link href="/tiendas" className="pt-icon-btn" style={{ textDecoration: 'none' }}>
          <Home size={20} />
        </Link>
        <div className="pt-brand">
          <PawPrint className="pt-brand-icon" size={28} />
          PetConnect
        </div>
        <button className="pt-icon-btn" onClick={() => setCartOpen(true)}>
          <ShoppingBag size={20} />
          {cartCount > 0 && <span className="pt-cart-count">{cartCount}</span>}
        </button>
      </header>

      <section className="pt-hero">
        <div className="pt-hero-badge">¡Felices Patitas!</div>
        <h1>
          Amor en
          <br />
          cada detalle.
        </h1>
        <p>Los mejores productos para tu perrito o gatito.</p>
        <PawPrint className="pt-hero-paw" />
      </section>

      <section className="pt-categories-wrap">
        <h2 className="pt-section-title">¿Qué buscas hoy?</h2>
        <div className="pt-categories">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <div
                key={cat.name}
                className={`pt-category ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                <div className="pt-cat-icon">
                  <Icon size={28} />
                </div>
                <span className="pt-cat-label">{cat.name}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="pt-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="pt-card">
            {product.badge && <span className="pt-card-badge">{product.badge}</span>}
            <button
              className={`pt-card-like ${wishlist.includes(product.id) ? 'liked' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleWishlist(product.id)
              }}
            >
              <Heart size={18} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} />
            </button>
            <img src={product.image} alt={product.name} className="pt-card-img" />

            <div className="pt-card-brand">{product.brand}</div>
            <h3 className="pt-card-name">{product.name}</h3>

            <div className="pt-card-footer">
              <span className="pt-card-price">{fmt(product.price)}</span>
              <button
                className="pt-add-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  addToCart(product)
                }}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="pt-banner">
        <div className="pt-banner-content">
          <h2>Agrega a tu Familia</h2>
          <p>Adopta, no compres. Conoce nuestras jornadas de adopción locales.</p>
          <button className="pt-banner-btn">Saber más</button>
        </div>
      </section>

      <nav className="pt-nav">
        <button className="pt-nav-item active">
          <Home size={24} />
        </button>
        <button className="pt-nav-item">
          <Search size={24} />
        </button>
        <button className="pt-nav-item" onClick={() => setCartOpen(true)}>
          <ShoppingBag size={24} />
        </button>
        <button className="pt-nav-item">
          <User size={24} />
        </button>
      </nav>

      {cartOpen && (
        <div className="pt-cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="pt-cart-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="pt-cart-header">
              <h2>Tu Canasta ({cartCount})</h2>
              <button
                className="pt-icon-btn"
                style={{ width: 36, height: 36 }}
                onClick={() => setCartOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div
                style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--pt-text-light)' }}
              >
                <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                <h3>No hay productos aún</h3>
                <p style={{ fontSize: 14 }}>Engríe a tu mascota agregando algo al carrito.</p>
              </div>
            ) : (
              <div className="pt-cart-items">
                {cart.map((item) => (
                  <div key={item.product.id} className="pt-cart-item">
                    <img src={item.product.image} alt={item.product.name} className="pt-cart-img" />
                    <div className="pt-cart-info">
                      <div className="pt-cart-name">{item.product.name}</div>
                      <div className="pt-cart-price">{fmt(item.product.price * item.quantity)}</div>
                      <div className="pt-cart-qty">
                        <button
                          className="pt-qty-btn"
                          onClick={() => updateQty(item.product.id, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{item.quantity}</span>
                        <button
                          className="pt-qty-btn"
                          onClick={() => updateQty(item.product.id, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="pt-icon-btn"
                      style={{ width: 32, height: 32, aspectRatio: '1/1', color: '#EF4444' }}
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="pt-cart-footer">
                <button className="pt-checkout-btn">
                  <span>Pagar Ahora</span>
                  <span>{fmt(cartTotal)}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
