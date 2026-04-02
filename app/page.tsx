import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AuthGate from '@/components/auth/AuthGate'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HOMEPAGE — Server Component                                               */
/*  Ligero, cacheable, SEO-friendly. Sin 'use client'.                        */
/*  Carga tiendas activas desde Supabase con conteo de productos.             */
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

  // Cargar tiendas activas con conteo de productos activos
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, slug, description, logo_url, banner_url, theme_color')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(12)

  if (!stores || stores.length === 0) return []

  // Obtener conteo de productos por tienda en una sola query
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

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] text-[#111]">
      {/* ═══ HERO ═══ */}
      <header className="relative overflow-hidden bg-[#0a0e17] text-white">
        {/* Gradient mesh */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.2) 0%, transparent 50%)',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 sm:py-28 text-center">
          <AuthGate
            className="inline-flex items-center gap-2 bg-white rounded-full px-5 py-2 mb-8 hover:bg-gray-100 transition-colors shadow-sm text-sm font-bold tracking-wide text-black"
            label="Iniciar Sesión"
            fallbackHref="/dashboard"
          />

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            Tu comercio digital
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              empieza aquí.
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-lg text-gray-400 font-medium mb-10">
            Crea tu catálogo, sube productos y vende directamente a tus clientes.
            Sin complicaciones, sin intermediarios.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthGate
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl text-base hover:bg-gray-100 transition-colors shadow-lg shadow-white/10"
              label="Crear mi Catálogo"
              fallbackHref="/dashboard"
            />
            <Link
              href="/tiendas"
              className="w-full sm:w-auto px-8 py-4 border border-white/20 text-white font-bold rounded-xl text-base hover:bg-white/5 transition-colors text-center"
            >
              Explorar Tiendas
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 mt-14">
            <div className="text-center">
              <p className="text-3xl font-black text-white">{stats.stores}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">
                Tiendas
              </p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">{stats.products}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">
                Productos
              </p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">24/7</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">
                Disponible
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ CÓMO FUNCIONA ═══ */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-14 tracking-tight">
          ¿Cómo funciona?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
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
            <div
              key={item.step}
              className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="absolute top-4 right-4 text-xs font-black text-gray-200 tracking-widest">
                {item.step}
              </span>
              <span className="text-4xl mb-5 block">{item.icon}</span>
              <h3 className="text-lg font-bold mb-2 text-[#111]">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TIENDAS ACTIVAS ═══ */}
      {stores.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Tiendas activas</h2>
            <Link
              href="/tiendas"
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Ver todas →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  {/* Banner */}
                  <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {displayBanner ? (
                      <img
                        src={displayBanner}
                        alt={store.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${store.theme_color}22, ${store.theme_color}44)`,
                        }}
                      >
                        <span className="text-5xl font-black text-white/20 uppercase">
                          {store.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {store.product_count > 0 && (
                      <span className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {store.product_count} producto{store.product_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-[#111] text-lg mb-1 group-hover:text-indigo-600 transition-colors">
                      {store.name}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                      {store.description || 'Catálogo de productos'}
                    </p>
                    {storeLocation && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
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

      {/* ═══ CTA FINAL ═══ */}
      <section className="bg-[#0a0e17] text-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            ¿Listo para vender?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Únete a los vendedores que ya están usando LocalEcomer para hacer crecer su negocio.
          </p>
          <AuthGate
            className="inline-flex px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-base transition-colors"
            label="Empezar Gratis"
            fallbackHref="/dashboard"
          />
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#060910] text-gray-500 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-semibold tracking-wider uppercase">
            © {new Date().getFullYear()} LocalEcomer
          </p>
          <div className="flex gap-6">
            <Link href="/tiendas" className="text-xs hover:text-white transition-colors">
              Tiendas
            </Link>
            <Link href="/dashboard" className="text-xs hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
