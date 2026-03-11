'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Heart, X, MapPin, Grid3X3, ArrowRight, ShoppingBag, LogOut, LayoutDashboard, Store, User as UserIcon } from 'lucide-react'
import AuthModal from '@/components/auth/AuthModal'
import { formatCOP } from '@/lib/store/marketplace'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    TIPOS DE DATOS PARA EL MARKETPLACE                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
export interface SwipeProduct {
  id: string
  name: string
  price: number
  originalPrice: number
  discount: number
  image: string
  category: string
  storeName: string
  storeUrl: string
  description?: string
}

/* Perfil del usuario con rol */
interface UserProfile {
  id: string
  name?: string
  nombre?: string
  email?: string
  role?: 'buyer' | 'seller' | 'reseller' | 'admin'
  telefono?: string
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      COMPONENTE PRINCIPAL MARKETPLACE                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AppMarketplace() {
  const router = useRouter()
  const supabase = createClient()

  /* ── Estado de autenticación ── */
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  /* ── Estado de productos ── */
  const [products, setProducts] = useState<SwipeProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [likedProducts, setLikedProducts] = useState<SwipeProduct[]>([])
  const [showLikes, setShowLikes] = useState(false)

  /* ── Framer Motion — Animaciones ultra-rápidas a 60FPS ── */
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-8, 8])
  
  /* Overlays "Me Interesa" / "No Me Interesa" */
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const nopeOpacity = useTransform(x, [0, -100], [0, 1])
  /* Escala dinámica de la tarjeta de fondo */
  const nextScale = useTransform(x, [-200, 0, 200], [1, 0.93, 1])

  /* ── Cargar perfil del usuario ── */
  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, nombre, email, role, telefono')
      .eq('id', userId)
      .maybeSingle()
    if (data) setProfile(data)
  }, [supabase])

  /* ── Check auth al montar ── */
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      setUser(currentUser)
      if (currentUser) loadProfile(currentUser.id)
      setCheckingAuth(false)
      
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user || null
        setUser(u)
        if (u) loadProfile(u.id)
        else setProfile(null)
      })
      
      return () => listener.subscription.unsubscribe()
    }
    checkUser()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                  SISTEMA ALGORÍTMICO DE RECOMENDACIONES                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /* Guardar like en Supabase para análisis y recomendaciones */
  const saveLikeToDatabase = useCallback(async (product: SwipeProduct) => {
    if (!user) return
    try {
      await supabase.from('product_likes').upsert({
        user_id: user.id,
        product_id: product.id,
        category: product.category,
        store_name: product.storeName,
        liked_at: new Date().toISOString(),
      }, { onConflict: 'user_id,product_id' })
    } catch {
      /* Silencioso — la tabla puede no existir aún */
    }
  }, [user, supabase])

  /* Obtener categorías preferidas del usuario para recomendaciones */
  const getPreferredCategories = useCallback(async (): Promise<string[]> => {
    if (!user) return []
    try {
      const { data } = await supabase
        .from('product_likes')
        .select('category')
        .eq('user_id', user.id)
        .order('liked_at', { ascending: false })
        .limit(20)
      
      if (data && data.length > 0) {
        /* Contar frecuencia de categorías */
        const freq: Record<string, number> = {}
        data.forEach((d: { category: string }) => {
          freq[d.category] = (freq[d.category] || 0) + 1
        })
        /* Ordenar por más frecuente */
        return Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .map(([cat]) => cat)
      }
    } catch {
      /* Silencioso */
    }
    return []
  }, [user, supabase])

  /* ── Fetch productos con algoritmo de recomendación ── */
  useEffect(() => {
    if (!user && !checkingAuth) {
      setLoadingProducts(false)
      return
    }
    if (!user) return
    
    async function fetchProducts() {
      setLoadingProducts(true)

      /* 1. Obtener categorías preferidas */
      const preferred = await getPreferredCategories()
      
      /* 2. Obtener todos los productos activos */
      const { data } = await supabase
        .from('products')
        .select(`*, stores(name, slug)`)
        .eq('is_active', true)

      if (data) {
        const mapped = data.map((p: any) => {
          let img = 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=1000'
          if (Array.isArray(p.images) && p.images.length > 0) {
            const main = p.images.find((i: any) => i.isMain) || p.images[0]
            if (main) img = main.full || main.thumbnail || img
          }
          
          const original = p.price
          const currPrice = p.discount_price || p.price
          const discountPc = p.discount_price ? Math.round((1 - currPrice / original) * 100) : 0
          
          return {
            id: String(p.id),
            name: p.name || 'Premium Item',
            price: currPrice,
            originalPrice: original,
            discount: discountPc,
            image: img,
            category: p.category_id || 'Top Seller',
            storeName: p.stores?.name || 'Vendedor Local',
            storeUrl: `/tienda/${p.stores?.slug}`,
            description: p.description || 'Increíble oportunidad para negocio de Dropshipping local.',
          }
        })
        
        /* 3. Algoritmo de recomendación: priorizar categorías preferidas */
        if (preferred.length > 0) {
          /* Score: categorías favoritas al tope, el resto al final */
          const scored = mapped.map(p => ({
            ...p,
            _score: preferred.indexOf(p.category) >= 0
              ? preferred.length - preferred.indexOf(p.category)
              : -1
          }))
          scored.sort((a, b) => {
            if (a._score !== b._score) return a._score - b._score /* Los de menor score van primero (al fondo del stack) */
            return Math.random() - 0.5
          })
          setProducts(scored)
        } else {
          /* Sin historial → aleatorio puro */
          setProducts(mapped.sort(() => Math.random() - 0.5))
        }
      }
      setLoadingProducts(false)
    }
    fetchProducts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, checkingAuth])

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                        LÓGICA DE SWIPE ULTRA-RÁPIDO                    */
  /* ═══════════════════════════════════════════════════════════════════════ */
  const topProduct = products[products.length - 1]
  const nextProduct = products.length > 1 ? products[products.length - 2] : null

  const handleDragEnd = (_: unknown, info: any) => {
    const threshold = 80  /* Reducido de 120 → Más sensible */
    const velocity = info.velocity.x
    
    if (info.offset.x > threshold || velocity > 500) {
      animateCards('right')
    } else if (info.offset.x < -threshold || velocity < -500) {
      animateCards('left')
    } else {
      /* Rebote ultra-rápido al centro */
      animate(x, 0, { type: 'spring', stiffness: 600, damping: 30 })
    }
  }

  const animateCards = async (dir: 'left' | 'right') => {
    const destination = dir === 'right' ? window.innerWidth + 100 : -window.innerWidth - 100
    
    if (dir === 'right' && topProduct) {
      setLikedProducts(prev => [topProduct, ...prev.filter(p => p.id !== topProduct.id)])
      /* Guardar like en la base de datos para el algoritmo */
      saveLikeToDatabase(topProduct)
    }

    /* Animación ULTRA-RÁPIDA: stiffness alto + damping bajo = velocidad */
    await animate(x, destination, { type: 'spring', stiffness: 600, damping: 30, mass: 0.5 })
    
    setProducts(prev => prev.slice(0, prev.length - 1))
    x.set(0)
  }

  /* ── Cerrar sesión ── */
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setShowUserMenu(false)
    router.refresh()
  }

  /* ── Nombre corto para mostrar ── */
  const displayName = profile?.nombre || profile?.name || profile?.email?.split('@')[0] || 'Usuario'

  /* ── Ruta del panel según rol ── */
  const getDashboardLabel = () => {
    switch (profile?.role) {
      case 'seller': return 'Panel Vendedor'
      case 'reseller': return 'Panel Revendedor'
      case 'admin': return 'Administración'
      default: return 'Mi Panel'
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                               RENDERS                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /* ── Cargando auth ── */
  if (checkingAuth) {
    return (
      <div className="h-[100dvh] w-full bg-black flex items-center justify-center pointer-events-auto fixed inset-0 z-50">
         <div className="w-12 h-12 border-[4px] border-r-transparent border-t-white/30 border-l-white/60 border-b-white rounded-full animate-spin shadow-[0_0_15px_rgba(255,255,255,0.2)]"></div>
      </div>
    )
  }

  /* ── Pantalla de bienvenida (sin sesión) ── */
  if (!user) {
    return (
      <div className="fixed inset-0 min-h-[100dvh] w-full bg-black text-white pointer-events-auto z-[60] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img 
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600" 
                alt="Bg" 
                className="w-full h-full object-cover opacity-30 transform scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 px-6 sm:px-12 flex flex-col items-center pb-16 w-full max-w-md mx-auto">
            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <ShoppingBag size={30} className="text-white" />
            </div>
            
            <h1 className="text-5xl sm:text-6xl tracking-tight font-black text-center mb-4 text-white leading-none">
                Gana<br/>Deslizando.
            </h1>
            
            <p className="text-white/60 text-center text-lg leading-relaxed mb-10 font-medium max-w-[300px]">
                Descubre oportunidades rentables de Dropshipping locales en segundos.
            </p>
            
            <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full h-[64px] bg-white text-black font-extrabold rounded-full text-[18px] shadow-[0_10px_40px_rgba(255,255,255,0.15)] hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
                Iniciar Sesión <ArrowRight size={20} strokeWidth={3} />
            </button>
            <p className="text-xs text-white/40 mt-6 font-semibold uppercase tracking-widest">Acceso Exclusivo</p>
        </div>

        {showAuthModal && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-auto">
               <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}></div>
               <div className="w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl bg-white dark:bg-[#1C1C1E] z-10 animate-in slide-in-from-bottom-full duration-300 overflow-hidden shadow-2xl">
                  <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
               </div>
            </div>
        )}
      </div>
    )
  }

  /* ── Drawer de Favoritos ── */
  if (showLikes) {
      return (
          <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 min-h-[100dvh] w-full bg-black text-white flex flex-col pointer-events-auto z-50 overflow-hidden">
              <div className="px-6 sm:px-10 pt-16 pb-6 bg-black/80 backdrop-blur-2xl z-20 border-b border-white/5 sticky top-0 flex items-center justify-between">
                  <div>
                    <h2 className="text-[34px] font-black tracking-tight leading-none">Me Interesa</h2>
                    <p className="text-white/50 text-sm font-medium mt-1">Productos que te gustan</p>
                  </div>
                  <button onClick={() => setShowLikes(false)} className="w-[40px] h-[40px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                      <X size={20} strokeWidth={2.5} />
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-6 space-y-4 pb-32">
                  {likedProducts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full opacity-40 mt-20">
                          <Heart size={80} className="mb-6 stroke-1" />
                          <p className="text-2xl font-bold tracking-tight">Nada por aquí</p>
                          <p className="font-medium mt-2">Empieza a deslizar para guardar productos</p>
                      </div>
                  ) : (
                      likedProducts.map(lp => (
                          <div key={lp.id} onClick={() => window.location.href = `${lp.storeUrl}?productId=${lp.id}`} className="group relative bg-[#1C1C1E] rounded-[28px] p-3 flex gap-4 shadow-lg border border-white/5 active:scale-[0.98] transition-all cursor-pointer overflow-hidden">
                              <div className="w-24 h-24 rounded-[20px] overflow-hidden shrink-0 relative bg-black/50">
                                  <img src={lp.image} alt={lp.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              </div>
                              <div className="flex flex-col justify-center flex-1 pr-4">
                                  <h3 className="font-bold text-[18px] leading-tight line-clamp-2 mb-1">{lp.name}</h3>
                                  <p className="text-white/50 text-xs font-semibold mb-2 flex items-center gap-1 uppercase tracking-wider"><MapPin size={10}/> {lp.storeName}</p>
                                  <p className="text-rose-400 font-extrabold text-[16px]">{formatCOP(lp.price)}</p>
                              </div>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ArrowRight size={20} className="text-white/30" />
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </motion.div>
      )
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                      UI PRINCIPAL — SWIPE INMERSIVO                    */
  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-black flex justify-center font-sans tracking-tight overflow-hidden">
      
      {/* Fondo Inmersivo Desenfocado basado en el producto activo */}
      <AnimatePresence>
        {topProduct && (
            <motion.div 
              key={topProduct.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-0 pointer-events-none"
            >
               <img src={topProduct.image} className="w-full h-full object-cover blur-[80px] scale-125 saturate-150" alt="" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#F2F2F7] via-[#F2F2F7]/80 to-transparent" />
            </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor Principal — Simulación móvil en desktop */}
      <div className="relative w-full h-full max-w-md sm:border-x sm:border-black/5 z-10 flex flex-col pointer-events-auto bg-[#F2F2F7] shadow-2xl overflow-hidden">
          
        {/* ═══ Barra Superior ═══ */}
        <nav className="w-full px-6 pt-12 pb-4 flex justify-between items-center z-20 absolute top-0 pointer-events-none">
            {/* Botón de perfil/menú */}
            <div className="relative pointer-events-auto">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center border border-black/5 shadow-sm active:scale-90 transition-transform">
                 <UserIcon size={20} className="text-[#1C1C1E]" />
              </button>

              {/* Menú desplegable del usuario */}
              {showUserMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-14 left-0 w-[220px] bg-white/95 backdrop-blur-2xl rounded-[20px] border border-black/5 shadow-2xl overflow-hidden z-50"
                >
                  {/* Info del usuario */}
                  <div className="px-4 py-4 border-b border-black/5">
                    <p className="text-[#1C1C1E] font-bold text-[15px] truncate">{displayName}</p>
                    <p className="text-[#8E8E93] text-[12px] font-medium mt-0.5 uppercase tracking-wider">
                      {profile?.role === 'seller' ? '🏪 Vendedor' : profile?.role === 'reseller' ? '🔄 Revendedor' : profile?.role === 'admin' ? '⚡ Admin' : '🛒 Comprador'}
                    </p>
                  </div>

                  {/* Opciones del menú */}
                  <div className="py-2">
                    <button 
                      onClick={() => { setShowUserMenu(false); router.push('/dashboard') }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-[#1C1C1E] hover:bg-black/5 transition-colors text-left text-[14px] font-semibold"
                    >
                      <LayoutDashboard size={18} className="text-[#007AFF]" />
                      {getDashboardLabel()}
                    </button>
                    
                    <button 
                      onClick={() => { setShowUserMenu(false); router.push('/tiendas') }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-[#1C1C1E] hover:bg-black/5 transition-colors text-left text-[14px] font-semibold"
                    >
                      <Store size={18} className="text-[#007AFF]" />
                      Explorar Tiendas
                    </button>

                    <div className="mx-3 my-1 border-t border-black/5"></div>

                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-3 flex items-center gap-3 text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors text-left text-[14px] font-semibold"
                    >
                      <LogOut size={18} />
                      Cerrar Sesión
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Botón de favoritos */}
            <button onClick={() => setShowLikes(true)} className="pointer-events-auto w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center border border-black/5 shadow-sm relative active:scale-90 transition-transform">
                <Heart size={20} className="text-[#1C1C1E] hover:text-[#FF2D55] transition-colors" fill={likedProducts.length > 0 ? "#FF2D55" : "none"} strokeWidth={2} />
                {likedProducts.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-[#FF2D55] border-2 border-white rounded-full shadow-[0_2px_8px_rgba(255,45,85,0.4)]"></span>}
            </button>
        </nav>

        {/* ═══ Canvas del Swipe ═══ */}
        <main className="flex-1 w-full relative flex items-center justify-center pt-16 pb-[120px]">
            {loadingProducts ? (
               <div className="w-[88%] h-full max-h-[600px] rounded-[40px] bg-black/5 animate-pulse border border-black/5 flex items-center justify-center">
                   <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
               </div>
            ) : products.length === 0 ? (
               <div className="text-center px-10 relative z-20 bg-white p-8 rounded-[40px] shadow-xl border border-black/5">
                   <Grid3X3 size={48} className="mx-auto text-[#8E8E93] mb-6" />
                   <h2 className="text-[32px] font-black mb-3 text-[#1C1C1E] leading-tight">Has visto<br/>todo</h2>
                   <p className="text-[#8E8E93] font-medium mb-8">Vuelve más tarde para descubrir nuevas rarezas.</p>
                   <button onClick={() => window.location.reload()} className="px-8 py-4 bg-[#007AFF] text-white font-extrabold rounded-full w-full active:scale-95 transition-transform shadow-[0_8px_20px_rgba(0,122,255,0.3)]">Descubrir de nuevo</button>
               </div>
            ) : (
               <div className="relative w-[88%] h-full max-h-[600px] mt-2">
                  
                   {/* Tarjeta Siguiente (fondo) */}
                  {nextProduct && (
                      <motion.div style={{ scale: nextScale }} className="absolute inset-0 bg-white rounded-[40px] translate-y-6 brightness-[0.7] overflow-hidden z-0 border border-black/5 shadow-md">
                          <img src={nextProduct.image} className="w-full h-full object-cover" alt="" />
                      </motion.div>
                  )}

                  {/* Tarjeta Activa Arrastrarse */}
                  {topProduct && (
                  <motion.div 
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.9}
                      onDragEnd={handleDragEnd}
                      style={{ x, rotate }}
                      whileDrag={{ scale: 1.02 }}
                      className="absolute inset-0 bg-white rounded-[40px] z-10 overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.12)] cursor-grab active:cursor-grabbing border border-black/5 will-change-transform"
                  >
                      <img src={topProduct.image} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
                      
                      {/* Gradiente oscuro sobre imagen */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8 pointer-events-none">
                          <div className="flex flex-wrap gap-2 mb-4">
                               {topProduct.discount > 0 && <span className="bg-white text-black text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Oferta -{topProduct.discount}%</span>}
                               <span className="bg-black/50 backdrop-blur-md border border-white/20 px-3 py-1.5 text-white/90 text-[11px] font-bold rounded-full flex items-center shadow-lg"><MapPin size={11} className="mr-1.5 opacity-80"/> {topProduct.storeName}</span>
                          </div>
                          
                          <h2 className="text-[36px] sm:text-[40px] leading-[1.05] font-black text-white mb-2 drop-shadow-2xl">{topProduct.name}</h2>
                          
                          <div className="flex items-end gap-3 mb-2">
                             <h3 className="text-[26px] font-black text-white drop-shadow-xl">{formatCOP(topProduct.price)}</h3>
                             {topProduct.discount > 0 && <span className="text-white/50 text-sm font-bold line-through mb-1.5">{formatCOP(topProduct.originalPrice)}</span>}
                          </div>
                          <p className="text-white/80 text-[14px] font-medium line-clamp-2 leading-relaxed mt-2">{topProduct.description}</p>
                      </div>

                      {/* ═══ Overlay "NO ME INTERESA" (izquierda) ═══ */}
                      <motion.div style={{ opacity: nopeOpacity }} className="absolute inset-0 bg-red-500/15 z-20 pointer-events-none flex items-center justify-center">
                           <div className="border-[5px] border-red-500 text-red-500 rounded-[24px] px-6 py-2 text-[28px] sm:text-[36px] font-black transform rotate-12 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)] tracking-wide text-center leading-tight">
                               NO ME<br/>INTERESA
                           </div>
                      </motion.div>
                      
                      {/* ═══ Overlay "ME INTERESA" (derecha) ═══ */}
                      <motion.div style={{ opacity: likeOpacity }} className="absolute inset-0 bg-emerald-500/15 z-20 pointer-events-none flex items-center justify-center">
                           <div className="border-[5px] border-emerald-500 text-emerald-500 rounded-[24px] px-6 py-2 text-[28px] sm:text-[36px] font-black transform -rotate-12 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] tracking-wide text-center leading-tight">
                               ME<br/>INTERESA
                           </div>
                      </motion.div>
                  </motion.div>
                  )}
               </div>
            )}
        </main>

        {/* ═══ Barra de Acciones Flotante ═══ */}
        {products.length > 0 && !loadingProducts && (
              <div className="absolute bottom-6 w-full flex justify-center items-center gap-6 pointer-events-none z-30">
                  <button onClick={() => animateCards('left')} className="pointer-events-auto w-[68px] h-[68px] bg-white rounded-full flex items-center justify-center text-[#FF3B30] shadow-[0_8px_24px_rgba(0,0,0,0.1)] border border-black/5 hover:bg-gray-50 active:scale-90 transition-all">
                      <X size={32} strokeWidth={3} />
                  </button>
                  
                  <button onClick={() => topProduct && (window.location.href = `${topProduct.storeUrl}?productId=${topProduct.id}`)} className="pointer-events-auto w-[58px] h-[58px] bg-[#007AFF] text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,122,255,0.3)] active:scale-90 transition-transform hover:scale-105">
                      <ShoppingBag size={24} strokeWidth={2.5} />
                  </button>
                  
                  <button onClick={() => animateCards('right')} className="pointer-events-auto w-[68px] h-[68px] bg-white rounded-full flex items-center justify-center text-[#34C759] shadow-[0_8px_24px_rgba(0,0,0,0.1)] border border-black/5 hover:bg-gray-50 active:scale-90 transition-all">
                      <Heart size={32} strokeWidth={3} fill="currentColor" />
                  </button>
              </div>
        )}

        {/* ═══ Auth Modal (disponible desde Swipe) ═══ */}
        {showAuthModal && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-auto">
               <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}></div>
               <div className="w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl bg-white dark:bg-[#1C1C1E] z-10 animate-in slide-in-from-bottom-full duration-300 overflow-hidden shadow-2xl">
                  <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
               </div>
            </div>
        )}
      </div>

      {/* Cerrar menú de usuario al hacer click fuera */}
      {showUserMenu && (
        <div className="fixed inset-0 z-[5]" onClick={() => setShowUserMenu(false)} />
      )}
    </div>
  )
}
