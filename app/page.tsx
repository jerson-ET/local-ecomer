import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AuthGate from '@/components/auth/AuthGate'
import InstallPWA from '@/components/pwa/InstallPWA'

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
    description: 'Marketplace colombiano para crear tiendas online y vender productos. 15 días gratis.',
    offers: {
      '@type': 'Offer',
      price: '35000',
      priceCurrency: 'COP',
      description: 'Plan mensual después de 15 días de prueba gratis',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '120',
    },
  }

  return (
    <div className="min-h-[100dvh] text-black bg-white relative font-sans selection:bg-orange-100 selection:text-orange-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ═══ HIGH-CONTRAST NAVIGATION ═══ */}
      <nav className="fixed top-0 left-0 w-full p-4 sm:p-6 z-50 flex items-center justify-between bg-white border-b-2 border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-black">
            <img src="/logo-le-small.png" alt="LocalEcomer" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-2xl tracking-tight text-black">LocalEcomer</span>
        </div>
        <div className="flex items-center gap-3">
          <InstallPWA />
          <AuthGate
            className="inline-flex items-center gap-2 bg-black rounded-xl px-6 py-3 text-base font-black text-white"
            label="Iniciar Sesión"
            fallbackHref="/dashboard"
          />
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <header className="relative pt-32 pb-20 px-6 max-w-6xl mx-auto">
        {/* Store Illustration with Product Cards */}
        <div className="relative w-full max-w-sm mx-auto mb-8">
          {/* Store Building */}
          <img
            src="/store-illustration.png"
            alt="Tu tienda digital"
            className="w-full h-auto"
          />
          {/* Product Cards Grid - Overlaid on the store */}
          <div className="absolute top-[38%] left-1/2 -translate-x-1/2 grid grid-cols-2 gap-2 w-[55%]">
            {[
              { img: '/product-shoe.jpg', name: 'Zapato' },
              { img: '/product-cap.jpg', name: 'Gorra' },
              { img: '/product-shirt.jpg', name: 'Camisa' },
              { img: '/product-watch.jpg', name: 'Reloj' },
            ].map((product) => (
              <div key={product.name} className="bg-white rounded-xl shadow-lg border-2 border-black/10 overflow-hidden">
                <img
                  src={product.img}
                  alt={product.name}
                  className="w-full aspect-square object-cover"
                />
                <p className="text-[10px] sm:text-xs font-black text-center py-1 text-black">{product.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center py-8 relative">
          <h1 className="text-6xl sm:text-9xl font-black text-black tracking-tighter mb-8 leading-[0.85]">
            LocalEcomer
          </h1>
          
          <p className="text-3xl sm:text-5xl font-black text-black mb-8 tracking-tight">
            Tu comercio digital <span className="text-orange-600">empieza aquí.</span>
          </p>

          <p className="max-w-xl mx-auto text-xl sm:text-2xl text-black mb-12 leading-relaxed font-bold">
            Crea tu catálogo, sube productos y vende directamente a tus clientes.
            Sin complicaciones, sin intermediarios.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full">
            <AuthGate
              className="w-full sm:w-auto px-12 py-5 bg-black text-white font-black rounded-2xl text-xl"
              label="Empezar Ahora"
              fallbackHref="/dashboard"
            />
            <Link
              href="/tiendas"
              className="w-full sm:w-auto px-12 py-5 bg-white text-black font-black rounded-2xl text-xl border-4 border-black"
            >
              Explorar Tiendas
            </Link>
          </div>

          {/* Pricing Badge - High Visibility */}
          <div className="mt-14 inline-flex items-center gap-4 bg-orange-600 text-white px-8 py-3 rounded-full text-base font-black border-2 border-orange-700">
            <span className="w-3 h-3 bg-white rounded-full" />
            <span>15 días gratis, después $50.000 COP/mes</span>
          </div>
        </div>

        {/* Stats - Maximum Visibility */}
        <div className="grid grid-cols-2 gap-8 sm:gap-20 pt-20 border-t-4 border-black mt-20">
          <div className="text-center">
            <p className="text-6xl sm:text-8xl font-black text-black">{stats.stores}</p>
            <p className="text-base text-black font-black uppercase tracking-widest mt-4 bg-orange-100 inline-block px-4 py-1">Tiendas Activas</p>
          </div>
          <div className="text-center">
            <p className="text-6xl sm:text-8xl font-black text-black">{stats.products}</p>
            <p className="text-base text-black font-black uppercase tracking-widest mt-4 bg-orange-100 inline-block px-4 py-1">Productos Totales</p>
          </div>
        </div>
      </header>

      {/* ═══ CÓMO FUNCIONA ═══ */}
      <section className="bg-white py-32 border-y-4 border-black">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-5xl font-black text-center mb-24 tracking-tight text-black">
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-20">
            {[
              {
                step: '01',
                title: 'Crea tu catálogo',
                desc: 'Regístrate y configura tu tienda en minutos. Elige nombre, sube banner y personaliza.',
                icon: '🛍️',
              },
              {
                step: '02',
                title: 'Sube productos',
                desc: 'Agrega fotos, precios, variantes y descripciones. Todo optimizado para móvil.',
                icon: '📦',
              },
              {
                step: '03',
                title: 'Vende y cobra',
                desc: 'Comparte tu enlace. Los clientes contactan por WhatsApp. Tú manejas el envío y cobro.',
                icon: '💰',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-black text-orange-600 mb-6 flex items-center gap-4">
                  <span className="bg-orange-100 px-4 py-2 rounded-2xl">{item.step}</span>
                  <span className="text-4xl">{item.icon}</span>
                </div>
                <h3 className="text-3xl font-black mb-6 text-black">{item.title}</h3>
                <p className="text-xl text-black leading-relaxed font-bold">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-black tracking-tight mb-8 text-black">
            Un precio simple <span className="text-orange-600">sin sorpresas.</span>
          </h2>
          <p className="text-2xl text-black mb-20 max-w-lg mx-auto font-black">
            Empieza gratis y crece a tu ritmo. Sin contratos, cancela cuando quieras.
          </p>

          <div className="bg-white border-4 border-black rounded-3xl p-8 sm:p-12 max-w-md mx-auto relative">
            <div className="text-center mb-6">
              <span className="bg-orange-600 text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Recomendado</span>
            </div>
            
            <div className="mb-8 text-center border-b-2 border-black pb-8">
              <span className="text-5xl sm:text-6xl font-black text-black">$50.000</span>
              <span className="text-black font-black text-base sm:text-lg ml-2">COP/mes</span>
            </div>

            <ul className="text-left space-y-4 mb-10">
              {[
                'Catálogo digital ilimitado',
                'Subir productos con fotos',
                'Enlace personalizado de tienda',
                'Contacto directo por WhatsApp',
                'Panel de administración',
                'Programa de referidos',
                'Soporte técnico prioritario',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-black">
                  <span className="text-orange-600 font-black text-lg flex-shrink-0">✓</span>
                  <span className="font-bold text-base">{feature}</span>
                </li>
              ))}
            </ul>

            <AuthGate
              className="w-full py-4 bg-black text-white font-black rounded-2xl text-lg"
              label="Empezar Ahora"
              fallbackHref="/dashboard"
            />
            <p className="text-xs text-black mt-6 uppercase tracking-widest font-black text-center">Sin tarjeta de crédito</p>
          </div>
        </div>
      </section>

      {/* ═══ TIENDAS ACTIVAS ═══ */}
      {stores.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Tiendas en acción</h2>
            <Link
              href="/tiendas"
              className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Ver todas →
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
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-100 transition-all hover:border-slate-300"
                >
                  <div className="relative h-44 bg-slate-50 overflow-hidden">
                    {displayBanner ? (
                      <img
                        src={displayBanner}
                        alt={store.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${store.theme_color}22, ${store.theme_color}44)`,
                        }}
                      >
                        <span className="text-4xl font-black text-slate-300 uppercase">
                          {store.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">
                      {store.name}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                      {store.description || 'Catálogo de productos premium'}
                    </p>
                    {storeLocation && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {storeLocation}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="font-black text-slate-900 text-xl tracking-tight">LocalEcomer</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Plataforma digital de comercio electrónico para emprendedores colombianos. 
              </p>
            </div>

            <div>
              <h4 className="text-slate-900 font-bold text-sm mb-5 uppercase tracking-widest">Recursos</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="/tiendas" className="hover:text-slate-900 transition-colors">Tiendas</Link></li>
                <li><Link href="/blog" className="hover:text-slate-900 transition-colors">Comunidad</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 font-bold text-sm mb-5 uppercase tracking-widest">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="/politicas/terminos" className="hover:text-slate-900 transition-colors">Términos</Link></li>
                <li><Link href="/politicas/privacidad" className="hover:text-slate-900 transition-colors">Privacidad</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 font-bold text-sm mb-5 uppercase tracking-widest">Contacto</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>localecomer@gmail.com</li>
                <li>+57 300 573 0682</li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-slate-50 text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest">
            © {new Date().getFullYear()} LocalEcomer. Bogotá, Colombia.
          </div>
        </div>
      </footer>
    </div>
  )
}
