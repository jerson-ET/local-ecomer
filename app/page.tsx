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
    <div className="min-h-[100dvh] bg-[#fafafa] text-[#111]">
      {/* JSON-LD Structured Data para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

          <p className="max-w-xl mx-auto text-lg text-gray-400 font-medium mb-6">
            Crea tu catálogo, sube productos y vende directamente a tus clientes.
            Sin complicaciones, sin intermediarios.
          </p>

          {/* ═══ PRICING BADGE ═══ */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-2xl px-6 py-3 mb-10">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 font-black text-sm uppercase tracking-wider">7 días gratis</span>
            </span>
            <span className="w-px h-5 bg-white/10" />
            <span className="text-gray-400 text-sm font-semibold">
              Después <span className="text-white font-black">$35.000 COP</span>/mes
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthGate
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl text-base hover:bg-gray-100 transition-colors shadow-lg shadow-white/10"
              label="Crear mi Catálogo — Gratis 7 Días"
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

      {/* ═══ PRICING ═══ */}
      <section className="bg-white py-20 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
            Un precio simple. Sin sorpresas.
          </h2>
          <p className="text-gray-500 mb-12 max-w-lg mx-auto">
            Empieza gratis y crece a tu ritmo. Sin contratos, cancela cuando quieras.
          </p>

          <div className="bg-[#0a0e17] text-white rounded-3xl p-10 sm:p-14 max-w-md mx-auto relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.4), transparent 60%)' }} />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 font-black text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                7 Días Gratis
              </div>
              
              <div className="mb-6">
                <span className="text-5xl sm:text-6xl font-black">$35.000</span>
                <span className="text-gray-400 font-bold ml-2">COP/mes</span>
              </div>

              <ul className="text-left space-y-3 mb-10 text-sm">
                {[
                  'Catálogo digital ilimitado',
                  'Subir productos con fotos',
                  'Enlace personalizado de tienda',
                  'Contacto directo por WhatsApp',
                  'Panel de administración',
                  'Programa de referidos',
                  'Soporte técnico prioritario',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <AuthGate
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors text-center block"
                label="Empezar 7 Días Gratis"
                fallbackHref="/dashboard"
              />
              <p className="text-[10px] text-gray-500 mt-3 uppercase tracking-wider font-bold">Sin tarjeta de crédito requerida</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TIENDAS ACTIVAS ═══ */}
      {stores.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20">
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
            label="Empezar Gratis — 7 Días de Prueba"
            fallbackHref="/dashboard"
          />
        </div>
      </section>

      {/* ═══ FOOTER LEGAL COMPLETO ═══ */}
      <footer className="bg-[#060910] text-gray-400">
        {/* Sección principal del footer */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Columna 1: Marca y Registro */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-xs">LE</span>
                </div>
                <span className="font-black text-white text-lg">LocalEcomer</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                Plataforma digital de comercio electrónico para emprendedores colombianos. Crea tu tienda, vende productos y gana dinero.
              </p>
              <div className="text-[10px] font-bold uppercase tracking-wider space-y-1 text-gray-500">
                <p>Plataforma registrada ante la DIAN</p>
                <p>NIT: Persona Natural - Régimen Simple</p>
                <p>Actividad económica: 4791 - Comercio al por menor</p>
                <p>Bogotá D.C., Colombia</p>
              </div>
            </div>

            {/* Columna 2: Plataforma */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Plataforma</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/tiendas" className="hover:text-white transition-colors">Explorar Tiendas</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Panel de Vendedor</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Comunidad</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">Planes y Precios</Link></li>
              </ul>
            </div>

            {/* Columna 3: Legal */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/politicas/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link></li>
                <li><Link href="/politicas/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
                <li><Link href="/politicas/datos" className="hover:text-white transition-colors">Tratamiento de Datos</Link></li>
                <li><Link href="/politicas/cookies" className="hover:text-white transition-colors">Política de Cookies</Link></li>
              </ul>
            </div>

            {/* Columna 4: Soporte */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Soporte</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="mailto:soporte@localecomer.com" className="hover:text-white transition-colors">soporte@localecomer.com</a></li>
                <li><a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp Soporte</a></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Centro de Ayuda</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Barra inferior legal */}
        <div className="border-t border-white/5">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[10px] font-semibold text-gray-600 text-center sm:text-left">
                <p>© {new Date().getFullYear()} LocalEcomer. Todos los derechos reservados.</p>
                <p className="mt-1">Plataforma operada bajo la legislación colombiana. Ley 1581 de 2012 — Protección de Datos Personales. Ley 527 de 1999 — Comercio Electrónico.</p>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/politicas/terminos" className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider">Términos</Link>
                <span className="w-1 h-1 bg-gray-700 rounded-full" />
                <Link href="/politicas/privacidad" className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider">Privacidad</Link>
                <span className="w-1 h-1 bg-gray-700 rounded-full" />
                <Link href="/politicas/cookies" className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider">Cookies</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

