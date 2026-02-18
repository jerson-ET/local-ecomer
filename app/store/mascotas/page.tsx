'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    Search, ShoppingCart, Heart, Plus, X, Minus, Trash2,
    Star, ChevronRight, User, ArrowLeft, MessageCircle
} from 'lucide-react'
import Link from 'next/link'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                TIPOS                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Product {
    id: string
    name: string
    price: number
    originalPrice?: number
    category: string
    image: string
    rating: number
    reviews: number
    tag?: string
    tagType?: 'new' | 'sale' | 'popular' | 'organic'
    description?: string // Added description
}

interface CartItem {
    product: Product
    quantity: number
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           DATOS DE PRODUCTOS                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

const products: Product[] = [
    {
        id: 'pet-1',
        name: 'Alimento Premium Perro Adulto 15kg',
        price: 89900,
        originalPrice: 109900,
        category: 'Alimento',
        image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600',
        rating: 4.9,
        reviews: 842,
        tag: 'BESTSELLER',
        tagType: 'popular',
        description: 'Alimento balanceado con ingredientes naturales para perros adultos de todas las razas. Fortalece el sistema inmune y mejora el pelaje.',
    },
    {
        id: 'pet-2',
        name: 'Collar Ajustable con Cascabel para Gato',
        price: 24900,
        category: 'Accesorios',
        image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600',
        rating: 4.7,
        reviews: 324,
        tag: 'NUEVO',
        tagType: 'new',
        description: 'Collar seguro y cómodo con cascabel. Material suave que no irrita la piel de tu gato.',
    },
    {
        id: 'pet-3',
        name: 'Juguete Interactivo Hueso Mordedor',
        price: 19900,
        originalPrice: 29900,
        category: 'Juguetes',
        image: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=600',
        rating: 4.8,
        reviews: 567,
        tag: '-33%',
        tagType: 'sale',
        description: 'Hueso resistente para morder, ideal para limpiar los dientes y entretener a tu perro.',
    },
    {
        id: 'pet-4',
        name: 'Cama Ortopédica Premium Talla L',
        price: 149900,
        category: 'Camas',
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600',
        rating: 4.9,
        reviews: 218,
        tag: 'POPULAR',
        tagType: 'popular',
        description: 'La mejor cama para el descanso de tu mascota. Espuma viscoelástica que se adapta al cuerpo y alivia la presión en las articulaciones.',
    },
    {
        id: 'pet-5',
        name: 'Alimento Natural Gato Premium 5kg',
        price: 64900,
        originalPrice: 79900,
        category: 'Alimento',
        image: 'https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=600',
        rating: 4.6,
        reviews: 445,
        tag: 'ORGÁNICO',
        tagType: 'organic',
        description: 'Fórmula especial para gatos esterilizados. Controla el peso y previene problemas urinarios.',
    },
    {
        id: 'pet-6',
        name: 'Arnés Deportivo Reflectivo Perro',
        price: 44900,
        category: 'Accesorios',
        image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600',
        rating: 4.8,
        reviews: 189,
        tag: 'NUEVO',
        tagType: 'new',
        description: 'Arnés ergonómico con bandas reflectivas para paseos nocturnos seguros.',
    },
    {
        id: 'pet-7',
        name: 'Kit Aseo Completo Mascota',
        price: 34900,
        originalPrice: 49900,
        category: 'Higiene',
        image: 'https://images.unsplash.com/photo-1583337130417-13104dec14a3?w=600',
        rating: 4.5,
        reviews: 312,
        tag: '-30%',
        tagType: 'sale',
        description: 'Incluye champú, cepillo y cortauñas. Todo lo necesario para mantener a tu mascota limpia.',
    },
    {
        id: 'pet-8',
        name: 'Transportadora Viajera Premium',
        price: 119900,
        category: 'Accesorios',
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600',
        rating: 4.7,
        reviews: 156,
        description: 'Transportadora aprobada por aerolíneas. Resistente y ventilada para viajes largos.',
    },
    {
        id: 'pet-9',
        name: 'Snacks Naturales Variados x12',
        price: 15900,
        category: 'Alimento',
        image: 'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?w=600',
        rating: 4.9,
        reviews: 720,
        tag: 'BESTSELLER',
        tagType: 'popular',
        description: 'Snacks saludables sin conservantes artificiales. Perfectos para entrenamiento.',
    },
    {
        id: 'pet-10',
        name: 'Pelota Lanzadora Automática',
        price: 79900,
        originalPrice: 99900,
        category: 'Juguetes',
        image: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600',
        rating: 4.6,
        reviews: 98,
        tag: '-20%',
        tagType: 'sale',
        description: 'Lanzador automático de pelotas. Mantiene a tu perro activo incluso cuando no estás.',
    },
]

const categories = [
    { id: 'all', name: 'Todos', icon: '🐾' },
    { id: 'Alimento', name: 'Alimento', icon: '🍖' },
    { id: 'Accesorios', name: 'Accesorios', icon: '🎀' },
    { id: 'Juguetes', name: 'Juguetes', icon: '🎾' },
    { id: 'Camas', name: 'Camas', icon: '🛏️' },
    { id: 'Higiene', name: 'Higiene', icon: '🧴' },
]

const brands = [
    { name: 'Royal Canin', icon: '👑' },
    { name: 'Purina Pro', icon: '⭐' },
    { name: 'Hills Science', icon: '🔬' },
    { name: 'Dog Chow', icon: '🐕' },
    { name: 'Whiskas', icon: '🐈' },
    { name: 'Pedigree', icon: '🏆' },
]

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        COMPONENTE PRINCIPAL                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { Suspense } from 'react'

function MascotasStoreContent() {
    const searchParams = useSearchParams()

    // State
    const [cart, setCart] = useState<CartItem[]>([])
    const [cartOpen, setCartOpen] = useState(false)
    const [activeCategory, setActiveCategory] = useState('all')
    const [wishlist, setWishlist] = useState<string[]>([])

    // Product Detail Modal State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    // Check search params for direct product access
    useEffect(() => {
        const productId = searchParams.get('product')
        if (productId) {
            const product = products.find(p => p.id === productId)
            if (product) {
                setSelectedProduct(product)
            }
        }
    }, [searchParams])

    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.category === activeCategory)

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price)
    }

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { product, quantity: 1 }]
        })
        setCartOpen(true) // Open cart when adding
    }

    const updateQty = (productId: string, delta: number) => {
        setCart(prev =>
            prev.map(item =>
                item.product.id === productId
                    ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                    : item
            )
        )
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId))
    }

    const toggleWishlist = (productId: string) => {
        setWishlist(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        )
    }

    const handleWhatsAppCheckout = () => {
        const phoneNumber = '573001234567' // Replace with real number
        let message = `Hola Patitas Felices! 🐾\nMe interesa pedir lo siguiente:\n\n`

        cart.forEach(item => {
            message += `• ${item.quantity}x ${item.product.name} - ${formatPrice(item.product.price * item.quantity)}\n`
        })

        message += `\n*Total: ${formatPrice(cartTotal)}*`
        message += `\n\n¿Podrían confirmarme disponibilidad y envío? Gracias!`

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    return (
        <div className="pet-store">
            {/* ─────────── Header ─────────── */}
            <header className="pet-header">
                <div className="pet-header-left">
                    <Link href="/dashboard" className="pet-back-btn">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="pet-brand">
                        <span className="pet-brand-icon">🐾</span>
                        <span className="pet-brand-name">
                            Patitas <span>Felices</span>
                        </span>
                    </div>
                </div>
                <div className="pet-header-right">
                    <button className="pet-icon-btn">
                        <Search size={20} />
                    </button>
                    <button className="pet-icon-btn">
                        <User size={20} />
                    </button>
                    <button
                        className="pet-icon-btn"
                        onClick={() => setCartOpen(true)}
                    >
                        <ShoppingCart size={20} />
                        {cartCount > 0 && (
                            <span className="pet-cart-badge">{cartCount}</span>
                        )}
                    </button>
                </div>
            </header>

            {/* ─────────── Hero ─────────── */}
            <section className="pet-hero">
                <div className="pet-hero-badge">
                    🎉 ENVÍO GRATIS EN TU PRIMERA COMPRA
                </div>
                <h1>
                    Todo para tu<br />
                    <em>mejor amigo</em> 🐶🐱
                </h1>
                <p className="pet-hero-subtitle">
                    Alimento premium, accesorios y más para consentir a tu mascota
                </p>
                <button className="pet-hero-btn" onClick={() => {
                    const element = document.getElementById('products-grid');
                    element?.scrollIntoView({ behavior: 'smooth' });
                }}>
                    Explorar Productos
                    <ChevronRight size={16} />
                </button>
            </section>

            {/* ─────────── Stats Bar ─────────── */}
            <div className="pet-stats-bar">
                <div className="pet-stat-item">
                    <div className="pet-stat-value">500+</div>
                    <div className="pet-stat-label">Productos</div>
                </div>
                <div className="pet-stat-item">
                    <div className="pet-stat-value">24h</div>
                    <div className="pet-stat-label">Entrega</div>
                </div>
                <div className="pet-stat-item">
                    <div className="pet-stat-value">4.9★</div>
                    <div className="pet-stat-label">Rating</div>
                </div>
                <div className="pet-stat-item">
                    <div className="pet-stat-value">15K+</div>
                    <div className="pet-stat-label">Clientes</div>
                </div>
            </div>

            {/* ─────────── Categories ─────────── */}
            <section className="pet-section">
                <div className="pet-section-header">
                    <h2 className="pet-section-title">
                        <span className="emoji">🏷️</span> Categorías
                    </h2>
                </div>
                <div className="pet-categories">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`pet-category-card ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <span className="pet-category-icon">{cat.icon}</span>
                            <span className="pet-category-name">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* ─────────── Products ─────────── */}
            <section className="pet-section" style={{ paddingTop: 0 }} id="products-grid">
                <div className="pet-section-header">
                    <h2 className="pet-section-title">
                        <span className="emoji">✨</span>
                        {activeCategory === 'all' ? 'Productos Destacados' : activeCategory}
                    </h2>
                    <button className="pet-see-all">
                        Ver todo <ChevronRight size={14} />
                    </button>
                </div>
                <div className="pet-products-grid">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="pet-product-card" onClick={() => setSelectedProduct(product)}>
                            <div className="pet-product-image">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    loading="lazy"
                                />
                                {product.tag && (
                                    <span className={`pet-product-tag ${product.tagType || ''}`}>
                                        {product.tag}
                                    </span>
                                )}
                                <button
                                    className={`pet-product-wishlist ${wishlist.includes(product.id) ? 'liked' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleWishlist(product.id)
                                    }}
                                >
                                    <Heart
                                        size={16}
                                        fill={wishlist.includes(product.id) ? '#ff6b6b' : 'none'}
                                    />
                                </button>
                            </div>
                            <div className="pet-product-info">
                                <div className="pet-product-category">{product.category}</div>
                                <h3 className="pet-product-name">{product.name}</h3>
                                <div className="pet-product-price-row">
                                    <span className="pet-product-price">
                                        {formatPrice(product.price)}
                                    </span>
                                    {product.originalPrice && (
                                        <>
                                            <span className="pet-product-original">
                                                {formatPrice(product.originalPrice)}
                                            </span>
                                            <span className="pet-product-discount">
                                                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="pet-product-footer">
                                    <div className="pet-product-rating">
                                        <Star size={12} fill="#feca57" stroke="#feca57" />
                                        <span>{product.rating} ({product.reviews})</span>
                                    </div>
                                    <button
                                        className="pet-add-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            addToCart(product)
                                        }}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─────────── Promo Banner ─────────── */}
            <section className="pet-promo-banner">
                <div className="pet-promo-emoji">🎁</div>
                <h3 className="pet-promo-title">¡Primera compra con 20% OFF!</h3>
                <p className="pet-promo-desc">
                    Usa el código PATITAS20 en tu primer pedido
                </p>
                <button className="pet-promo-btn">
                    Aplicar Descuento
                    <ChevronRight size={14} />
                </button>
            </section>

            {/* ─────────── Brands ─────────── */}
            <section className="pet-section">
                <div className="pet-section-header">
                    <h2 className="pet-section-title">
                        <span className="emoji">💛</span> Marcas que Amamos
                    </h2>
                </div>
                <div className="pet-brands">
                    {brands.map(brand => (
                        <div key={brand.name} className="pet-brand-chip">
                            <span className="chip-icon">{brand.icon}</span>
                            {brand.name}
                        </div>
                    ))}
                </div>
            </section>

            {/* ─────────── Footer ─────────── */}
            <footer className="pet-footer">
                <div className="pet-footer-brand">
                    🐾 PATITAS FELICES
                </div>
                <p>Todo para tu mascota, con amor ❤️</p>
                <div className="pet-footer-links">
                    <a href="#">Términos</a>
                    <a href="#">Privacidad</a>
                    <a href="#">Contacto</a>
                    <a href="#">FAQ</a>
                    <a href="#">Envíos</a>
                </div>
            </footer>

            {/* ─────────── Product Detail Modal ─────────── */}
            {selectedProduct && (
                <div className="pet-modal-overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="pet-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="pet-modal-close" onClick={() => setSelectedProduct(null)}>
                            <X size={24} />
                        </button>

                        <div className="pet-modal-image">
                            <img src={selectedProduct.image} alt={selectedProduct.name} />
                        </div>

                        <div className="pet-modal-details">
                            <div className="pet-modal-cat">{selectedProduct.category}</div>
                            <h2 className="pet-modal-title">{selectedProduct.name}</h2>

                            <div className="pet-modal-price-row">
                                <span className="pet-modal-price">{formatPrice(selectedProduct.price)}</span>
                                {selectedProduct.originalPrice && (
                                    <span className="pet-modal-original">{formatPrice(selectedProduct.originalPrice)}</span>
                                )}
                            </div>

                            <p className="pet-modal-desc">
                                {selectedProduct.description || 'Descripción del producto no disponible.'}
                            </p>

                            <div className="pet-modal-options">
                                <h4>Colores Disponibles</h4>
                                <div className="pet-colors">
                                    <span className="pet-color" style={{ background: '#333' }} />
                                    <span className="pet-color" style={{ background: '#e74c3c' }} />
                                    <span className="pet-color" style={{ background: '#3498db' }} />
                                </div>
                            </div>

                            <div className="pet-modal-options">
                                <h4>Tallas Disponibles</h4>
                                <div className="pet-colors" style={{ gap: '12px' }}>
                                    <span className="pet-size-pill">S</span>
                                    <span className="pet-size-pill">M</span>
                                    <span className="pet-size-pill">L</span>
                                </div>
                            </div>

                            <div className="pet-modal-actions">
                                <button
                                    className="pet-modal-add-btn"
                                    onClick={() => {
                                        addToCart(selectedProduct)
                                        setSelectedProduct(null)
                                    }}
                                >
                                    Agregar al Carrito - {formatPrice(selectedProduct.price)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─────────── Cart Sidebar ─────────── */}
            {cartOpen && (
                <>
                    <div className="pet-cart-overlay" onClick={() => setCartOpen(false)} />
                    <div className="pet-cart-sidebar">
                        <div className="pet-cart-header">
                            <h2>🛒 Carrito ({cartCount})</h2>
                            <button className="pet-cart-close" onClick={() => setCartOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="pet-cart-empty">
                                <div className="pet-cart-empty-icon">🐾</div>
                                <h3>Tu carrito está vacío</h3>
                                <p>¡Agrega cositas para tu mascota!</p>
                            </div>
                        ) : (
                            <>
                                <div className="pet-cart-items">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="pet-cart-item">
                                            <div className="pet-cart-item-img">
                                                <img src={item.product.image} alt={item.product.name} />
                                            </div>
                                            <div className="pet-cart-item-info">
                                                <div className="pet-cart-item-name">{item.product.name}</div>
                                                <div className="pet-cart-item-price">
                                                    {formatPrice(item.product.price * item.quantity)}
                                                </div>
                                                <div className="pet-cart-qty">
                                                    <button
                                                        className="pet-qty-btn"
                                                        onClick={() => updateQty(item.product.id, -1)}
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span>{item.quantity}</span>
                                                    <button
                                                        className="pet-qty-btn"
                                                        onClick={() => updateQty(item.product.id, 1)}
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                className="pet-cart-remove"
                                                onClick={() => removeFromCart(item.product.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="pet-cart-footer">
                                    <div className="pet-cart-subtotal">
                                        <span>Envío</span>
                                        <span style={{ color: '#27ae60', fontWeight: 700 }}>GRATIS 🎉</span>
                                    </div>
                                    <div className="pet-cart-total">
                                        <span className="pet-cart-total-label">Total</span>
                                        <span className="pet-cart-total-value">
                                            {formatPrice(cartTotal)}
                                        </span>
                                    </div>
                                    <button
                                        className="pet-checkout-btn whatsapp"
                                        onClick={handleWhatsAppCheckout}
                                    >
                                        <MessageCircle size={20} />
                                        Pedir por WhatsApp
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default function MascotasStorePage() {
    return (
        <Suspense fallback={<div>Cargando tienda...</div>}>
            <MascotasStoreContent />
        </Suspense>
    )
}
