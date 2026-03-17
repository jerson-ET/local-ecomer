'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import {
  Heart,
  Grid3X3,
  ArrowRight,
  ShoppingBag,
  LogOut,
  LayoutDashboard,
  Store,
  User as UserIcon,
  Menu,
  Search,
  PlusCircle,
  MessageSquare,
  Star,
  Compass,
  ThumbsUp,
  ThumbsDown,
  Share,
  Smartphone,
  Monitor,
  Utensils,
} from 'lucide-react'
import AuthModal from '@/components/auth/AuthModal'
import { formatCOP } from '@/lib/store/marketplace'

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
  tags?: string[]
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
  // Agruparemos los productos por categoría
  const [groupedProducts, setGroupedProducts] = useState<Record<string, SwipeProduct[]>>({})
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [likedProducts] = useState<SwipeProduct[]>([]) // setLikedProducts will be used later

  // Navigation states
  const [activeTab, setActiveTab] = useState('explore') // explore, matches
  const [filterMode, setFilterMode] = useState('All Styles')
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile')
  const [isGuest, setIsGuest] = useState(false)

  // Auth Modal Options
  const [authInitialView, setAuthInitialView] = useState<'login' | 'register'>('login')
  const [authInitialRole, setAuthInitialRole] = useState<
    'buyer' | 'seller' | 'reseller' | 'delivery'
  >('buyer')
  const [authHideRoleSelector, setAuthHideRoleSelector] = useState(false)

  const openAuth = (
    view: 'login' | 'register',
    role: 'buyer' | 'seller' | 'reseller' | 'delivery'
  ) => {
    setAuthInitialView(view)
    setAuthInitialRole(role)
    setAuthHideRoleSelector(true) // Ocultar porque ya eligió
    setShowAuthModal(true)
  }

  const handleGuestAccess = () => {
    alert(
      'Por favor selecciona tu ubicación más adelante para recomendarte los productos más cercanos.'
    )
    setIsGuest(true)
    setActiveTab('explore')
  }

  /* ── Cargar perfil del usuario ── */
  const loadProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, nombre, email, role, telefono')
        .eq('id', userId)
        .maybeSingle()
      if (data) setProfile(data)
    },
    [supabase]
  )

  /* ── Check auth al montar ── */
  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
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

  /* Fetch productos y agrupar por categorías */
  useEffect(() => {
    if (!user && !checkingAuth && !isGuest) {
      setLoadingProducts(false)
      return
    }
    if (!user && !isGuest) return

    async function fetchProducts() {
      setLoadingProducts(true)

      const { data } = await supabase
        .from('products')
        .select(`*, stores(name, slug)`)
        .eq('is_active', true)

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = data.map((p: any) => {
          let img = 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=1000'
          if (Array.isArray(p.images) && p.images.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            storeName: p.stores?.name || 'Local Brand',
            storeUrl: `/tienda/${p.stores?.slug}`,
            description: p.description || 'Increíble oportunidad para negocio.',
            tags: Array.isArray(p.product_tags) ? p.product_tags : [],
          }
        })

        // Agrupar productos por categoría
        const groups: Record<string, SwipeProduct[]> = {}
        for (const item of mapped) {
          const cat = item.category || 'Otros'
          if (!groups[cat]) groups[cat] = []
          groups[cat].push(item)
        }

        setGroupedProducts(groups)
      }
      setLoadingProducts(false)
    }
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, checkingAuth])

  /* ── Cerrar sesión ── */
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setShowUserMenu(false)
    router.refresh()
  }

  const displayName = profile?.nombre || profile?.name || profile?.email?.split('@')[0] || 'Usuario'

  const getDashboardLabel = () => {
    switch (profile?.role) {
      case 'seller':
        return 'Panel Vendedor'
      case 'reseller':
        return 'Panel Revendedor'
      case 'admin':
        return 'Administración'
      default:
        return 'Mi Panel'
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                               RENDERS                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (checkingAuth) {
    return (
      <div className="h-[100dvh] w-full bg-[#f3f4f6] flex items-center justify-center pointer-events-auto fixed inset-0 z-50">
        <div className="w-12 h-12 border-[4px] border-r-transparent border-[#FF5A26] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user && !isGuest) {
    return (
      <div className="fixed inset-0 h-[100dvh] w-full bg-[#0d131a] text-white pointer-events-auto z-[60] overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-start py-16 sm:py-24">
          {/* Toggle View Mode */}
          <div className="absolute top-6 right-6 flex bg-[#1c2331] rounded-full p-1 shadow-inner z-10">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-2 rounded-full transition-colors ${viewMode === 'mobile' ? 'bg-[#2a3447] shadow text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Vista Móvil"
            >
              <Smartphone size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-2 rounded-full transition-colors ${viewMode === 'desktop' ? 'bg-[#2a3447] shadow text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Vista Escritorio"
            >
              <Monitor size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div
            className={`relative z-10 px-6 w-full ${viewMode === 'mobile' ? 'max-w-md' : 'max-w-6xl'} mx-auto flex flex-col items-center flex-1`}
          >
            <h1 className="text-[14px] sm:text-[18px] tracking-widest font-light text-center mb-12 text-gray-300 uppercase">
              Bienvenido a Local Ecomer /{' '}
              <span className="font-bold text-white">Selecciona tu camino</span>
            </h1>

            <div
              className={`w-full grid ${viewMode === 'mobile' ? 'grid-cols-1 gap-8' : 'grid-cols-3 gap-8'} items-stretch mb-12`}
            >
              {/* ── CARD 1: GANAR DINERO ── */}
              <div className="flex flex-col bg-[#0b1812] rounded-[24px] overflow-hidden shadow-2xl border border-green-800/40 transition-transform hover:scale-[1.02]">
                <div className="relative p-8 flex flex-col items-center justify-center min-h-[220px] bg-black">
                  <img
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800"
                    alt="Dinero"
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1812] via-[#0b1812]/50 to-transparent"></div>
                  <h2 className="relative z-10 text-[32px] sm:text-[40px] font-serif text-white tracking-widest text-center uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] font-bold mt-auto pb-4">
                    Ganar Dinero
                  </h2>
                </div>
                <div className="p-4 sm:p-6 flex flex-col gap-4 flex-1">
                  <button
                    onClick={() => openAuth('register', 'reseller')}
                    className="flex gap-4 items-start text-left p-4 sm:p-5 rounded-[16px] bg-white/5 hover:bg-white/10 transition-colors border border-white/5 hover:border-green-500/40 flex-1 group"
                  >
                    <Share
                      size={36}
                      className="text-[#64cb9e] shrink-0 mt-1 transition-transform group-hover:scale-110"
                      strokeWidth={2}
                    />
                    <div>
                      <strong className="text-white text-[16px] sm:text-[20px] font-bold block mb-2 leading-snug">
                        Quiero ganar dinero compartiendo productos en mis historias
                      </strong>
                      <p className="text-[14px] sm:text-[16px] text-white/95 leading-relaxed font-light">
                        Comisión por ventas que se genera con tu código. Aquí tú no vendes, solo
                        compartes y ganas.
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => openAuth('register', 'seller')}
                    className="flex gap-4 items-start text-left p-4 sm:p-5 rounded-[16px] bg-white/5 hover:bg-white/10 transition-colors border border-white/5 hover:border-green-500/40 flex-1 group"
                  >
                    <Store
                      size={36}
                      className="text-[#64cb9e] shrink-0 mt-1 transition-transform group-hover:scale-110"
                      strokeWidth={2}
                    />
                    <div>
                      <strong className="text-white text-[16px] sm:text-[20px] font-bold block mb-2 leading-snug">
                        Quiero ganar dinero vendiendo productos
                      </strong>
                      <p className="text-[14px] sm:text-[16px] text-white/95 leading-relaxed font-light">
                        Crea tu catálogo y vende productos fácil y rápido.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* ── CARD 2: MODO DOMICILIO ── */}
              <div className="flex flex-col bg-[#1a0f08] rounded-[24px] overflow-hidden shadow-2xl border border-orange-900/40 transition-transform hover:scale-[1.02]">
                <div className="relative p-8 flex flex-col items-center justify-center min-h-[220px] bg-black">
                  <img
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800"
                    alt="Restaurante"
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f08] via-[#1a0f08]/50 to-transparent"></div>
                  <div className="relative z-10 w-20 h-20 mb-4 rounded-full bg-[#8c4623]/60 flex items-center justify-center border border-white/20 backdrop-blur-sm mt-auto shadow-xl">
                    <Utensils size={36} className="text-white" strokeWidth={2} />
                  </div>
                </div>
                <div className="p-6 flex flex-col gap-6 flex-1 justify-between relative z-10">
                  <div className="flex-1 flex items-center">
                    <h2 className="text-[24px] sm:text-[32px] font-serif text-white tracking-wide uppercase leading-tight text-center font-bold drop-shadow-md">
                      Quiero activar el modo domicilio para mi restaurante
                    </h2>
                  </div>
                  <button
                    onClick={() => openAuth('register', 'delivery')}
                    className="w-full py-4 bg-gradient-to-r from-[#e27d53] to-[#c95b2d] hover:from-[#ffbda1] hover:to-[#e27d53] text-white font-black text-[18px] sm:text-[20px] rounded-[16px] transition-all shadow-lg active:scale-95 uppercase tracking-wide"
                  >
                    Activar Restaurante
                  </button>
                </div>
              </div>

              {/* ── CARD 3: VER ── */}
              <div className="flex flex-col bg-[#0d162b] rounded-[24px] overflow-hidden shadow-2xl border border-blue-900/40 transition-transform hover:scale-[1.02]">
                <div className="relative p-8 flex flex-col items-center justify-center min-h-[220px] bg-black">
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800"
                    alt="Catálogo"
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d162b] via-[#0d162b]/50 to-transparent"></div>
                  <h2 className="relative z-10 text-[36px] sm:text-[48px] font-serif text-white tracking-widest text-center uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] font-bold mt-auto pb-2">
                    Ver
                  </h2>
                </div>
                <div className="p-6 flex flex-col gap-6 flex-1 justify-between">
                  <p className="text-[16px] sm:text-[20px] text-white/95 text-center font-light leading-relaxed flex-1 flex items-center">
                    Ver catálogos de productos. Entérate qué clases hay (como comida), donde las
                    personas pedirán domicilios dándole click al menú, seleccionando el plato y
                    pidiendo por WhatsApp.
                  </p>
                  <button
                    onClick={handleGuestAccess}
                    className="w-full py-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#60a5fa] hover:to-[#3b82f6] text-white font-black text-[18px] sm:text-[20px] rounded-[16px] transition-all shadow-lg active:scale-95 uppercase tracking-wide"
                  >
                    Explorar Catálogo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-auto">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setShowAuthModal(false)}
            ></div>
            <div className="w-full sm:max-w-md sm:rounded-[32px] rounded-t-[32px] bg-white z-10 overflow-hidden shadow-2xl">
              <AuthModal
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => setShowAuthModal(false)}
                defaultView={authInitialView}
                defaultRole={authInitialRole}
                hideRoleSelector={authHideRoleSelector}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ── Vista: MIS MATCHES (Favoritos) ── */
  if (activeTab === 'matches') {
    return (
      <div className="fixed inset-0 h-[100dvh] w-full bg-[#f9fafb] text-[#1c1c1e] flex justify-center pointer-events-auto z-50 overflow-hidden">
        <div className="relative w-full h-full max-w-md bg-[#f9fafb] flex flex-col pointer-events-auto overflow-hidden shadow-2xl sm:border-x border-gray-200">
          {/* Top Bar matches */}
          <div className="px-6 pt-12 pb-4 bg-white z-20 sticky top-0 flex items-center justify-between border-b border-gray-100">
            <button
              onClick={() => setActiveTab('explore')}
              className="w-[40px] h-[40px] flex items-center justify-start transition-colors"
            >
              <ArrowRight size={20} strokeWidth={2.5} className="rotate-180" />
            </button>
            <h2 className="text-[18px] font-bold tracking-tight leading-none">My Matches</h2>
            <button className="w-[40px] h-[40px] flex items-center justify-end transition-colors">
              <Search size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Tabs Nav */}
          <div className="flex items-center justify-between px-6 bg-white border-b border-gray-100 pb-0">
            <button className="py-3 text-[13px] font-bold text-[#FF5A26] border-b-2 border-[#FF5A26]">
              All
            </button>
            <button className="py-3 text-[13px] font-bold text-gray-400 border-b-2 border-transparent">
              Clothing
            </button>
            <button className="py-3 text-[13px] font-bold text-gray-400 border-b-2 border-transparent">
              Accessories
            </button>
            <button className="py-3 text-[13px] font-bold text-gray-400 border-b-2 border-transparent">
              Shoes
            </button>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#f9fafb]">
            {likedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50 mt-20">
                <Heart size={80} className="mb-6 stroke-1" />
                <p className="text-2xl font-bold tracking-tight">Vacio por ahora</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 pb-12">
                {likedProducts.map((lp) => (
                  <div
                    key={lp.id}
                    className="bg-white rounded-[16px] overflow-hidden flex flex-col shadow-sm border border-gray-100"
                  >
                    <div className="relative aspect-[3/4] bg-gray-100">
                      <img src={lp.image} alt={lp.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Heart size={16} fill="#FF5A26" className="text-[#FF5A26]" />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h3 className="font-bold text-[13px] leading-tight text-[#1c1c1e] line-clamp-1">
                          {lp.storeName}
                        </h3>
                        <p className="font-bold text-[13px] text-[#FF5A26]">
                          {formatCOP(lp.price)}
                        </p>
                      </div>
                      <p className="text-gray-400 text-[11px] mb-3 line-clamp-1">{lp.name}</p>
                      <button
                        onClick={() => (window.location.href = `${lp.storeUrl}?productId=${lp.id}`)}
                        className="w-full py-2 bg-[#fff0ec] text-[#FF5A26] font-bold text-[12px] rounded-lg border border-[#FF5A26]/20 active:scale-95 transition-transform flex justify-center items-center"
                      >
                        <ShoppingBag size={14} className="inline mr-1" /> ADD TO BAG
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Obtener todas las categorías para los carruseles ── */
  const categoryKeys = Object.keys(groupedProducts)

  /* ── VISTA PRINCIPAL (EXPLORE / FOR YOU) ── */
  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-gray-50 flex justify-center font-sans tracking-tight overflow-hidden">
      {/* Contenedor Principal */}
      <div
        className={`relative w-full h-full ${viewMode === 'mobile' ? 'max-w-md sm:border-x' : 'w-full'} border-gray-200 z-10 flex flex-col pointer-events-auto bg-[#f9fafb] shadow-2xl overflow-hidden`}
      >
        {/* ═══ Barra Superior ═══ */}
        <nav className="w-full px-6 pt-12 pb-4 flex justify-between items-center z-20 shrink-0 bg-[#f9fafb]">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-[40px] h-[40px] flex items-center justify-start hover:opacity-70 transition-opacity"
          >
            <Menu size={24} strokeWidth={2.5} className="text-[#1C1C1E]" />
          </button>
          <h1 className="text-[16px] font-black text-[#FF5A26] uppercase tracking-[0.15em]">
            FOR YOU
          </h1>
          <button
            onClick={() => setActiveTab('matches')}
            className="w-[40px] h-[40px] flex items-center justify-end hover:opacity-70 transition-opacity relative"
          >
            <ShoppingBag size={24} strokeWidth={2.5} className="text-[#1C1C1E]" />
            {likedProducts.length > 0 && (
              <span className="absolute top-1 right-0 w-2.5 h-2.5 bg-[#FF5A26] rounded-full border border-white"></span>
            )}
          </button>
        </nav>

        {/* ═══ Filtros (Chips) y Toggles de Vista ═══ */}
        <div className="px-6 flex items-center justify-between gap-4 z-20 shrink-0 bg-[#f9fafb] pb-4">
          {/* Filtros */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar flex-1">
            {['All Styles', 'Sustainable', 'New Season'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterMode(f)}
                className={`px-5 py-2 font-bold rounded-full text-[13px] whitespace-nowrap transition-colors border ${
                  filterMode === f
                    ? 'bg-[#FF5A26] text-white border-[#FF5A26]'
                    : 'bg-transparent text-[#FF5A26] border-[#FF5A26]/30'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* View Toggles */}
          <div className="flex bg-gray-200 rounded-full p-1 shrink-0 shadow-inner">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'mobile' ? 'bg-white shadow text-[#FF5A26]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Smartphone size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'desktop' ? 'bg-white shadow text-[#FF5A26]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Monitor size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ═══ Menú de usuario desplegable ═══ */}
        {showUserMenu && (
          <div className="absolute top-24 left-6 w-[240px] bg-white rounded-[24px] border border-gray-100 shadow-2xl overflow-hidden z-50">
            <div className="px-5 py-5 border-b border-gray-100 bg-gray-50">
              <p className="text-[#1C1C1E] font-bold text-[16px] truncate leading-none mb-1">
                {displayName}
              </p>
              <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest">
                {profile?.role === 'seller'
                  ? 'Vendedor'
                  : profile?.role === 'reseller'
                    ? 'Revendedor'
                    : profile?.role === 'admin'
                      ? 'Admin'
                      : 'Comprador'}
              </p>
            </div>
            <div className="py-2">
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  router.push('/dashboard')
                }}
                className="w-full px-5 py-3.5 flex items-center gap-3 text-[#1C1C1E] hover:bg-gray-50 transition-colors text-left text-[14px] font-bold"
              >
                <LayoutDashboard size={18} className="text-[#FF5A26]" />
                {getDashboardLabel()}
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  router.push('/tiendas')
                }}
                className="w-full px-5 py-3.5 flex items-center gap-3 text-[#1C1C1E] hover:bg-gray-50 transition-colors text-left text-[14px] font-bold"
              >
                <Store size={18} className="text-[#FF5A26]" />
                Explorar Tiendas
              </button>
              <div className="mx-4 my-2 border-t border-gray-100"></div>
              <button
                onClick={handleLogout}
                className="w-full px-5 py-3.5 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors text-left text-[14px] font-bold"
              >
                <LogOut size={18} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}

        {/* ═══ Scroll Vertical de Carruseles ═══ */}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col justify-start pb-[20px] bg-[#f9fafb]">
          {loadingProducts ? (
            <div className="w-full h-64 rounded-[32px] bg-gray-200 animate-pulse mx-6 mt-4"></div>
          ) : categoryKeys.length === 0 ? (
            <div className="text-center bg-white p-8 rounded-[32px] mx-6 shadow-sm border border-gray-100 mt-10">
              <Grid3X3 size={48} className="mx-auto text-gray-300 mb-6" />
              <h2 className="text-[32px] font-black mb-3 text-[#1C1C1E] leading-tight">
                Vacio por ahora
              </h2>
              <p className="text-gray-500 font-medium mb-8">
                Vuelve más tarde para nuevos productos.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-10 mt-2">
              {categoryKeys.map((category) => (
                <section key={category} className="w-full">
                  {/* Título de la categoría */}
                  <div className="px-6 mb-4">
                    <h2 className="text-[20px] font-black text-[#1C1C1E] flex items-center justify-between">
                      {category}
                      <ArrowRight size={18} className="text-[#FF5A26]" />
                    </h2>
                  </div>

                  {/* Carrusel Horizontal estilo Disney+ */}
                  <div className="flex overflow-x-auto gap-4 px-6 snap-mandatory snap-x no-scrollbar pb-6">
                    {groupedProducts[category]?.map((product) => (
                      <div
                        key={product.id}
                        className={`snap-center ${viewMode === 'mobile' ? 'w-[85%] max-w-[340px]' : 'w-[280px] sm:w-[320px] xl:w-[360px]'} shrink-0 aspect-[4/5] relative rounded-[32px] overflow-hidden shadow-2xl border-2 border-white bg-black group`}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-105"
                          draggable={false}
                        />

                        {/* Gradiente oscuro superior e inferior */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 flex flex-col justify-between pointer-events-none">
                          {/* Pill de la tienda (Arriba) */}
                          <div className="p-4 flex justify-start">
                            <span className="bg-white/20 backdrop-blur-md border border-white/20 px-4 py-2 text-white text-[12px] font-bold rounded-lg uppercase tracking-widest">
                              {product.tags && product.tags.length > 0
                                ? product.tags[0]
                                : product.storeName}
                            </span>
                          </div>

                          {/* Info Inferior */}
                          <div className="p-6 relative pointer-events-none">
                            {/* Estrellas doradas (solicitud) */}
                            <div className="flex gap-1 text-yellow-400 mb-3 drop-shadow-md">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} fill="currentColor" size={20} />
                              ))}
                            </div>

                            <h2 className="text-[36px] min-h-[44px] leading-[1.1] font-black text-white mb-2 line-clamp-1 pr-12 drop-shadow-lg">
                              {product.name}
                            </h2>

                            <div className="flex items-end justify-between pointer-events-auto">
                              <h3 className="text-[26px] font-black text-white leading-none drop-shadow-lg flex gap-3 items-end">
                                {formatCOP(product.price)}
                                {product.discount > 0 && (
                                  <span className="text-white/60 text-[16px] font-bold line-through mb-0.5">
                                    {formatCOP(product.originalPrice)}
                                  </span>
                                )}
                              </h3>
                              <button
                                className="bg-white text-black text-[14px] font-extrabold px-6 py-3 rounded-full shadow-lg active:scale-95 transition-transform hover:bg-gray-100"
                                onClick={() =>
                                  (window.location.href = `${product.storeUrl}?productId=${product.id}`)
                                }
                              >
                                Details
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Sidebar Actions Right (Visuales, como en TikTok / Imagen) */}
                        <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center pointer-events-auto opacity-90">
                          <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                            <ThumbsUp size={28} className="text-white drop-shadow-md" />
                            <span className="text-white text-[11px] font-bold drop-shadow-md">
                              2.2K
                            </span>
                          </button>
                          <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                            <ThumbsDown size={28} className="text-white drop-shadow-md" />
                          </button>
                          <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                            <Share size={28} className="text-white drop-shadow-md" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>

        {/* ═══ Bottom Navigation Tab Bar ═══ */}
        <div className="h-[84px] bg-white border-t border-gray-100 flex justify-around items-center px-4 z-40 shrink-0 pb-safe">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center gap-1.5 w-[64px] ${activeTab === 'explore' ? 'text-[#FF5A26]' : 'text-gray-400'}`}
          >
            {activeTab === 'explore' ? (
              <div className="w-8 h-8 rounded-full bg-[#FF5A26] flex items-center justify-center text-white shadow-md">
                <Compass size={18} strokeWidth={2.5} />
              </div>
            ) : (
              <Compass size={24} strokeWidth={2} />
            )}
            <span className="text-[9px] font-bold tracking-widest">EXPLORE</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 w-[64px] text-gray-400 hover:text-gray-600">
            <Search size={24} strokeWidth={2} />
            <span className="text-[9px] font-bold tracking-widest">SEARCH</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 w-[64px] text-gray-400 hover:text-gray-600">
            <PlusCircle size={24} strokeWidth={2} />
            <span className="text-[9px] font-bold tracking-widest">SELL</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 w-[64px] text-gray-400 hover:text-gray-600">
            <MessageSquare size={24} strokeWidth={2} />
            <span className="text-[9px] font-bold tracking-widest">INBOX</span>
          </button>
          <button
            onClick={() => setShowUserMenu(true)}
            className="flex flex-col items-center gap-1.5 w-[64px] text-gray-400 hover:text-gray-600"
          >
            <UserIcon size={24} strokeWidth={2} />
            <span className="text-[9px] font-bold tracking-widest">PROFILE</span>
          </button>
        </div>
      </div>

      {/* Cerrar menú de usuario al hacer click fuera */}
      {showUserMenu && (
        <div className="fixed inset-0 z-[5]" onClick={() => setShowUserMenu(false)} />
      )}
    </div>
  )
}
