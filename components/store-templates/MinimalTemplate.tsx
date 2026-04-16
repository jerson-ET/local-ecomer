'use client'

import { useState, useEffect, useRef } from 'react'
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
} from 'lucide-react'

import ProductBottomSheet, { SheetProduct } from '@/components/ui/ProductBottomSheet'
import CartDrawer from '@/components/features/cart/CartDrawer'
import AuthModal from '@/components/auth/AuthModal'
import { createClient } from '@/lib/supabase/client'

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
}

interface CartItem {
  product: RealProduct
  quantity: number
  selectedColors?: string[]
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
      <div className="cs-product-price">${(product.discount_price || product.price).toLocaleString('es-CO')}</div>
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
  const [cart, setCart] = useState<CartItem[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const [selectedSheetProduct, setSelectedSheetProduct] = useState<SheetProduct | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutName, setCheckoutName] = useState('')
  const [checkoutPhone, setCheckoutPhone] = useState('')
  const [checkoutAddress, setCheckoutAddress] = useState('')
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'efipay'>('whatsapp')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)



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



  // Extraer categorías únicas de los productos reales
  const dynamicCats = Array.from(
    new Set(products.map((p) => p.category_id || 'Otros').filter(Boolean))
  )

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.product.discount_price || item.product.price) * item.quantity,
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
    if (dynamicCats.length > 0) {
      const firstCat = dynamicCats[0];
      const element = document.getElementById(`cat-${firstCat}`);
      if (element) {
        const yOffset = -80; // Offset for header
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
      }
    }
  }

  const addToCart = (product: RealProduct, quantity: number = 1, selectedColors: string[] = []) => {
    setCart((prev) => {
      // Find if this specific variant (by color) exists in cart
      // For simplicity, we match by productId + first color if color exists
      const existing = prev.find((item) => 
        item.product.id === product.id && 
        JSON.stringify(item.selectedColors?.sort()) === JSON.stringify(selectedColors.sort())
      )
      
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id &&
          JSON.stringify(item.selectedColors?.sort()) === JSON.stringify(selectedColors.sort())
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { product, quantity, selectedColors }]
    })
    setIsCartOpen(true)
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

  let storeConfig: Record<string, any> = {}
  try {
    if (store.banner_url && store.banner_url.startsWith('{')) {
      storeConfig = JSON.parse(store.banner_url)
    }
  } catch {
    // Si falla el parseo de la configuración, ignoramos y usamos el fallback
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

      const rawWhatsapp = (store.whatsapp_number || storeConfig.whatsappNumber || '').toString()
      let targetPhone = rawWhatsapp.replace(/\D/g, '')
      if (targetPhone.length === 10 && targetPhone.startsWith('3')) targetPhone = '57' + targetPhone
      if (!targetPhone) targetPhone = '573000000000'

      const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(orderText)}`
      const win = window.open(waUrl, '_blank')
      if (!win) window.location.href = waUrl

    } catch (err: any) {
      console.error('Submit process error, using fallback:', err)
      const itemsListText = cart.map(item => `• ${item.quantity}x ${item.product.name}`).join('\n');
      const fallbackText = `*🛒 NUEVO PEDIDO DIRECTO (E)*\n` +
        `----------------------------------\n\n` +
        `*Detalle:* \n${itemsListText}\n\n` +
        `*Total:* $${cartTotal.toLocaleString('es-CO')}\n\n` +
        `*Nombre:* ${checkoutName.trim()}\n*Teléfono:* ${checkoutPhone.trim()}\n*Dirección:* ${checkoutAddress.trim()}\n` +
        `_Nota: Error de sincronización, pedido tomado por WhatsApp_`

      const rawWhatsapp = (store.whatsapp_number || storeConfig.whatsappNumber || '').toString()
      let targetPhone = rawWhatsapp.replace(/\D/g, '')
      if (targetPhone.length === 10 && targetPhone.startsWith('3')) targetPhone = '57' + targetPhone
      if (!targetPhone) targetPhone = '573000000000'

      const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(fallbackText)}`
      const win = window.open(waUrl, '_blank')
      if (!win) window.location.href = waUrl
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center custom-store-root">
      {/* Estilos inyectados específicos para el nuevo modelo unificado de la tienda */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;700;800&display=swap');
        
        .custom-store-root {
          font-family: 'Inter', sans-serif;
          color: #2F3542;
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
          display: flex;
          overflow-x: auto;
          gap: 16px;
          padding: 0 20px 20px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }
        .cs-products-carousel::-webkit-scrollbar {
          display: none;
        }
        .cs-product-card {
          min-width: 240px;
          width: 240px;
          scroll-snap-align: start;
          position: relative;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .cs-product-card:active { scale: 0.98; }

        .cs-product-image-container {
          width: 100%;
          aspect-ratio: 7/10;
          background: #F8F8F8;
          position: relative;
          margin-bottom: 12px;
          overflow: hidden;
          border-radius: 4px;
        }
        .cs-product-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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
        }
        .cs-product-title {
          font-size: 14px;
          font-weight: 400;
          margin-bottom: 8px;
          color: #4a4a4a;
          text-transform: uppercase;
          line-height: 1.4;
        }
        .cs-product-price {
          font-size: 16px;
          font-weight: 800;
          color: #2F3542;
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
          position: absolute;
          top: 40%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(0,0,0,0.1);
          z-index: 30;
          border: 1px solid #f0f0f0;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: #1a1a1a;
        }
        .cs-carousel-nav:hover { scale: 1.1; background: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .cs-carousel-nav:active { scale: 0.95; }
        .cs-carousel-nav-left { left: -20px; }
        .cs-carousel-nav-right { right: -20px; }

        @media (max-width: 768px) {
           .cs-carousel-nav { display: none; }
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
                <div className="cs-brand">{store.name}</div>
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
                  onClick={() => isLoggedIn ? router.push('/dashboard') : setShowAuthModal(true)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative' }}
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
                      const el = document.getElementById(`cat-${cat}`);
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
                  <a href="#" className="cs-menu-link" onClick={() => setIsMenuOpen(false)}>Inicio</a>
                  {dynamicCats.map(cat => (
                    <a key={cat} href={`#cat-${cat}`} className="cs-menu-link" onClick={() => setIsMenuOpen(false)}>{cat}</a>
                  ))}
                  <a href="#" className="cs-menu-link" style={{ color: '#ef4444' }} onClick={() => setIsMenuOpen(false)}>Ofertas</a>
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

            {/* Listado de Categorías unificado en formato slider horizontal */}
            {dynamicCats.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                  <ShoppingBag size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                  <p>Aún no hay productos en la tienda.</p>
               </div>
            ) : (
                dynamicCats.map((cat) => {
                  const catProducts = products.filter(p => (p.category_id || 'Otros') === cat)
                  if (catProducts.length === 0) return null

                  return (
                    <section key={cat} id={`cat-${cat}`} className="cs-category-section">
                      <div className="cs-category-header">
                        <div className="cs-category-title">
                          <div className="cs-category-line"></div>
                          {cat}
                        </div>
                      </div>
                      
                      <CategoryCarousel 
                        catProducts={catProducts} 
                        handleOpenSheet={handleOpenSheet} 
                      />
                    </section>
                  )
                })
            )}

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

            {/* Float WhatsApp */}
            <a 
              href={`https://wa.me/${(store.whatsapp_number || storeConfig.whatsappNumber) ? `57${store.whatsapp_number || storeConfig.whatsappNumber}` : '573000000000'}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="cs-whatsapp-float"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                 <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
               </svg>
            </a>

            {/* Bottom Sheet Modal y Asistente IA mantenidos de la arquitectura original */}
            <ProductBottomSheet
              isOpen={isSheetOpen}
              onClose={() => setIsSheetOpen(false)}
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

      {/* Auth Modal — se muestra al tocar el icono de persona sin estar logueado */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false)
            setIsLoggedIn(true)
            router.push('/dashboard')
          }}
        />
      )}
    </div>
  )
}
