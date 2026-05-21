'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Search, Menu, X, ChevronRight, ChevronLeft, Eye, ArrowRight, Star, Truck, Shield, RefreshCcw, Headphones, Mail, Loader2 } from 'lucide-react'
import ProductBottomSheet, { SheetProduct } from '@/components/ui/ProductBottomSheet'
import CartDrawer from '@/components/features/cart/CartDrawer'
import AuthModal from '@/components/auth/AuthModal'
import ChatWidget from '@/components/features/store/ChatWidget'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/store/marketplace'
import type { RealStore, RealProduct } from './MinimalTemplate'
import './EstiloShopTemplate.css'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ESTILO SHOP — Premium Fashion & Accessories Template                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface CartItem {
  product: RealProduct
  quantity: number
  selectedColors?: string[]
}

interface EstiloShopProps {
  store: RealStore
  products: RealProduct[]
  initialProductId?: string
}

// ─── Particle Background ───
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.4 + 0.1,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139, 92, 246, ${p.alpha})`
        ctx.fill()
      })

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.05 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

// ─── Intersection Observer Hook ───
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { el.classList.add('visible'); obs.unobserve(el) }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

// ─── Anime.js-style spring animations via CSS + JS ───
function useHeroAnimations() {
  useEffect(() => {
    const animate = () => {
      const title = document.querySelector('.es-hero-title') as HTMLElement
      const desc = document.querySelector('.es-hero-desc') as HTMLElement
      const cta = document.querySelector('.es-hero-cta') as HTMLElement

      if (title) {
        title.style.transition = 'opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1), transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)'
        title.style.transform = 'translateY(60px)'
        requestAnimationFrame(() => {
          title.style.opacity = '1'
          title.style.transform = 'translateY(0)'
        })
      }
      if (desc) {
        desc.style.transition = 'opacity 1s cubic-bezier(0.22, 1, 0.36, 1) 0.3s, transform 1s cubic-bezier(0.22, 1, 0.36, 1) 0.3s'
        desc.style.transform = 'translateY(40px)'
        requestAnimationFrame(() => {
          desc.style.opacity = '1'
          desc.style.transform = 'translateY(0)'
        })
      }
      if (cta) {
        cta.style.transition = 'opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s'
        cta.style.transform = 'translateY(30px) scale(0.9)'
        requestAnimationFrame(() => {
          cta.style.opacity = '1'
          cta.style.transform = 'translateY(0) scale(1)'
        })
      }
    }
    const timer = setTimeout(animate, 100)
    return () => clearTimeout(timer)
  }, [])
}

// ─── Marquee Content ───
const marqueeItems = [
  'NUEVA COLECCIÓN', 'ENVÍO GRATIS', 'MODA & ESTILO',
  'ACCESORIOS PREMIUM', 'TENDENCIA 2026', 'EXCLUSIVO',
]

export default function EstiloShopTemplate({ store, products, initialProductId }: EstiloShopProps) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SheetProduct | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutName, setCheckoutName] = useState('')
  const [checkoutPhone, setCheckoutPhone] = useState('')
  const [checkoutAddress, setCheckoutAddress] = useState('')
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'efipay'>('whatsapp')

  useHeroAnimations()

  // Parse store config
  let storeConfig: Record<string, any> = {}
  try {
    if (store.banner_url && store.banner_url.startsWith('{')) {
      storeConfig = JSON.parse(store.banner_url)
    }
  } catch {}

  let bannerUrls: string[] = []
  if (storeConfig.customUrls?.length) bannerUrls = storeConfig.customUrls
  else if (storeConfig.customUrl) bannerUrls = [storeConfig.customUrl]
  else if (store.banner_url && !store.banner_url.startsWith('{')) bannerUrls = [store.banner_url]

  // Categories
  const categories = Array.from(new Set(products.map(p => p.category_id || 'Otros')))
  const filteredProducts = activeFilter === 'all' ? products : products.filter(p => (p.category_id || 'Otros') === activeFilter)

  // Cart
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + (i.product.discount_price || i.product.price) * i.quantity, 0)

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auth check
  useEffect(() => {
    const check = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('role, name').eq('id', user.id).maybeSingle()
          const pName = String((profile as any)?.name || '').trim()
          if (!checkoutName && pName) setCheckoutName(pName)
        }
      } catch {}
    }
    check()
  }, [])

  // Product sheet opener
  const getMainImage = (images: unknown) => {
    const imgs = (images || []) as any[]
    if (imgs.length > 0) {
      const main = imgs.find((img: any) => img.isMain) || imgs[0]
      if (main) return main.full || main.thumbnail || '/placeholder.png'
    }
    return '/placeholder.png'
  }

  const handleOpenSheet = useCallback((p: RealProduct) => {
    let imagesArr: string[] = []
    if (Array.isArray(p.images)) {
      imagesArr = p.images.map((img: any) => img.full || img.thumbnail).filter(Boolean)
    }
    let desc = p.description || ''
    let addons: { id: string; nombre: string; precio: number }[] = []
    if (desc.includes('[ADDONS]')) {
      try { const parts = desc.split('[ADDONS]'); desc = parts[0]?.trim() || ''; addons = JSON.parse(parts[1] || '[]') } catch {}
    }
    setSelectedProduct({
      id: p.id, name: p.name, price: p.discount_price || p.price, originalPrice: p.price,
      discount: p.discount_price ? Math.round((1 - p.discount_price / p.price) * 100) : 0,
      image: getMainImage(p.images), images: imagesArr, storeName: store.name,
      storeColor: store.theme_color || undefined, category: p.category_id || '', description: desc, addons,
      variants: (p.product_variants || []).map((v: any) => ({
        color: v.color, colorHex: v.color_hex, size: v.size,
        images: v.images?.map((img: any) => img.full || img.thumbnail) || [],
      })),
      currency: p.currency || 'COP',
    })
    setIsSheetOpen(true)
  }, [store])

  // Initial product
  useEffect(() => {
    if (initialProductId) {
      const p = products.find(prod => prod.id === initialProductId)
      if (p) handleOpenSheet(p)
    }
  }, [initialProductId, products, handleOpenSheet])

  const addToCart = (product: RealProduct, quantity = 1, selectedColors: string[] = []) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && JSON.stringify(i.selectedColors?.sort()) === JSON.stringify(selectedColors.sort()))
      if (existing) return prev.map(i => i.product.id === product.id && JSON.stringify(i.selectedColors?.sort()) === JSON.stringify(selectedColors.sort()) ? { ...i, quantity: i.quantity + quantity } : i)
      return [...prev, { product, quantity, selectedColors }]
    })
    setIsCartOpen(true)
  }

  useEffect(() => {
    (window as any).addToCartFromAI = (productId: string) => {
      const prod = products.find(p => p.id === productId)
      if (prod) {
        addToCart(prod, 1)
        setIsCartOpen(true)
      }
    }
    return () => {
      delete (window as any).addToCartFromAI
    }
  }, [products])

  const scrollToProducts = () => {
    document.getElementById('es-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ─── Checkout logic (same as MinimalTemplate) ───
  const submitCheckout = async () => {
    if (checkoutLoading) return
    const name = checkoutName.trim()
    const phone = checkoutPhone.trim()
    const address = checkoutAddress.trim()
    if (!name) return alert('Ingresa tu nombre')
    if (!phone || phone.length < 7) return alert('Ingresa un teléfono válido')
    if (!address) return alert('Ingresa tu dirección')
    setCheckoutLoading(true)
    try {
      const items = cart.map(i => ({ productId: i.product.id, quantity: i.quantity, metadata: { selectedColors: i.selectedColors } }))
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id, items, paymentMethod: paymentMethod === 'efipay' ? 'efipay' : 'cash_on_delivery', shippingAddress: address, notes: checkoutNotes.trim() || null, buyerName: name, buyerPhone: phone }),
      })
      const data = await res.json().catch(() => ({}))
      const orderId = data?.order?.id || 'DIRECTO'

      if (paymentMethod === 'efipay' && orderId !== 'DIRECTO') {
        try {
          const efRes = await fetch('/api/efipay/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, storeSlug: store.slug }) })
          const efData = await efRes.json()
          if (efData.checkoutUrl) { setCart([]); setCheckoutOpen(false); window.location.href = efData.checkoutUrl; return }
          else { alert('Error al generar el pago.'); setCheckoutLoading(false); return }
        } catch { alert('Error conectando con pasarela.'); setCheckoutLoading(false); return }
      }

      const itemsText = cart.map(i => `• ${i.quantity}x ${i.product.name}${i.selectedColors?.length ? `\n   ↳ Colores: ${i.selectedColors.join(', ')}` : ''}`).join('\n')
      const header = orderId === 'DIRECTO' ? '*🛒 NUEVO PEDIDO DIRECTO*' : `*🛒 NUEVO PEDIDO #${orderId.slice(0, 8)}*`
      const orderText = `${header}\n----------------------------------\n\n*Detalle:*\n${itemsText}\n\n*Total:* $${cartTotal.toLocaleString('es-CO')}\n\n*Cliente:*\n• *Nombre:* ${name}\n• *Tel:* ${phone}\n• *Dir:* ${address}\n${checkoutNotes.trim() ? `• *Notas:* ${checkoutNotes.trim()}\n` : ''}\n----------------------------------\n_Enviado desde ${store.name} en LocalEcomer_`
      setCart([])
      setCheckoutOpen(false)
      if (window && (window as any).triggerChat) {
        (window as any).triggerChat(orderText)
      } else {
        alert('¡Pedido registrado con éxito! Te contactaremos a través del chat de la tienda.')
      }
    } catch { 
      alert('Error procesando pedido.') 
    } finally { 
      setCheckoutLoading(false) 
    }
  }

  // ─── Featured Carousel ───
  const [carouselIdx, setCarouselIdx] = useState(0)
  const featuredProducts = products.filter(p => p.discount_price && p.discount_price < p.price).slice(0, 5)
  const carouselProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, Math.min(5, products.length))

  useEffect(() => {
    if (carouselProducts.length <= 1) return
    const timer = setInterval(() => {
      setCarouselIdx(prev => (prev + 1) % carouselProducts.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [carouselProducts.length])

  // ─── Star Rating (deterministic per product) ───
  const getProductRating = (productId: string): { stars: number; reviews: number } => {
    let hash = 0
    for (let i = 0; i < productId.length; i++) hash = ((hash << 5) - hash) + productId.charCodeAt(i)
    const stars = Math.abs(hash) % 2 === 0 ? 5 : 4
    const reviews = (Math.abs(hash) % 150) + 12
    return { stars, reviews }
  }

  const renderStars = (count: number) => (
    <div className="es-stars">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13} fill={i <= count ? '#fbbf24' : 'none'} className={i <= count ? 'es-star' : 'es-star-empty'} />
      ))}
    </div>
  )

  // ─── Testimonials ───
  const testimonials = [
    { name: 'Carolina M.', initial: 'C', text: '"La calidad superó mis expectativas. El envío fue rápido y el empaque muy cuidado. 100% recomendada."', stars: 5, role: 'Cliente frecuente' },
    { name: 'Andrés R.', initial: 'A', text: '"Increíble variedad de productos. Compré un bolso y unas gafas, ambos de excelente calidad. Volveré pronto."', stars: 5, role: 'Primera compra' },
    { name: 'Valentina S.', initial: 'V', text: '"Me encantó el vestido que pedí. El talle fue perfecto y la tela es divina. La atención por WhatsApp fue inmediata."', stars: 4, role: 'Cliente frecuente' },
  ]

  // Reveal refs for sections
  const catRef = useReveal()
  const prodRef = useReveal()
  const bannerRef = useReveal()
  const trustRef = useReveal()
  const testimonialsRef = useReveal()
  const newsletterRef = useReveal()

  return (
    <div className="estilo-shop">
      {/* ─── NAVBAR ─── */}
      <nav className={`es-navbar ${scrolled ? 'scrolled' : ''}`}>
        <a className="es-nav-brand" href="#">
          {store.name.split(' ')[0]}<span>.{store.name.split(' ').slice(1).join('') || 'shop'}</span>
        </a>
        <div className="es-nav-actions">
          <button className="es-nav-btn" onClick={() => scrollToProducts()}>
            <Search size={20} />
          </button>
          <button className="es-nav-btn" onClick={() => setIsCartOpen(true)}>
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="es-cart-badge">{cartCount}</span>}
          </button>
          <button className="es-nav-btn es-menu-toggle" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="es-hero">
        {bannerUrls[0] && (
          <div className="es-hero-bg-img" style={{ backgroundImage: `url(${bannerUrls[0]})` }} />
        )}
        <div className="es-hero-overlay" />
        <ParticleField />

        <div className="es-hero-content">
          <div className="es-hero-tag">✦ Colección Exclusiva</div>
          <h1 className="es-hero-title">
            Define tu <em>Estilo</em>
          </h1>
          <p className="es-hero-desc">
            {store.description || 'Descubre piezas únicas de moda y accesorios seleccionados para quienes buscan elegancia y distinción.'}
          </p>
          <button className="es-hero-cta" onClick={scrollToProducts}>
            Explorar Colección <ArrowRight size={18} />
          </button>
        </div>

        <div className="es-hero-scroll">
          <span>Scroll</span>
          <div className="es-scroll-line" />
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <div className="es-marquee-section">
        <div className="es-marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span className="es-marquee-item" key={i}>
              <span className="es-marquee-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ─── FEATURED CAROUSEL ─── */}
      {carouselProducts.length > 0 && (
        <section style={{ padding: '80px 24px 40px', background: 'linear-gradient(180deg, var(--es-dark) 0%, var(--es-dark-gray) 100%)' }}>
          <div className="es-section-header">
            <span className="es-section-tag">✦ Destacados</span>
            <h2 className="es-section-title">Productos Estrella</h2>
          </div>
          <div className="es-featured-carousel">
            <div className="es-fc-track" style={{ transform: `translateX(-${carouselIdx * 100}%)` }}>
              {carouselProducts.map((p) => {
                const img = getMainImage(p.images)
                const isDisc = p.discount_price && p.discount_price < p.price
                const { stars, reviews } = getProductRating(p.id)
                return (
                  <div key={p.id} className="es-fc-slide" onClick={() => handleOpenSheet(p)}>
                    <div className="es-fc-slide-bg">
                      <img src={img} alt={p.name} />
                    </div>
                    <div className="es-fc-slide-overlay" />
                    <div className="es-fc-slide-content">
                      <span className="es-fc-slide-tag">
                        {isDisc ? '🔥 Oferta Especial' : '⭐ Destacado'}
                      </span>
                      <h3 className="es-fc-slide-title">{p.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        {renderStars(stars)}
                        <span className="es-rating-text">({reviews} reseñas)</span>
                      </div>
                      <div className="es-fc-slide-price">
                        {formatPrice(p.discount_price || p.price, p.currency)}
                        {isDisc && <span className="es-fc-slide-original">{formatPrice(p.price, p.currency)}</span>}
                      </div>
                      <p className="es-fc-slide-desc">
                        {(p.description || '').split('[ADDONS]')[0]?.slice(0, 120) || 'Producto premium seleccionado para ti.'}
                        {(p.description || '').length > 120 ? '...' : ''}
                      </p>
                      <button className="es-fc-slide-btn" onClick={e => { e.stopPropagation(); handleOpenSheet(p) }}>
                        Ver Producto <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Dots */}
            {carouselProducts.length > 1 && (
              <div className="es-fc-dots">
                {carouselProducts.map((_, i) => (
                  <button key={i} className={`es-fc-dot ${i === carouselIdx ? 'active' : ''}`} onClick={() => setCarouselIdx(i)} />
                ))}
              </div>
            )}
            {/* Nav Arrows */}
            {carouselProducts.length > 1 && (
              <>
                <button className="es-fc-nav es-fc-nav-left" onClick={() => setCarouselIdx(prev => prev === 0 ? carouselProducts.length - 1 : prev - 1)}>
                  <ChevronLeft size={22} />
                </button>
                <button className="es-fc-nav es-fc-nav-right" onClick={() => setCarouselIdx(prev => (prev + 1) % carouselProducts.length)}>
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {/* ─── CATEGORIES ─── */}
      {categories.length > 1 && (
        <section className="es-categories">
          <div className="es-section" ref={catRef} style={{ paddingBottom: 40 }}>
            <div className="es-section-header es-reveal" ref={catRef}>
              <span className="es-section-tag">Categorías</span>
              <h2 className="es-section-title">Explora por Estilo</h2>
            </div>
            <div className="es-cat-grid">
              {categories.map(cat => {
                const count = products.filter(p => (p.category_id || 'Otros') === cat).length
                return (
                  <div key={cat} className="es-cat-card" onClick={() => { setActiveFilter(cat); scrollToProducts() }}>
                    <div className="es-cat-card-content">
                      <h3 className="es-cat-name">{cat}</h3>
                      <span className="es-cat-count">{count} producto{count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── PRODUCTS ─── */}
      <section className="es-products-section" id="es-products">
        <div className="es-section" ref={prodRef}>
          <div className="es-section-header es-reveal" ref={prodRef}>
            <span className="es-section-tag">Productos</span>
            <h2 className="es-section-title">Nuestra Colección</h2>
            <p className="es-section-subtitle">Cada pieza cuidadosamente seleccionada para complementar tu estilo único</p>
          </div>

          {/* Filter */}
          <div className="es-filter-bar">
            <button className={`es-filter-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
              Todos
            </button>
            {categories.map(cat => (
              <button key={cat} className={`es-filter-btn ${activeFilter === cat ? 'active' : ''}`} onClick={() => setActiveFilter(cat)}>
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="es-product-grid">
            {filteredProducts.map((product, idx) => {
              const mainImg = getMainImage(product.images)
              const isDiscounted = product.discount_price && product.discount_price < product.price
              return (
                <div key={product.id} className="es-product-card" onClick={() => handleOpenSheet(product)}
                  style={{ animationDelay: `${idx * 0.08}s` }}>
                  <div className="es-product-img">
                    <img src={mainImg} alt={product.name} loading="lazy" />
                    {isDiscounted && (
                      <span className="es-product-badge">-{Math.round((1 - product.discount_price! / product.price) * 100)}%</span>
                    )}
                    <button className="es-product-quick" onClick={e => { e.stopPropagation(); handleOpenSheet(product) }}>
                      <Eye size={18} />
                    </button>
                  </div>
                  <div className="es-product-info">
                    <h3 className="es-product-name">{product.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      {renderStars(getProductRating(product.id).stars)}
                      <span className="es-rating-text">({getProductRating(product.id).reviews})</span>
                    </div>
                    <div className="es-product-price-row">
                      <span className="es-product-price">{formatPrice(product.discount_price || product.price, product.currency)}</span>
                      {isDiscounted && (
                        <span className="es-product-original">{formatPrice(product.price, product.currency)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURED BANNER ─── */}
      <div className="es-featured-banner es-reveal" ref={bannerRef}>
        <div className="es-featured-glow" />
        <div className="es-featured-text" style={{ position: 'relative', zIndex: 1 }}>
          <h2>Estilo que <em style={{ fontFamily: 'var(--es-font-display)', color: 'var(--es-purple-soft)' }}>Inspira</em></h2>
          <p>{store.description || 'Encuentra las últimas tendencias en moda y accesorios. Envíos a todo el país.'}</p>
          <button className="es-featured-btn" onClick={scrollToProducts}>
            Ver Colección <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ─── TRUST BADGES ─── */}
      <section className="es-trust-section">
        <div className="es-section es-reveal" ref={trustRef} style={{ paddingTop: 60, paddingBottom: 60 }}>
          <div className="es-trust-grid">
            {[
              { icon: <Truck size={24} />, title: 'Envío Rápido', desc: 'Entrega a domicilio en todo el país' },
              { icon: <Shield size={24} />, title: 'Pago Seguro', desc: 'Protección en todas tus compras' },
              { icon: <RefreshCcw size={24} />, title: 'Devoluciones', desc: 'Garantía de cambio en 30 días' },
              { icon: <Headphones size={24} />, title: 'Soporte 24/7', desc: 'Te ayudamos por WhatsApp' },
            ].map((badge, i) => (
              <div key={i} className="es-trust-item">
                <div className="es-trust-icon">{badge.icon}</div>
                <div className="es-trust-title">{badge.title}</div>
                <div className="es-trust-desc">{badge.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="es-testimonials">
        <div className="es-section es-reveal" ref={testimonialsRef}>
          <div className="es-section-header">
            <span className="es-section-tag">Opiniones</span>
            <h2 className="es-section-title">Lo que dicen nuestros clientes</h2>
            <p className="es-section-subtitle">Miles de clientes satisfechos respaldan nuestra calidad</p>
          </div>
          <div className="es-testimonial-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="es-testimonial-card">
                <div className="es-testimonial-stars">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={16} fill={s <= t.stars ? '#fbbf24' : 'none'} color={s <= t.stars ? '#fbbf24' : 'rgba(255,255,255,0.15)'} />
                  ))}
                </div>
                <p className="es-testimonial-text">{t.text}</p>
                <div className="es-testimonial-author">
                  <div className="es-testimonial-avatar">{t.initial}</div>
                  <div>
                    <div className="es-testimonial-name">{t.name}</div>
                    <div className="es-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="es-newsletter">
        <div className="es-section es-reveal" ref={newsletterRef} style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div className="es-newsletter-inner">
            <span className="es-section-tag"><Mail size={14} style={{ display: 'inline', verticalAlign: -2 }} /> Newsletter</span>
            <h2 className="es-section-title" style={{ fontSize: 'clamp(28px, 5vw, 40px)' }}>
              Sé el primero en enterarte
            </h2>
            <p className="es-section-subtitle" style={{ margin: '0 auto' }}>
              Recibe ofertas exclusivas, novedades y descuentos antes que nadie.
            </p>
            <div className="es-newsletter-form">
              <input type="email" className="es-newsletter-input" placeholder="Tu correo electrónico" />
              <button className="es-newsletter-btn">Suscribirme</button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="es-footer">
        <div className="es-footer-brand">
          {store.name.split(' ')[0]}<span>.{store.name.split(' ').slice(1).join('') || 'shop'}</span>
        </div>
        <p className="es-footer-desc">{store.description || 'Tu destino de moda y accesorios premium.'}</p>
        <div className="es-footer-links">
          <span className="es-footer-link" onClick={scrollToProducts}>Productos</span>
          {storeConfig.socialInstagram && <a className="es-footer-link" href={storeConfig.socialInstagram} target="_blank" rel="noreferrer">Instagram</a>}
          {storeConfig.socialFacebook && <a className="es-footer-link" href={storeConfig.socialFacebook} target="_blank" rel="noreferrer">Facebook</a>}
        </div>
        <div className="es-footer-copy">
          © {new Date().getFullYear()} {store.name}. Todos los derechos reservados.
        </div>
        <div className="es-footer-powered">Powered by LocalEcomer</div>
      </footer>

      {/* ─── SHARED COMPONENTS ─── */}
      {selectedProduct && (
        <ProductBottomSheet
          product={selectedProduct}
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onAddToCart={(p, _, colors) => {
            const realP = products.find(prod => prod.id === p.id)
            if (realP) addToCart(realP, 1, colors)
          }}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        storeName={store.name}
        onRemove={(id) => setCart(prev => prev.filter(item => item.product.id !== id))}
        onUpdateQuantity={(id, qty) => setCart(prev => prev.map(item => item.product.id === id ? { ...item, quantity: qty } : item))}
        onCheckout={() => {
          setIsCartOpen(false)
          setCheckoutOpen(true)
        }}
      />

      {checkoutOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-[#2d2d44] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-drawer-slide-in">
            <div className="p-5 border-b border-white/5 bg-[#1a1a2e] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Checkout</div>
                <div className="font-black text-white text-lg">Datos para tu pedido</div>
              </div>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">Nombre Completo</div>
                <input
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1a2e] text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">Teléfono de Contacto</div>
                <input
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1a2e] text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="Ej: 3001234567"
                />
              </div>
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">Dirección de Entrega</div>
                <textarea
                  value={checkoutAddress}
                  onChange={(e) => setCheckoutAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1a2e] text-white focus:outline-none focus:border-violet-500 transition-colors min-h-[80px]"
                  placeholder="Barrio, calle, apto/casa, ciudad..."
                />
              </div>
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">Notas Especiales (opcional)</div>
                <textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1a2e] text-white focus:outline-none focus:border-violet-500 transition-colors min-h-[60px]"
                  placeholder="Ej: entregar en recepción..."
                />
              </div>

              {/* Método de pago */}
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">Método de Pago</div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentMethod('whatsapp')}
                    className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                      paymentMethod === 'whatsapp'
                        ? 'border-violet-500 bg-violet-500/10 text-white'
                        : 'border-white/10 bg-[#1a1a2e] text-gray-400'
                    }`}
                  >
                    <div className="text-xl mb-1">📱</div>
                    <div className="text-xs font-black">Pago contra entrega</div>
                    <div className="text-[9px] opacity-60 mt-1">Paga en casa al recibir</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('efipay')}
                    className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                      paymentMethod === 'efipay'
                        ? 'border-violet-500 bg-violet-500/10 text-white'
                        : 'border-white/10 bg-[#1a1a2e] text-gray-400'
                    }`}
                  >
                    <div className="text-xl mb-1">💳</div>
                    <div className="text-xs font-black">EfiPay (Card / PSE)</div>
                    <div className="text-[9px] opacity-60 mt-1">Pago digital 100% seguro</div>
                  </button>
                </div>
              </div>

              <div className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 flex items-center justify-between mt-4">
                <div>
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total del Pedido</div>
                  <div className="text-xl font-black text-violet-400">{formatPrice(cartTotal, cart[0]?.product?.currency)}</div>
                </div>
                <button
                  onClick={submitCheckout}
                  disabled={checkoutLoading}
                  className="px-6 py-3.5 bg-white text-black hover:bg-violet-400 hover:text-white rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2 cursor-pointer shadow-lg animate-pulse"
                >
                  {checkoutLoading ? <Loader2 className="animate-spin" size={16} /> : <ShoppingBag size={18} />}
                  Confirmar Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuth && (
        <AuthModal 
          onClose={() => setShowAuth(false)} 
          onSuccess={() => {
            setShowAuth(false)
            router.push('/dashboard')
          }}
        />
      )}
      <ChatWidget 
        storeId={store.id} 
        storeName={store.name} 
        themeColor={store.theme_color || '#7c3aed'} 
      />
    </div>
  )
}
