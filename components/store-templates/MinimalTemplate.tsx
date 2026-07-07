'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Menu,
  X,
  User,
  RefreshCw,
  Tag,
  Heart,
  HeartOff,
} from 'lucide-react'

import MarketplaceCarousel from '@/components/features/marketplace/MarketplaceCarousel'

import ProductBottomSheet, { SheetProduct } from '@/components/ui/ProductBottomSheet'
import CartDrawer from '@/components/features/cart/CartDrawer'
import AuthModal from '@/components/auth/AuthModal'

import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/store/marketplace'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           TIPOS Y PROPS                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface RealStore {
  id: string
  name: string
  slug: string
  description: string | null
  theme_color: string | null
  banner_url: string | null
  whatsapp_number?: string | null
}

export interface RealProduct {
  id: string
  name: string
  description: string | null
  price: number
  discount_price?: number | null
  category_id: string | null
  images: { full: string; thumbnail: string; isMain: boolean }[] | unknown
  stock: number
  is_active: boolean
  product_variants?: { color: string; color_hex: string; size: string; images: any[]; id: string }[]
  currency?: string
  created_at?: string
  updated_at?: string
}

interface CartItem {
  product: RealProduct
  quantity: number
  selectedColors?: string[]
  ignoreDiscount?: boolean
}

interface MinimalTemplateProps {
  store: RealStore
  products: RealProduct[]
  initialProductId?: string | undefined
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        COMPONENTE TEMPLATE                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface MinimalTemplateProps {
  store: RealStore
  products: RealProduct[]
  initialProductId?: string
}

function ProductImageSlider({ 
  product, 
  onCardClick 
}: { 
  product: RealProduct; 
  onCardClick: () => void 
}) {
  const images = (product.images as any[]) || []
  const [currentIndex] = useState(0)





  // Detectamos si lo queremos marcar como "NUEVA" aleatoriamente o si es un producto real. (Lo forzamos en la maqueta como se pidió).
  const isNew = true 
  const isDiscounted = product.discount_price && product.discount_price < product.price
  const currentImg = images[currentIndex]?.full || images[currentIndex]?.thumbnail || (product.images as any[])?.[0] || ''

  return (
    <div className="cs-product-card" onClick={onCardClick}>
      <div className="cs-product-image-container">
        <img src={currentImg} alt={product.name} loading="lazy" />
        
        <div className="cs-overlay">
          <span className="cs-btn-detalles">Ver detalles</span>
        </div>
        
        {isNew && <div className="cs-badge-new">NUEVA</div>}
        {isDiscounted && !isNew && <div className="cs-badge-new" style={{background: '#ef4444'}}>OFERTA</div>}

        {images.length > 1 && (
          <div className="cs-dots-container">
            {images.map((_, i) => (
              <div key={i} className={`cs-card-dot ${currentIndex === i ? 'active' : ''}`} />
            ))}
          </div>
        )}
      </div>
      <div className="cs-product-title">{product.name}</div>
      <div className="cs-product-price">{formatPrice(product.discount_price || product.price, product.currency)}</div>
    </div>
  )
}

function CategoryCarousel({ 
  catProducts, 
  handleOpenSheet 
}: { 
  catProducts: RealProduct[]; 
  handleOpenSheet: (p: RealProduct) => void 
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="cs-carousel-wrapper">
      <button className="cs-carousel-nav cs-carousel-nav-left" onClick={() => scroll('left')}>
        <ChevronLeft size={24} />
      </button>
      <button className="cs-carousel-nav cs-carousel-nav-right" onClick={() => scroll('right')}>
        <ChevronRight size={24} />
      </button>
      
      <div className="cs-products-carousel" ref={scrollRef}>
        {catProducts.map(product => (
          <ProductImageSlider 
            key={product.id} 
            product={product} 
            onCardClick={() => handleOpenSheet(product)} 
          />
        ))}
      </div>
    </div>
  )
}

export default function MinimalTemplate({
  store,
  products,
  initialProductId,
}: MinimalTemplateProps) {
  const router = useRouter()
  const storeConfig = useMemo(() => {
    let config: Record<string, any> = {}
    try {
      if (store.banner_url && store.banner_url.startsWith('{')) {
        config = JSON.parse(store.banner_url)
      }
    } catch {}
    return config
  }, [store.banner_url])

  const [cart, setCart] = useState<CartItem[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)
  const [pendingCartItem, setPendingCartItem] = useState<{product: RealProduct, quantity: number, selectedColors: string[]} | null>(null)

  const [selectedSheetProduct, setSelectedSheetProduct] = useState<SheetProduct | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutName, setCheckoutName] = useState('')
  const [checkoutPhone, setCheckoutPhone] = useState('')
  const [checkoutAddress, setCheckoutAddress] = useState('')
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [paymentMethod] = useState<'whatsapp' | 'efipay'>('whatsapp')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')

  // Map products to MarketplaceProduct format for MarketplaceCarousel
  const mappedProducts = useMemo(() => {
    return products.map((p) => {
      let discountPercent = null
      if (p.discount_price && p.discount_price < p.price) {
        discountPercent = Math.round(((p.price - p.discount_price) / p.price) * 100)
      }

      const imgs = (p.images || []) as any[]
      let mainImg = '/placeholder.png'
      if (imgs.length > 0) {
        const main = imgs.find((img: any) => img.isMain) || imgs[0]
        if (main) {
          mainImg = main.thumbnail || main.full || '/placeholder.png'
        }
      }

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        discountPrice: p.discount_price || null,
        discountPercent: discountPercent,
        category: p.category_id || 'Otros',
        mainImage: mainImg,
        createdAt: p.created_at || new Date().toISOString(),
        updatedAt: p.updated_at || new Date().toISOString(),
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
          theme_color: store.theme_color || '#ff5a26',
        }
      }
    })
  }, [products, store])

  const storeCategories = useMemo(() => {
    const cats = Array.from(new Set(mappedProducts.map((p) => p.category).filter(Boolean)))
    return ['Todos', ...cats]
  }, [mappedProducts])

  const filteredProducts = useMemo(() => {
    let result = [...mappedProducts]

    if (selectedCategory !== 'Todos') {
      result = result.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      )
    }

    if (sortBy === 'newest') {
      // Keep original order
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price))
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price))
    }

    return result
  }, [mappedProducts, selectedCategory, search, sortBy])

  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: typeof mappedProducts } = {}
    filteredProducts.forEach((product) => {
      const cat = product.category || 'Otros'
      if (!groups[cat]) {
        groups[cat] = []
      }
      groups[cat].push(product)
    })
    return groups
  }, [filteredProducts])

  const sortedCategoryNames = useMemo(() => {
    const categoriesInGroup = Object.keys(groupedProducts)
    return categoriesInGroup.sort((a, b) => {
      const indexA = storeCategories.indexOf(a)
      const indexB = storeCategories.indexOf(b)
      const posA = indexA === -1 ? Infinity : indexA
      const posB = indexB === -1 ? Infinity : indexB
      return posA - posB
    })
  }, [groupedProducts, storeCategories])

  const carouselRows = useMemo(() => {
    const rows: { categoryName: string; rowTitle: string; products: typeof mappedProducts }[] = []
    sortedCategoryNames.forEach((categoryName) => {
      const categoryProducts = groupedProducts[categoryName] || []
      if (categoryProducts.length === 0) return
      for (let i = 0; i < categoryProducts.length; i += 12) {
        const chunk = categoryProducts.slice(i, i + 12)
        const rowTitle = i === 0 
          ? categoryName 
          : `${categoryName} - Línea ${Math.floor(i / 12) + 1}`
        rows.push({ categoryName, rowTitle, products: chunk })
      }
    })
    return rows
  }, [sortedCategoryNames, groupedProducts])

  const hasDiscounts = useMemo(() => {
    return mappedProducts.some(p => p.discountPrice && p.discountPrice < p.price)
  }, [mappedProducts])

  const handleResetFilters = () => {
    setSearch('')
    setSelectedCategory('Todos')
    setSortBy('newest')
  }



  useEffect(() => {
    if (initialProductId) {
      const p = products.find((prod) => prod.id === initialProductId)
      if (p) handleOpenSheet(p)
    }
  }, [initialProductId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).triggerAI = (productName: string) => {
        // We'll use a custom event to notify AI Store Assistant
        const event = new CustomEvent('le-trigger-ai', { detail: { productName } })
        window.dispatchEvent(event)
      }
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    async function loadRole() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        setIsLoggedIn(true)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, name')
          .eq('id', user.id)
          .maybeSingle()
        if (!isMounted) return

        const profileName = String((profile as { name?: string | null } | null)?.name || '').trim()
        if (!checkoutName) {
          const fallbackName = profileName || String(user.user_metadata?.name || '').trim()
          if (fallbackName) setCheckoutName(fallbackName)
        }
      } catch {
        if (!isMounted) return

      }
    }
    loadRole()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    async function checkFollow() {
      try {
        const res = await fetch(`/api/stores/follow?storeId=${store.id}`)
        if (res.ok) {
          const data = await res.json()
          setIsFollowing(data.following)
          setFollowerCount(data.followerCount)
        }
      } catch {}
    }
    checkFollow()
  }, [store.id])

  const handleFollow = async () => {
    if (!isLoggedIn) { setShowAuthModal(true); return }
    setFollowLoading(true)
    try {
      const res = await fetch('/api/stores/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id })
      })
      if (res.ok) {
        const data = await res.json()
        setIsFollowing(data.following)
        setFollowerCount(data.followerCount)
      }
    } catch {} finally { setFollowLoading(false) }
  }


  // Extraer categorías únicas de los productos reales
  const dynamicCats = Array.from(
    new Set(products.map((p) => p.category_id || 'Otros').filter(Boolean))
  )

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.ignoreDiscount ? item.product.price : (item.product.discount_price || item.product.price)) * item.quantity,
    0
  )

  const handleOpenSheet = (p: RealProduct) => {
    let imagesArr: string[] = []
    if (Array.isArray(p.images)) {
      imagesArr = p.images.map((img) => img.full || img.thumbnail).filter(Boolean) as string[]
    }

    let desc = p.description || ''
    let addons: { id: string; nombre: string; precio: number }[] = []
    if (desc.includes('[ADDONS]')) {
      try {
        const parts = desc.split('[ADDONS]')
        desc = parts[0]?.trim() || ''
        addons = JSON.parse(parts[1] || '[]')
      } catch (e) {
        console.error('Error parsing addons', e)
      }
    }

    setSelectedSheetProduct({
      id: p.id,
      name: p.name,
      price: p.discount_price || p.price,
      originalPrice: p.price,
      discount: p.discount_price ? Math.round((1 - p.discount_price / p.price) * 100) : 0,
      image: getMainImage(p.images),
      images: imagesArr,
      storeName: store.name,
      storeColor: store.theme_color || undefined,
      category: p.category_id || '',
      description: desc,
      addons,
      variants: (p.product_variants || []).map((v: any) => ({
        color: v.color,
        colorHex: v.color_hex,
        size: v.size,
        images: v.images?.map((img: any) => img.full || img.thumbnail) || [],
      })),
      currency: p.currency || 'COP',
      storeLocation: storeConfig.shippingLocation || undefined,
    })
    setIsSheetOpen(true)
  }

  // Effect to automatically open sheet if initialProductId is present
  useEffect(() => {
    if (store.id && products.length > 0 && typeof store === 'object') {
      const urlParams = new URLSearchParams(window.location.search)
      const paramId = urlParams.get('productId')
      if (paramId) {
        const prod = products.find((p) => p.id === paramId)
        if (prod) {
          handleOpenSheet(prod)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]) // Only run once or when products arrive

  const scrollToProducts = () => {
    const element = document.getElementById('catalog-section');
    if (element) {
      const yOffset = -80; // Offset for header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }
  }

  const confirmAddToCart = (item: {product: RealProduct, quantity: number, selectedColors: string[]}, ignoreDiscount: boolean = false) => {
    setCart((prev) => {
      const existing = prev.find((i) => 
        i.product.id === item.product.id && 
        JSON.stringify(i.selectedColors?.sort()) === JSON.stringify(item.selectedColors.sort())
      )
      
      if (existing) {
        return prev.map((i) =>
          i.product.id === item.product.id &&
          JSON.stringify(i.selectedColors?.sort()) === JSON.stringify(item.selectedColors.sort())
            ? { ...i, quantity: i.quantity + item.quantity, ignoreDiscount }
            : i
        )
      }
      return [...prev, { ...item, ignoreDiscount }]
    })
    setIsCartOpen(true)
  }

  const addToCart = (product: RealProduct, quantity: number = 1, selectedColors: string[] = []) => {
    const hasDiscount = product.discount_price && product.discount_price < product.price;
    if (hasDiscount && !isFollowing) {
      setPendingCartItem({ product, quantity, selectedColors });
      return;
    }
    
    confirmAddToCart({ product, quantity, selectedColors }, false)
  }



  // Helper para obtener imagen principal
  const getMainImage = (images: unknown) => {
    const imgs = (images || []) as any[]
    if (imgs.length > 0) {
      const main = imgs.find((img: any) => img.isMain) || imgs[0]
      if (main) return main.full || main.thumbnail || '/placeholder.png'
    }
    return '/placeholder.png'
  }



  let parsedBannerUrls: string[] = []
  if (storeConfig.customUrls && storeConfig.customUrls.length > 0) {
    parsedBannerUrls = storeConfig.customUrls
  } else if (storeConfig.customUrl) {
    parsedBannerUrls = [storeConfig.customUrl]
  } else if (store.banner_url && !store.banner_url.startsWith('{')) {
    parsedBannerUrls = [store.banner_url]
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

  useEffect(() => {
    if (parsedBannerUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % parsedBannerUrls.length)
      }, 4000)
      return () => clearInterval(interval)
    }
    return undefined
  }, [parsedBannerUrls.length])



  const openCheckout = () => {
    if (cart.length === 0) return
    setCheckoutOpen(true)
  }

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
      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        metadata: { selectedColors: item.selectedColors }
      }))



      // Crear la orden en la BD
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          items,
          paymentMethod: paymentMethod === 'efipay' ? 'efipay' : 'cash_on_delivery',
          shippingAddress: address,
          notes: checkoutNotes.trim() || null,
          buyerName: name,
          buyerPhone: phone,
        }),
      })

      const data = await res.json().catch(() => ({}))
      const orderId = data?.order?.id || 'DIRECTO'

      /* ═══ FLUJO EFIPAY: Pago en línea ═══ */
      if (paymentMethod === 'efipay' && orderId !== 'DIRECTO') {
        try {
          const efipayRes = await fetch('/api/efipay/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              storeSlug: store.slug,
            }),
          })

          const efipayData = await efipayRes.json()

          if (efipayData.checkoutUrl) {
            // Limpiar carrito y redirigir a Efipay
            setCart([])
            setCheckoutOpen(false)
            window.location.href = efipayData.checkoutUrl
            return
          } else {
            alert('Error al generar el pago. Intenta de nuevo o usa WhatsApp.')
            setCheckoutLoading(false)
            return
          }
        } catch (efipayErr) {
          console.error('Efipay error:', efipayErr)
          alert('Error conectando con la pasarela de pago. Intenta de nuevo.')
          setCheckoutLoading(false)
          return
        }
      }

      /* ═══ FLUJO WHATSAPP: Contra entrega ═══ */
      const itemsListText = cart.map(item => {
        const colorsStr = item.selectedColors && item.selectedColors.length > 0 
          ? `\n   ↳ Colores: ${item.selectedColors.join(', ')}` 
          : '';
        return `• ${item.quantity}x ${item.product.name} ${colorsStr}`;
      }).join('\n');

      const orderHeader = orderId === 'DIRECTO' ? '*🛒 NUEVO PEDIDO DIRECTO*' : `*🛒 NUEVO PEDIDO #${orderId.slice(0, 8)}*`

      const orderText =
        `${orderHeader}\n` +
        `----------------------------------\n\n` +
        `*Detalle del Pedido:*\n${itemsListText}\n\n` +
        `*Total:* $${cartTotal.toLocaleString('es-CO')}\n\n` +
        `*Datos del Cliente:*\n` +
        `• *Nombre:* ${name}\n` +
        `• *Teléfono:* ${phone}\n` +
        `• *Dirección:* ${address}\n` +
        (checkoutNotes.trim() ? `• *Notas:* ${checkoutNotes.trim()}\n` : '') +
        `\n----------------------------------\n` +
        `_Enviado desde tu tienda ${store.name} en LocalEcomer_`

      setCart([])
      setCheckoutOpen(false)

      if (window && (window as any).triggerChat) {
        (window as any).triggerChat(orderText)
      } else {
        alert('¡Pedido registrado con éxito! Te contactaremos a través del chat de la tienda.')
      }

    } catch (err: any) {
      console.error('Submit process error, using fallback:', err)
      const itemsListText = cart.map(item => `• ${item.quantity}x ${item.product.name}`).join('\n');
      const fallbackText = `*🛒 NUEVO PEDIDO DIRECTO (FALLBACK)*\n` +
        `----------------------------------\n\n` +
        `*Detalle:* \n${itemsListText}\n\n` +
        `*Total:* $${cartTotal.toLocaleString('es-CO')}\n\n` +
        `*Nombre:* ${checkoutName.trim()}\n*Teléfono:* ${checkoutPhone.trim()}\n*Dirección:* ${checkoutAddress.trim()}\n` +
        `_Nota: Error de sincronización de base de datos._`

      setCart([])
      setCheckoutOpen(false)
      if (window && (window as any).triggerChat) {
        (window as any).triggerChat(fallbackText)
      } else {
        alert('¡Pedido registrado con éxito! Te contactaremos a través del chat de la tienda.')
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center custom-store-root">
      {/* Estilos inyectados específicos para el nuevo modelo unificado de la tienda */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;700;800&display=swap');
        
        .custom-store-root {
          font-family: 'Inter', sans-serif;
          color: #2F3542;
        }
        .search-glow:focus-within {
          box-shadow: 0 0 0 3px rgba(255, 90, 38, 0.15);
          border-color: #ff5a26;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #94a3b8 #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 5px;
          display: block !important;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .cs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          position: sticky;
          top: 0;
          background: #fafafa;
          z-index: 50;
        }
        .cs-brand {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #1a1a1a;
          margin-left: 10px;
        }
        .cs-hero {
          position: relative;
          width: 100%;
          min-height: 55vh;
          background: linear-gradient(to bottom, #dedede 0%, #a8a8a8 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 20px;
          color: white;
        }
        .cs-hero-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.8;
          z-index: 0;
        }
        .cs-hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .cs-hero-subtitle {
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 24px;
          opacity: 0.9;
        }
        .cs-hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: 56px;
          line-height: 1.1;
          margin: 0 0 40px;
          font-weight: 400;
          text-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .cs-hero button {
          background: white;
          color: #1a1a1a;
          padding: 14px 40px;
          border-radius: 30px;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 1.5px;
          border: none;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          cursor: pointer;
        }
        .cs-hero-dots {
          position: absolute;
          bottom: 20px;
          display: flex;
          gap: 8px;
          z-index: 1;
        }
        .cs-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
        }
        .cs-dot.active {
          width: 24px;
          border-radius: 4px;
          background: white;
        }
        .cs-category-section {
          padding: 40px 0 10px;
          background: white;
        }
        .cs-category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          margin-bottom: 24px;
        }

        .cs-search-dropdown {
          position: absolute;
          top: 100%;
          right: 20px;
          width: 230px;
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(25px);
          z-index: 200;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: 0 15px 40px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.8) inset;
          border-radius: 0 0 24px 24px;
          max-height: 0;
          opacity: 0;
          pointer-events: none;
        }
        .cs-search-dropdown.open {
          max-height: 500px;
          opacity: 1;
          padding: 12px 0;
          pointer-events: auto;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,1) inset;
        }
        .cs-search-item {
          padding: 16px 24px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #1c1c1e;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: transparent;
        }
        .cs-search-item:hover {
          background: rgba(255, 255, 255, 0.5);
          padding-left: 30px;
          color: #000;
          text-shadow: 0 0 10px rgba(255,255,255,1);
        }
        .cs-search-item span { margin-right: 8px; }

        .cs-carousel-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'Playfair Display', serif;
          font-size: 19px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-weight: 700;
          color: #2F3542;
        }
        .cs-category-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'Playfair Display', serif;
          font-size: 19px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-weight: 700;
          color: #2F3542;
        }
        .cs-category-line {
          height: 1px;
          background: #9f6b53;
          width: 30px;
        }
        .cs-nav-arrows {
          display: flex;
          gap: 12px;
        }
        .cs-nav-arrow {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #eaeaea;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          background: white;
        }
        .cs-products-carousel {
          display: grid;
          grid-template-columns: repeat(2, 1fr); /* 2 por fila en teléfono */
          gap: 1px; /* Espacio mínimo de 1px (medio pixel por lado) */
          padding: 0 1px 20px;
        }
        .cs-products-carousel::-webkit-scrollbar {
          display: none;
        }
        .cs-product-card {
          width: 100% !important;
          min-width: 0 !important;
          position: relative;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .cs-product-card:hover {
          transform: translateY(-4px); 
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
          border-color: #cbd5e1;
        }

        .cs-product-image-container {
          width: 100%;
          aspect-ratio: 1;
          background: #F8F8F8;
          position: relative;
          margin-bottom: 12px;
          overflow: hidden;
          border-radius: 14px;
        }
        .cs-product-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .cs-product-card:hover .cs-product-image-container img {
          transform: scale(1.05);
        }
        
        .cs-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 15;
        }
        .cs-product-card:hover .cs-overlay {
          opacity: 1;
        }
        .cs-btn-detalles {
          background: rgba(255,255,255,0.95);
          color: #0f172a;
          font-weight: 800;
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 12px;
          transform: translateY(10px);
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
        }
        .cs-product-card:hover .cs-btn-detalles {
          transform: translateY(0);
        }
        
        .cs-badge-new {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #9f6b53;
          color: white;
          font-size: 10px;
          letter-spacing: 1px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 4px;
          z-index: 20;
        }
        .cs-product-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
          color: #1e293b;
          text-transform: none;
          line-height: 1.4;
          padding: 0 4px;
        }
        .cs-product-price {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          padding: 0 4px 4px;
        }
        .cs-add-btn {
          position: absolute;
          bottom: -20px;
          right: 20px;
          background: #00E676;
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0,230,118,0.3);
          z-index: 20;
          border: none;
          cursor: pointer;
        }

        .cs-carousel-wrapper {
          position: relative;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        .cs-carousel-nav {
          display: none !important; /* Habilitado grid en todo, ocultar flechas de carrusel */
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .cs-products-carousel {
            grid-template-columns: repeat(5, 1fr); /* 5 por fila en tablet */
            padding: 0 24px 20px;
            gap: 4px;
          }
        }

        @media (min-width: 1024px) {
          .cs-products-carousel {
            grid-template-columns: repeat(6, 1fr); /* 6 por fila en computador */
            padding: 0 40px 20px;
            gap: 4px;
          }
        }

        .cs-footer {
          background: #050505;
          padding: 80px 20px 40px;
          text-align: center;
          color: #a3a3a3;
          border-top: 1px solid #1a1a1a;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .cs-footer h2 {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 400;
          letter-spacing: 4px;
          margin-bottom: 24px;
          color: #ffffff;
          text-transform: uppercase;
        }
        .cs-footer p {
          font-size: 13px;
          color: #737373;
          max-width: 500px;
          margin: 0 auto 16px;
          line-height: 1.8;
          font-weight: 300;
        }
        .cs-footer-links h3 {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 3px;
          margin-bottom: 24px;
          color: #ffffff;
          text-transform: uppercase;
        }
        .cs-footer-links a, .cs-footer-links button {
          display: block;
          color: #737373;
          font-size: 12px;
          margin: 0 auto 12px auto;
          text-decoration: none;
          transition: color 0.3s ease;
          font-weight: 300;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
        .cs-footer-links a:hover, .cs-footer-links button:hover {
          color: #ffffff;
        }
        .cs-whatsapp-float {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #00E676;
          color: white;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0,230,118,0.4);
          z-index: 100;
        }
        .cs-menu-drawer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: white;
          z-index: 200;
          display: flex;
          flex-direction: column;
          padding: 20px;
          animation: slideIn 0.3s forwards;
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>


      <div className="w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] max-w-full">
        <div className={`h-full overflow-y-auto no-scrollbar bg-white`}>
          <div
            style={{
              width: '100%',
              maxWidth: '100%',
              background: 'white',
              position: 'relative',
              boxShadow: 'none',
              transition: 'max-width 0.3s ease',
              margin: '0 auto',
            }}
          >
            {/* Header unificado */}
            <header className="cs-header">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={() => setIsMenuOpen(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                  <Menu size={24} color="#1a1a1a" />
                </button>
                <div className="flex items-center gap-3 ml-2">
                  <div className="cs-brand" style={{ marginLeft: 0 }}>{store.name}</div>
                  
                  <button 
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-70 ${
                      isFollowing 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-sm'
                    }`}
                  >
                    {followLoading ? <Loader2 size={12} className="animate-spin" /> : 
                      isFollowing ? <HeartOff size={12} /> : <Heart size={12} className={isFollowing ? 'fill-current' : ''} />
                    }
                    {isFollowing ? 'Siguiendo' : 'Suscribirse'}
                    <span className="opacity-70">({followerCount})</span>
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', transition: 'transform 0.2s' }}
                  className={isSearchOpen ? 'scale-90' : ''}
                >
                  {isSearchOpen ? <X size={22} color="#FF5A26" /> : <Search size={22} color="#1a1a1a" />}
                </button>
                <button
                  onClick={() => isLoggedIn ? router.push('/dashboard') : router.push('/login')}
                  className="flex flex-col items-center justify-center p-2 text-slate-500 hover:text-slate-900 transition-colors"
                  title={isLoggedIn ? 'Mi Cuenta' : 'Iniciar Sesión'}
                >
                  <User size={22} color="#1a1a1a" />
                  {isLoggedIn && (
                    <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', border: '1.5px solid #fafafa' }} />
                  )}
                </button>
                <div style={{ position: 'relative' }} className="cursor-pointer" onClick={() => setIsCartOpen(true)}>
                  <ShoppingBag size={22} color="#1a1a1a" />
                  {cartCount > 0 && (
                    <span style={{ position: 'absolute', top: -5, right: -8, background: '#1c1c1e', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                      {cartCount}
                    </span>
                  )}
                </div>
              </div>

              {/* SEARCH DROPDOWN */}
              <div className={`cs-search-dropdown ${isSearchOpen ? 'open' : ''}`}>
                {dynamicCats.map(cat => (
                  <div 
                    key={cat} 
                    className="cs-search-item"
                    onClick={() => {
                      setSelectedCategory(cat);
                      const el = document.getElementById('catalog-section');
                      if (el) {
                        const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }
                      setIsSearchOpen(false);
                    }}
                  >
                    {cat}
                    <span>→</span>
                  </div>
                ))}
              </div>
            </header>

            {/* Menu Drawer */}
            {isMenuOpen && (
              <div className="cs-menu-drawer">
                <div className="cs-menu-header">
                  <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    <X size={32} color="#1a1a1a" />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '20px' }}>
                  <button 
                    onClick={() => {
                      setSelectedCategory('Todos');
                      setIsMenuOpen(false);
                      const el = document.getElementById('catalog-section');
                      if (el) {
                        const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }
                    }} 
                    className="cs-menu-link text-left"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    Inicio
                  </button>
                  {dynamicCats.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsMenuOpen(false);
                        const el = document.getElementById('catalog-section');
                        if (el) {
                          const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
                          window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                      }} 
                      className="cs-menu-link text-left"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      {cat}
                    </button>
                  ))}
                  <button 
                    onClick={() => {
                      setSelectedCategory('Todos');
                      setIsMenuOpen(false);
                      const el = document.getElementById('catalog-section');
                      if (el) {
                        const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }
                    }} 
                    className="cs-menu-link text-left"
                    style={{ color: '#ef4444', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    Ofertas
                  </button>
                </div>
              </div>
            )}

            {/* Hero Banner */}
            <section className="cs-hero" style={{ position: 'relative' }}>
              {parsedBannerUrls.length > 0 && parsedBannerUrls.map((url, index) => (
                <div 
                  key={index}
                  className="cs-hero-bg" 
                  style={{ 
                    backgroundImage: `url(${url})`,
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    opacity: currentSlide === index ? 1 : 0,
                    transition: 'opacity 1s ease-in-out',
                    zIndex: currentSlide === index ? 1 : 0
                  }}
                ></div>
              ))}
              <div className="cs-hero-content" style={{ zIndex: 10, position: 'relative' }}>
                <div className="cs-hero-subtitle">NUEVA COLECCIÓN</div>
                <h1>{store.name}</h1>
                {storeConfig.shippingLocation && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(10px)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    marginBottom: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                  }}>
                    📍 {storeConfig.shippingLocation}
                  </div>
                )}
                <button onClick={scrollToProducts}>DESCUBRIR</button>
              </div>
              {parsedBannerUrls.length > 1 && (
                <div className="cs-hero-dots" style={{ zIndex: 10, position: 'relative' }}>
                  {parsedBannerUrls.map((_, index) => (
                    <div 
                      key={index}
                      className={`cs-dot ${currentSlide === index ? 'active' : ''}`}
                      onClick={() => setCurrentSlide(index)}
                      style={{ cursor: 'pointer' }}
                    ></div>
                  ))}
                </div>
              )}
            </section>

            {/* ─── BANNER CARRUSEL (DESCUENTOS - AL INICIO DEL TODO) ─── */}
            {hasDiscounts && (
              <div className="w-full max-w-[1920px] mx-auto px-0 sm:px-6 lg:px-8 mt-10">
                <MarketplaceCarousel 
                  products={mappedProducts} 
                  title="Descuentos"
                  subtitle="Ofertas exclusivas por 24 horas"
                  filterDiscounts={true}
                  heightClass="h-[380px] sm:h-[400px]"
                  desktopItems={3}
                  mobileItems={1.3}
                  showPagination={true}
                  showArrows={true}
                  autoPlay={false}
                  hideTextOverlay={true}
                  marginClass="mb-6 sm:mb-10"
                  roundedClass="rounded-none"
                  borderClass="border-0"
                  shadowClass="shadow-none"
                  showStoreBadge={false}
                />
              </div>
            )}

            {/* ─── BARRA DE BUSQUEDA, CATEGORÍAS Y FILTROS (EN EL MEDIO) ─── */}
            <div id="catalog-section" className="w-full max-w-[1920px] mx-auto px-0 sm:px-6 lg:px-8 py-4">
              <div className="px-4 sm:px-0 space-y-6 mb-8">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                  {/* Input de Búsqueda */}
                  <div className="flex-1 min-w-[280px]">
                    <div className="relative search-glow border-2 border-slate-200 bg-white rounded-md flex items-center px-4 py-3.5 transition-all">
                      <Search className="text-slate-400 mr-3 shrink-0" size={20} />
                      <input
                        type="text"
                        placeholder="Buscar por producto o categoría..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent outline-none font-bold text-slate-800 placeholder-slate-400 text-base"
                      />
                      {search && (
                        <button
                          onClick={() => setSearch('')}
                          className="text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-500 px-2 py-1 rounded-lg transition-colors shrink-0"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selector de ordenación */}
                  <div className="flex items-center gap-2 lg:self-stretch">
                    <span className="text-xs font-black uppercase text-slate-400 tracking-wider hidden sm:inline">
                      Ordenar por:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="bg-white border-2 border-slate-200 rounded-md px-4 py-3.5 font-bold text-slate-700 text-sm outline-none cursor-pointer focus:border-slate-950 transition-colors"
                    >
                      <option value="newest">Más recientes</option>
                      <option value="price-asc">Precio: de menor a mayor</option>
                      <option value="price-desc">Precio: de mayor a menor</option>
                    </select>
                  </div>
                </div>

                {/* Categorías (Scroll Horizontal en móvil) */}
                {storeCategories.length > 1 && (
                  <div className="relative">
                    <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                      {storeCategories.map((cat) => {
                        const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 rounded-md text-sm font-black whitespace-nowrap border transition-all ${
                              isActive
                                ? 'bg-slate-950 text-white border-slate-950 shadow-sm scale-[1.02]'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800'
                            }`}
                          >
                            {cat}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── BLOQUE DE PRODUCTOS Y CARRUSELES (ABAJO) ─── */}
              <div className="space-y-6">
                <div className="px-4 sm:px-0 flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                    <span>Productos</span>
                    <span className="bg-slate-100 text-slate-600 text-xs font-black px-2.5 py-1 rounded-full">
                      {filteredProducts.length}
                    </span>
                  </h2>
                  {(search || selectedCategory !== 'Todos' || sortBy !== 'newest') && (
                    <button
                      onClick={handleResetFilters}
                      className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-md transition-all"
                    >
                      <RefreshCw size={12} />
                      Reestablecer Filtros
                    </button>
                  )}
                </div>

                {filteredProducts.length === 0 ? (
                  /* Estado vacío */
                  <div className="mx-4 sm:mx-0 flex flex-col items-center justify-center text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 animate-bounce">
                      <ShoppingBag size={28} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No se encontraron productos</h3>
                    <p className="text-slate-500 font-bold max-w-sm mb-6 text-sm">
                      Intenta cambiar los términos de búsqueda o selecciona otra categoría en los filtros.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-6 py-3 bg-slate-950 hover:bg-slate-900 text-white font-black rounded-md text-sm transition-all"
                    >
                      Ver todos los productos
                    </button>
                  </div>
                ) : (
                  /* Carruseles de Categorías integrados verticalmente sin espacios ni títulos de sección */
                  <div className="space-y-0 overflow-hidden bg-white">
                    {carouselRows.map((row, idx) => {
                      const isLast = idx === carouselRows.length - 1
                      const borderStyle = isLast ? 'border-0' : 'border-0 border-b border-slate-100'

                      return (
                        <MarketplaceCarousel
                          key={`${row.rowTitle}-${idx}`}
                          products={row.products}
                          heightClass="h-[260px] sm:h-[340px]"
                          desktopItems={3}
                          mobileItems={1.5}
                          filterDiscounts={false}
                          showPagination={true}
                          showArrows={true}
                          autoPlay={false}
                          hideTextOverlay={true}
                          marginClass="mb-0"
                          roundedClass="rounded-none"
                          borderClass={borderStyle}
                          shadowClass="shadow-none"
                          showStoreBadge={false}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Unificado */}
            <footer className="cs-footer">
              <h2>{store.name}</h2>
              <p style={{ whiteSpace: 'pre-line', marginBottom: '8px' }}>
                {store.description || 'La mejor selección de productos. Calidad y confort en cada detalle.'}
              </p>
              {storeConfig.footerInfo && (
                 <p style={{ opacity: 0.6 }}>{storeConfig.footerInfo}</p>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', width: '100%', maxWidth: '800px', margin: '40px auto 20px', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '50px 0' }}>
                <div className="cs-footer-links">
                  <h3>CATÁLOGO</h3>
                  <button onClick={(e) => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(window.location.href);
                      const btn = e.currentTarget;
                      const originalText = 'COMPARTIR TIENDA';
                      btn.innerText = '¡COPIADO! VE A WHATSAPP Y PÉGALO';
                      btn.style.color = '#ffffff';
                      setTimeout(() => {
                        btn.innerText = originalText;
                      }, 3000);
                    }
                  }}>
                    COMPARTIR TIENDA
                  </button>
                  {dynamicCats.slice(0, 4).map(cat => (
                     <a key={cat} href={`#cat-${cat}`}>{cat}</a>
                  ))}
                </div>
                
                {(storeConfig.socialFacebook || storeConfig.socialInstagram) && (
                  <div className="cs-footer-links">
                    <h3>SOCIAL</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {storeConfig.socialInstagram && (
                        <a href={storeConfig.socialInstagram} target="_blank" rel="noopener noreferrer">
                          Instagram
                        </a>
                      )}
                      {storeConfig.socialFacebook && (
                        <a href={storeConfig.socialFacebook} target="_blank" rel="noopener noreferrer">
                          Facebook
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="cs-footer-links">
                  <h3>SOPORTE</h3>
                  <a href="#">Preguntas Frecuentes</a>
                  <a href="#">Políticas de Envío</a>
                  {storeConfig.shippingLocation && (
                    <a href="#" style={{ cursor: 'default' }}>Envíos desde: {storeConfig.shippingLocation}</a>
                  )}
                </div>
              </div>
              
              <div style={{ fontSize: '11px', color: '#525252', letterSpacing: '1px', textTransform: 'uppercase' }}>
                 © {new Date().getFullYear()} {store.name}. ALL RIGHTS RESERVED.
              </div>
            </footer>

            {/* Bottom Sheet Modal y Asistente IA mantenidos de la arquitectura original */}
            <ProductBottomSheet
              isOpen={isSheetOpen}
              onClose={() => {
                setIsSheetOpen(false)
                setSelectedSheetProduct(null)
                // Clear the productId parameter from the URL query string
                const url = new URL(window.location.href)
                if (url.searchParams.has('productId')) {
                  url.searchParams.delete('productId')
                  window.history.replaceState({}, '', url.pathname + url.search)
                }
              }}
              product={selectedSheetProduct}
              onAddToCart={(p, _, colors) => {
                const prod = products.find(orig => orig.id === p.id)
                if (prod) addToCart(prod, 1, colors)
              }}
            />

            <CartDrawer
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              cart={cart}
              storeName={store.name}
              onRemove={(id) => setCart(prev => prev.filter(item => item.product.id !== id))}
              onUpdateQuantity={(id, qty) => setCart(prev => prev.map(item => item.product.id === id ? { ...item, quantity: qty } : item))}
              onCheckout={() => {
                setIsCartOpen(false)
                openCheckout()
              }}
            />
          </div>
        </div>
      </div>

      {checkoutOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Checkout</div>
                <div className="font-black text-gray-900">Datos para tu pedido</div>
              </div>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="px-3 py-2 rounded-2xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-black text-xs"
              >
                Cerrar
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs font-black text-gray-500 uppercase mb-1">Nombre</div>
                <input
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <div className="text-xs font-black text-gray-500 uppercase mb-1">Teléfono</div>
                <input
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  placeholder="Ej: 3001234567"
                />
              </div>
              <div>
                <div className="text-xs font-black text-gray-500 uppercase mb-1">Dirección</div>
                <textarea
                  value={checkoutAddress}
                  onChange={(e) => setCheckoutAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white min-h-[80px]"
                  placeholder="Barrio, calle, apto/casa, ciudad..."
                />
              </div>
              <div>
                <div className="text-xs font-black text-gray-500 uppercase mb-1">Notas (opcional)</div>
                <textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white min-h-[70px]"
                  placeholder="Ej: dejar en portería, llamar al llegar..."
                />
              </div>

              {/* ═══ Método de pago ═══ */}
              <div>
                <div className="text-xs font-black text-gray-500 uppercase mb-2">Método de pago</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div
                    style={{
                      flex: 1,
                      padding: '14px 12px',
                      borderRadius: '16px',
                      border: '2px solid #22c55e',
                      background: '#f0fdf4',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>📱</div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>
                      Contra entrega
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                      Paga al recibir tu pedido
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-end justify-between">
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase">Total</div>
                  <div className="text-lg font-black text-gray-900">${cartTotal.toLocaleString('es-CO')}</div>
                </div>
                <button
                  onClick={submitCheckout}
                  disabled={checkoutLoading}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '16px',
                    background: '#0f172a',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '14px',
                    border: 'none',
                    cursor: checkoutLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: checkoutLoading ? 0.7 : 1,
                  }}
                >
                  {checkoutLoading ? <Loader2 className="spinning" size={16} /> : <ShoppingBag size={18} />}
                  Pedir ya
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingCartItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">¡Aprovecha el descuento!</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Este producto tiene un descuento especial. Para aplicarlo, solo necesitas suscribirte a <strong className="text-gray-900">{store.name}</strong>.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={async () => {
                  if (!isLoggedIn) {
                    setShowAuthModal(true);
                    return;
                  }
                  await handleFollow();
                  confirmAddToCart(pendingCartItem, false);
                  setPendingCartItem(null);
                }}
                disabled={followLoading}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-3.5 rounded-2xl transition-all hover:scale-105 flex justify-center items-center gap-2 disabled:opacity-70 shadow-lg shadow-rose-500/30"
              >
                {followLoading && <Loader2 size={16} className="animate-spin" />}
                Suscribirme y Obtener Descuento
              </button>
              <button 
                onClick={() => {
                  confirmAddToCart(pendingCartItem, true);
                  setPendingCartItem(null);
                }}
                disabled={followLoading}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl transition-colors disabled:opacity-70"
              >
                No quiero el descuento, comprar a precio normal
              </button>
            </div>
            
            <button 
              onClick={() => setPendingCartItem(null)} 
              disabled={followLoading}
              className="mt-6 text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-widest disabled:opacity-70 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          intendedRole="buyer"
          onSuccess={(user) => {
            setIsLoggedIn(true)
            setShowAuthModal(false)
            // Reload page to get proper token headers for requests
            window.location.reload()
          }}
        />
      )}

    </div>
  )
}
