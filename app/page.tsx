import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AuthGate from '@/components/auth/AuthGate'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HOMEPAGE — Server Component                                               */
/*  Light Theme (Purple & Blue), Highly Animated.                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface StoreWithCount {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  theme_color: string
  product_count: number
}

async function getFeaturedStores(): Promise<StoreWithCount[]> {
  const supabase = await createClient()

  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, slug, description, logo_url, banner_url, theme_color')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(12)

  if (!stores || stores.length === 0) return []

  const storeIds = stores.map((s) => s.id)
  const { data: productCounts } = await supabase
    .from('products')
    .select('store_id')
    .eq('is_active', true)
    .in('store_id', storeIds)

  const countMap = new Map<string, number>()
  productCounts?.forEach((p) => {
    countMap.set(p.store_id, (countMap.get(p.store_id) || 0) + 1)
  })

  return stores.map((s) => ({
    ...s,
    product_count: countMap.get(s.id) || 0,
  }))
}

async function getStats() {
  const supabase = await createClient()
  const [storesRes, productsRes] = await Promise.all([
    supabase.from('stores').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])
  return {
    stores: storesRes.count || 0,
    products: productsRes.count || 0,
  }
}

export default async function HomePage() {
  const [stores, stats] = await Promise.all([getFeaturedStores(), getStats()])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LocalEcomer',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Marketplace colombiano para crear tiendas online y vender productos. 7 días gratis.',
    offers: {
      '@type': 'Offer',
      price: '35000',
      priceCurrency: 'COP',
      description: 'Plan mensual después de 7 días de prueba gratis',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '120',
    },
  }

  return (
    <div className="min-h-[100dvh] text-slate-800 bg-slate-50 relative overflow-hidden font-sans selection:bg-purple-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ═══ ANIMATED BACKGROUND SYSTEM ═══ */}
      <div className="fixed inset-0 z-[-2] bg-slate-50"></div>
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        {/* Glow Orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-300/40 rounded-full blur-[100px] mix-blend-multiply animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[50%] bg-blue-300/40 rounded-full blur-[100px] mix-blend-multiply animate-[pulse_8s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-indigo-200/40 rounded-full blur-[120px] mix-blend-multiply animate-[pulse_7s_ease-in-out_infinite]" style={{ animationDelay: '4s' }} />
        
        {/* Digital Grid pattern moving slowly */}
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(147,197,253,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(147,197,253,0.3)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_60%,transparent_100%)] animate-[moveGrid_20s_linear_infinite]" />
      </div>

      <style>{`
        @keyframes countMoney {
          0% { transform: translateY(0) scaleY(1) rotate(-3deg); filter: brightness(1); }
          100% { transform: translateY(-4px) scaleY(1.1) rotate(3deg); filter: brightness(1.2); }
        }
        @keyframes moveGrid {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ═══ HERO ═══ */}
      <header className="relative min-h-[90vh] flex flex-col pb-20">
        
        {/* Animated Electric Blue Header Banner */}
        <div className="relative w-full flex flex-col items-center justify-center pt-24 pb-32 sm:pt-32 sm:pb-48 overflow-hidden bg-gradient-to-b from-black via-blue-950 to-blue-900 z-20">
          
          <style>{`
            @keyframes hologramScan {
              0% { background-position: 0% 0%; opacity: 0.8; }
              100% { background-position: 0% 100%; opacity: 0.2; }
            }
            @keyframes electricFlicker {
              0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; filter: drop-shadow(0 0 15px rgba(34,211,238,0.8)); }
              20%, 24%, 55% { opacity: 0.6; filter: none; }
            }
            @keyframes hologramFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
            @keyframes lightningPulse {
              0%, 100% { opacity: 0.1; }
              50% { opacity: 0.5; }
              90% { opacity: 0.1; filter: brightness(1); }
              92% { opacity: 0.8; filter: brightness(2); }
              95% { opacity: 0.1; filter: brightness(1); }
            }
            @keyframes seqShirt {
              0% { transform: translateY(-30px) scale(0); opacity: 0; }
              10% { transform: translateY(0) scale(1); opacity: 1; }
              25% { transform: scale(0) rotate(180deg); opacity: 0; }
              100% { transform: scale(0); opacity: 0; }
            }
            @keyframes seqStore {
              0%, 15% { transform: scale(0); opacity: 0; }
              25% { transform: scale(1.2); opacity: 1; filter: drop-shadow(0 0 20px #0ea5e9); }
              30%, 45% { transform: scale(1); opacity: 1; }
              50% { transform: scale(0) rotate(-18deg); opacity: 0; } 
              100% { transform: scale(0); opacity: 0; }
            }
            @keyframes seqBag {
              0%, 40% { transform: scale(0) translateY(20px); opacity: 0; }
              50% { transform: scale(1.2) translateY(-20px); opacity: 1; filter: drop-shadow(0 0 20px #a855f7); }
              55%, 65% { transform: scale(1) translateY(0); opacity: 1; }
              75% { transform: scale(0) translateX(50px); opacity: 0; }
              100% { transform: scale(0); opacity: 0; }
            }
            @keyframes seqGirl {
              0%, 65% { transform: scale(0); opacity: 0; }
              75% { transform: scale(1.1); opacity: 1; filter: drop-shadow(0 0 30px #facc15); }
              80% { transform: scale(1) translateY(-10px) rotate(10deg); opacity: 1; }
              85% { transform: scale(1) translateY(0) rotate(-10deg); opacity: 1; }
              90% { transform: scale(1.1) translateY(-10px) rotate(5deg); opacity: 1; }
              95%, 100% { transform: scale(0); opacity: 0; }
            }
            @keyframes seqSparkle {
              0%, 70% { opacity: 0; transform: scale(0); }
              75%, 90% { opacity: 1; transform: scale(1) rotate(180deg); }
              95%, 100% { opacity: 0; transform: scale(0); }
            }
          `}</style>
          
          {/* Top Navbar nested INSIDE the animated banner */}
          <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-50 flex items-center justify-between">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400 bg-white group hover:scale-105 transition-transform">
              <img src="/logo-le-small.png" alt="LocalEcomer" className="w-full h-full object-cover" />
            </div>
            <AuthGate
              className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-5 py-2.5 shadow-[0_0_15px_rgba(34,211,238,0.3)] text-sm font-bold tracking-wide text-cyan-100 hover:text-white border border-cyan-400/50 transition-all hover:scale-105 hover:bg-black/60"
              label="Iniciar Sesión"
              fallbackHref="/dashboard"
            />
          </div>

          {/* Electric Grid pattern */}
          <div className="absolute inset-x-0 top-0 bottom-12 opacity-[0.3] text-cyan-400">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cyberGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <rect width="40" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="40" cy="40" r="1.5" fill="#22d3ee" />
                  <circle cx="0" cy="0" r="1.5" fill="#22d3ee" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cyberGrid)" />
            </svg>
          </div>

          {/* Holographic Scanlines overlay */}
          <div 
            className="absolute inset-x-0 top-0 bottom-12 pointer-events-none mix-blend-screen"
            style={{
              background: 'linear-gradient(to bottom, transparent 30%, rgba(34, 211, 238, 0.15) 50%, transparent 70%)',
              backgroundSize: '100% 10px',
              animation: 'hologramScan 2s linear infinite'
            }}
          />

          {/* Electric Light Background Flashes */}
          <div 
            className="absolute inset-x-0 top-0 bottom-12 bg-cyan-400 mix-blend-color-dodge pointer-events-none blur-[100px]"
            style={{ animation: 'lightningPulse 4s infinite' }}
          />

          {/* Center Hologram Icon and Text */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 relative z-10 px-4"
            style={{ animation: 'hologramFloat 4s ease-in-out infinite' }}
          >
            {/* Story Sequence Animation (Shirt -> Store -> Bag -> Girl) */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center -ml-4 flex-shrink-0">
              {/* 👕 Shirt */}
              <span className="absolute text-[5.5rem] sm:text-[6.5rem] origin-bottom filter saturate-150" style={{ animation: 'seqShirt 6s infinite' }}>👕</span>
              {/* 🏬 Store */}
              <span className="absolute text-[6rem] sm:text-[7rem] origin-bottom filter saturate-200" style={{ animation: 'seqStore 6s infinite' }}>🏬</span>
              {/* 🛍️ Bag */}
              <span className="absolute text-[5.5rem] sm:text-[6.5rem] origin-bottom filter saturate-150" style={{ animation: 'seqBag 6s infinite' }}>🛍️</span>
              {/* 👧 Happiness */}
              <span className="absolute text-[6.5rem] sm:text-[7.5rem] origin-bottom filter saturate-150" style={{ animation: 'seqGirl 6s infinite' }}>👧</span>
              {/* ✨ Sparkles */}
              <span className="absolute text-5xl sm:text-6xl -top-4 -right-6 filter saturate-200 z-10" style={{ animation: 'seqSparkle 6s infinite' }}>✨</span>
              <span className="absolute text-4xl sm:text-5xl -bottom-2 -left-4 filter saturate-200 z-10" style={{ animation: 'seqSparkle 6s infinite 0.2s' }}>✨</span>
            </div>
            
            {/* Electric Blue Hologram Text */}
            <div className="relative">
              <h1 className="sr-only">LocalEcomer</h1>
              <span 
                className="font-black text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[7rem] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-100 via-cyan-400 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)] uppercase"
                style={{ animation: 'electricFlicker 4s infinite alternate' }}
              >
                LocalEcomer
              </span>
              <span className="absolute inset-0 font-black text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[7rem] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 via-cyan-300 to-blue-500 uppercase opacity-30 mix-blend-color-dodge blur-[2px] -translate-x-[2px]">
                LocalEcomer
              </span>
              <span className="absolute inset-0 font-black text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[7rem] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-blue-200 via-indigo-300 to-indigo-500 uppercase opacity-30 mix-blend-color-dodge blur-[2px] translate-x-[2px]">
                LocalEcomer
              </span>
            </div>
          </div>
          
          {/* Seamless fade overlay to blend into the slate-50 page background */}
          <div className="absolute bottom-0 left-0 w-full h-32 sm:h-48 bg-gradient-to-b from-transparent via-slate-50/90 to-slate-50 z-30 pointer-events-none" />
          {/* Oversized solid anchor to completely obliterate subpixel antialiasing bleed on mobile Retina screens */}
          <div className="absolute -bottom-4 left-0 w-full h-8 bg-slate-50 z-40 pointer-events-none" />
        </div>

        {/* Hero Bottom Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 sm:pt-24 text-center flex flex-col items-center">

          <p className="fade-in-up text-2xl sm:text-4xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent mb-6 tracking-tight drop-shadow-sm" style={{ animationDelay: '0.2s' }}>
            Tu comercio digital empieza aquí.
          </p>

          <p className="fade-in-up max-w-xl mx-auto text-lg sm:text-xl text-slate-900 font-medium mb-10" style={{ animationDelay: '0.3s' }}>
            Crea tu catálogo, sube productos y vende directamente a tus clientes.
            Sin complicaciones, sin intermediarios.
          </p>

          {/* ═══ PRICING BADGE ═══ */}
          <div className="fade-in-up inline-flex items-center gap-3 bg-white/80 backdrop-blur-md border border-purple-100 shadow-xl shadow-purple-500/10 rounded-full px-6 py-3 mb-10" style={{ animationDelay: '0.4s' }}>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <span className="text-blue-600 font-black text-sm uppercase tracking-wider">7 días gratis</span>
            </span>
            <span className="w-px h-5 bg-slate-200" />
            <span className="text-slate-800 text-sm font-semibold">
              Después <span className="text-slate-800 font-black">$35.000 COP</span>/mes
            </span>
          </div>

          <div className="fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4 w-full" style={{ animationDelay: '0.5s' }}>
            <AuthGate
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black rounded-xl text-lg transition-all shadow-[0_8px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_25px_rgba(139,92,246,0.4)] hover:-translate-y-1"
              label="Crear mi Catálogo"
              fallbackHref="/dashboard"
            />
            <Link
              href="/tiendas"
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 hover:text-purple-600 font-bold rounded-xl text-lg border-2 border-slate-100 hover:border-purple-200 transition-all shadow-sm hover:shadow-md"
            >
              Explorar Tiendas
            </Link>
          </div>

          {/* Stats */}
          <div className="fade-in-up flex items-center justify-center gap-8 sm:gap-14 mt-16" style={{ animationDelay: '0.6s' }}>
            <div className="text-center group">
              <p className="text-3xl sm:text-4xl font-black text-slate-800 group-hover:scale-110 transition-transform">{stats.stores}</p>
              <p className="text-xs text-purple-600 font-bold uppercase tracking-widest mt-2">Tiendas</p>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="text-center group">
              <p className="text-3xl sm:text-4xl font-black text-slate-800 group-hover:scale-110 transition-transform">{stats.products}</p>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-2">Productos</p>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="text-center group">
              <p className="text-3xl sm:text-4xl font-black text-slate-800 group-hover:scale-110 transition-transform">24/7</p>
              <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-2">Activo</p>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ CÓMO FUNCIONA ═══ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-3xl sm:text-4xl font-black text-center mb-16 tracking-tight text-slate-800">
          ¿Cómo funciona?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Crea tu catálogo',
              desc: 'Regístrate y configura tu tienda en minutos. Elige nombre, sube banner y personaliza.',
              icon: '🛍️',
              color: 'from-purple-100 to-purple-50',
            },
            {
              step: '02',
              title: 'Sube productos',
              desc: 'Agrega fotos, precios, variantes y descripciones. Todo optimizado para móvil.',
              icon: '📦',
              color: 'from-blue-100 to-blue-50',
            },
            {
              step: '03',
              title: 'Vende y cobra',
              desc: 'Comparte tu enlace. Los clientes contactan por WhatsApp. Tú manejas el envío y cobro.',
              icon: '💰',
              color: 'from-indigo-100 to-indigo-50',
            },
          ].map((item, i) => (
            <div
              key={item.step}
              className={`relative bg-gradient-to-br ${item.color} bg-opacity-50 backdrop-blur-lg rounded-3xl p-8 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(139,92,246,0.1)] transition-all duration-300 hover:-translate-y-2`}
              style={{ animationName: 'float', animationDuration: '6s', animationIterationCount: 'infinite', animationDelay: `${i * 0.5}s` }}
            >
              <span className="absolute top-6 right-6 text-2xl font-black text-slate-200/80 tracking-tighter">
                {item.step}
              </span>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm shadow-purple-500/10">
                {item.icon}
              </div>
              <h3 className="text-xl font-black mb-3 text-slate-800">{item.title}</h3>
              <p className="text-base text-slate-800 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-slate-800">
            Un precio simple. Sin sorpresas.
          </h2>
          <p className="text-lg text-slate-800 font-medium mb-14 max-w-lg mx-auto">
            Empieza gratis y crece a tu ritmo. Sin contratos, cancela cuando quieras.
          </p>

          <div className="bg-white backdrop-blur-xl border border-purple-100 rounded-[2.5rem] p-10 sm:p-14 max-w-md mx-auto relative overflow-hidden shadow-[0_20px_60px_rgba(139,92,246,0.15)] group hover:shadow-[0_30px_80px_rgba(139,92,246,0.2)] transition-shadow duration-500">
            {/* Animated glowing border effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-8 ring-1 ring-blue-100">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                7 Días Gratis
              </div>
              
              <div className="mb-8 flex items-baseline justify-center gap-1.5">
                <span className="text-5xl sm:text-6xl font-black text-slate-800">$35.000</span>
                <span className="text-slate-800 font-bold text-lg">COP/mes</span>
              </div>

              <ul className="text-left space-y-4 mb-10 text-base">
                {[
                  'Catálogo digital ilimitado',
                  'Subir productos con fotos',
                  'Enlace personalizado de tienda',
                  'Contacto directo por WhatsApp',
                  'Panel de administración',
                  'Programa de referidos',
                  'Soporte técnico prioritario',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-4">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-black shrink-0">✓</span>
                    <span className="text-slate-700 font-bold">{feature}</span>
                  </li>
                ))}
              </ul>

              <AuthGate
                className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl transition-all text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 block"
                label="Empezar 7 Días Gratis"
                fallbackHref="/dashboard"
              />
              <p className="text-[11px] text-slate-700 mt-4 uppercase tracking-wider font-bold">Sin tarjeta de crédito requerida</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TIENDAS ACTIVAS ═══ */}
      {stores.length > 0 && (
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800">Tiendas en acción</h2>
              <p className="text-slate-800 font-medium mt-2">Visita el catálogo de otros emprendedores</p>
            </div>
            <Link
              href="/tiendas"
              className="inline-flex items-center gap-2 text-sm font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-full transition-colors"
            >
              Ver todas las tiendas <span className="text-lg leading-none">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {stores.map((store) => {
              let displayBanner: string | null = null
              let storeLocation: string | null = null
              try {
                if (store.banner_url && store.banner_url.startsWith('{')) {
                  const config = JSON.parse(store.banner_url)
                  storeLocation = config.shippingLocation || config.location || null
                  
                  if (config.customUrls && config.customUrls.length > 0) {
                    displayBanner = config.customUrls[0]
                  } else if (config.customUrl) {
                    displayBanner = config.customUrl
                  } else if (config.bannerUrls && config.bannerUrls.length > 0) {
                    displayBanner = config.bannerUrls[0]
                  } else if (config.bannerUrl) {
                    displayBanner = config.bannerUrl
                  }
                } else if (store.banner_url && typeof store.banner_url === 'string') {
                  displayBanner = store.banner_url
                }
              } catch (e) {
                if (typeof store.banner_url === 'string' && !store.banner_url.startsWith('{')) {
                  displayBanner = store.banner_url
                }
              }

              return (
                <Link
                  key={store.id}
                  href={`/tienda/${store.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(139,92,246,0.12)] transition-all duration-300 hover:-translate-y-1.5"
                >
                  {/* Banner */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    {displayBanner ? (
                      <img
                        src={displayBanner}
                        alt={store.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${store.theme_color}44, ${store.theme_color}88)`,
                        }}
                      >
                        <span className="text-6xl font-black text-white/50 uppercase drop-shadow-sm">
                          {store.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {store.product_count > 0 && (
                      <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-black px-3 py-1.5 rounded-full shadow-sm">
                        {store.product_count} producto{store.product_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <h3 className="font-black text-slate-800 text-xl mb-2 group-hover:text-purple-600 transition-colors">
                      {store.name}
                    </h3>
                    <p className="text-slate-800 font-medium line-clamp-2 mb-4">
                      {store.description || 'Catálogo de productos premium'}
                    </p>
                    {storeLocation && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg inline-flex">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        {storeLocation}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══ FOOTER LEGAL COMPLETO ═══ */}
      <footer className="relative z-10 bg-white border-t border-slate-100 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            
            {/* Marca */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md ring-1 ring-purple-100">
                  <img src="/logo-le-small.png" alt="LE" className="w-full h-full object-cover" />
                </div>
                <span className="font-black text-slate-800 text-xl">LocalEcomer</span>
              </div>
              <p className="text-sm font-medium text-slate-800 leading-relaxed mb-6">
                Plataforma digital de comercio electrónico para emprendedores colombianos. 
              </p>
              <div className="text-[10px] font-bold uppercase tracking-wider space-y-1.5 text-slate-700">
                <p>NIT: Persona Natural - Régimen Simple</p>
                <p>Actividad: 4791 - Comercio al por menor</p>
                <p>Bogotá D.C., Colombia</p>
              </div>
            </div>

            {/* Plataforma */}
            <div>
              <h4 className="text-slate-800 font-black text-sm mb-5 uppercase tracking-widest">Plataforma</h4>
              <ul className="space-y-3 text-sm font-bold text-slate-800">
                <li><Link href="/tiendas" className="hover:text-purple-600 transition-colors">Explorar Tiendas</Link></li>
                <li><a href="https://t.me/localecomer" target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 transition-colors">Comunidad Telegram</a></li>
              </ul>
            </div>

            {/* Plan */}
            <div>
              <h4 className="text-slate-800 font-black text-sm mb-5 uppercase tracking-widest">Resumen Plan</h4>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600 font-black text-[11px] uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded-full">7 días gratis</span>
                </div>
                <p className="text-2xl font-black text-slate-800 mb-4">$35.000 <span className="text-xs font-bold text-slate-800">COP/m</span></p>
                <AuthGate
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md"
                  label="Empezar ahora"
                  fallbackHref="/dashboard"
                />
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-slate-800 font-black text-sm mb-5 uppercase tracking-widest">Legal & Contacto</h4>
              <ul className="space-y-3 text-sm font-bold text-slate-800 mb-8">
                <li><Link href="/politicas/terminos" className="hover:text-purple-600 transition-colors">Términos y Condiciones</Link></li>
                <li><Link href="/politicas/privacidad" className="hover:text-purple-600 transition-colors">Política de Privacidad</Link></li>
                <li><Link href="/politicas/cookies" className="hover:text-purple-600 transition-colors">Política de Cookies</Link></li>
              </ul>
              <ul className="space-y-3 text-xs font-bold text-slate-800">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-900">✉</span>
                  <a href="mailto:localecomer@gmail.com" className="hover:text-purple-600">localecomer@gmail.com</a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">✆</span>
                  <a href="https://wa.me/573005730682" className="hover:text-emerald-600">300 573 0682</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-6 py-6 text-center sm:text-left">
            <p className="text-[11px] font-bold text-slate-700">
              © {new Date().getFullYear()} LocalEcomer. Ley 1581 (Datos) y Ley 527 (Comercio Electrónico).
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
