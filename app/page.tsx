import { Suspense } from 'react'
import { createPublicClient } from '@/lib/supabase/server'
import AuthGate from '@/components/auth/AuthGate'
import InstallPWA from '@/components/pwa/InstallPWA'
import Link from 'next/link'
import MarketplaceContainer, { MarketplaceProduct } from '@/components/features/marketplace/MarketplaceContainer'

export const revalidate = 15

// SEO metadata tags automatically handled by Next.js metadata system:
export const metadata = {
  title: 'LocalEcomer Marketplace - Compra Directo a Tiendas Locales',
  description: 'Explora y compra productos directamente de tiendas locales en Colombia. Encuentra calzado, ropa, accesorios y más en Naira Shop y otros comercios.',
}

async function getStats() {
  const supabase = createPublicClient()
  const [storesRes, productsRes] = await Promise.all([
    supabase.from('stores').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])
  return {
    stores: storesRes.count || 0,
    products: productsRes.count || 0,
  }
}

interface DbProduct {
  id: string
  name: string
  description: string | null
  price: number
  discount_price: number | null
  discount_percent: number | null
  images: any[] | null
  category_id: string | null
  is_active: boolean
  show_in_marketplace?: boolean | null
  created_at: string
  updated_at: string
  stores: {
    id: string
    name: string
    slug: string
    theme_color: string | null
    banner_url?: string | null
    is_active: boolean
  }
}

async function getMarketplaceProducts(): Promise<MarketplaceProduct[]> {
  const supabase = createPublicClient()

  // Intentamos consultar con show_in_marketplace
  const query = supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
      discount_price,
      discount_percent,
      images,
      category_id,
      is_active,
      show_in_marketplace,
      created_at,
      updated_at,
      stores!inner(id, name, slug, theme_color, banner_url, is_active)
    `)
    .eq('is_active', true)
    .eq('stores.is_active', true)

  const queryResult = await query
    .or('show_in_marketplace.is.null,show_in_marketplace.eq.true')
    .order('created_at', { ascending: false })

  let data: DbProduct[] | null = queryResult.data as unknown as DbProduct[] | null
  let error = queryResult.error

  if (error) {
    console.warn('Error querying with show_in_marketplace, executing fallback...', error.message)
    // Fallback sin la columna show_in_marketplace por si la base de datos no se ha migrado
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        discount_price,
        discount_percent,
        images,
        category_id,
        is_active,
        created_at,
        updated_at,
        stores!inner(id, name, slug, theme_color, banner_url, is_active)
      `)
      .eq('is_active', true)
      .eq('stores.is_active', true)
      .order('created_at', { ascending: false })

    if (fallbackError) {
      console.error('Fallback query failed:', fallbackError)
      return []
    }
    data = fallbackData as unknown as DbProduct[] | null
  }

  if (!data) return []

  return data.map((p: DbProduct) => {
    const images = p.images || []
    const mainImg = images[0]?.thumbnail || images[0]?.full || '/placeholder-product.jpg'
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      discountPrice: p.discount_price,
      discountPercent: p.discount_percent,
      category: p.category_id || 'Otros',
      mainImage: mainImg,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      store: {
        id: p.stores.id,
        name: p.stores.name,
        slug: p.stores.slug,
        theme_color: p.stores.theme_color || '#ff5a26',
        location: (() => {
          try {
            if (p.stores.banner_url && p.stores.banner_url.startsWith('{')) {
              const parsed = JSON.parse(p.stores.banner_url)
              return parsed.shippingLocation || ''
            }
          } catch {}
          return ''
        })()
      }
    }
  })
}

export default async function HomePage() {
  const [products, stats] = await Promise.all([
    getMarketplaceProducts(),
    getStats(),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LocalEcomer Marketplace',
    url: 'https://localecomer.app',
    description: 'Marketplace de comercios y marcas locales en Colombia. Compra directo por WhatsApp.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://localecomer.app/?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <div className="min-h-screen text-slate-900 bg-slate-50 font-sans selection:bg-orange-100 selection:text-orange-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── NAVEGACIÓN ULTRA-PREMIUM CON ACCESO AL PANEL DE ADMINISTRACIÓN ─── */}
      <nav className="sticky top-0 left-0 w-full bg-[#0a0e17]/90 backdrop-blur-md border-b border-amber-500/20 z-50 transition-all shadow-md overflow-hidden h-[80px]">
        <div className="max-w-[1920px] mx-auto pl-0 pr-4 sm:pr-6 lg:pr-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 h-full">
            <div className="h-[124px] w-[136px] overflow-hidden shrink-0 self-start -mt-[13px]">
              <img src="/logooriginal.webp" alt="LocalEcomer" className="w-full h-full object-cover scale-[1.06]" />
            </div>
            <span className="font-black text-2xl sm:text-3xl tracking-tight leading-none text-white">Tiendas Locales</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Suspense fallback={null}>
              <InstallPWA className="!bg-white hover:!bg-white/90 !text-black !shadow-sm" />
            </Suspense>
            <Suspense fallback={null}>
              <AuthGate
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-white/90 rounded-[7px] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-xs leading-none font-black text-black shadow-sm transition-all cursor-pointer border border-slate-200"
                label="INGRESAR"
                fallbackHref="/dashboard"
              />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* ─── CONTENEDOR PRINCIPAL DEL MARKETPLACE ─── */}
      <main className="pb-24">
        <MarketplaceContainer initialProducts={products} stats={stats} />
      </main>

      {/* ─── FOOTER MODERNISTA Y SOPORTES ─── */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-16 px-4">
        <div className="max-w-[1920px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-[8px] overflow-hidden border border-white/20 bg-white p-1">
                <img src="/logooriginal.webp" alt="LocalEcomer" className="w-full h-full object-contain" />
              </div>
              <span className="font-black text-xl tracking-tight text-white">LocalEcomer</span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs font-medium leading-relaxed">
              La plataforma de Sistemas de Ventas Inteligentes de Colombia. Conecta emprendedores y marcas con compradores directos.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">Plataforma</h4>
            <ul className="space-y-2 text-slate-300 font-bold text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-orange-500 transition-colors">Mi Sistema de Ventas</Link>
              </li>
              <li>
                <Link href="/tiendas" className="hover:text-orange-500 transition-colors">Todas las Tiendas</Link>
              </li>
              <li>
                <a href="https://wa.me/573219491871" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Soporte Técnico</a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">Legal y Términos</h4>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              LocalEcomer es un facilitador tecnológico. Los pagos y envíos se pactan directamente entre vendedor y comprador. 
              <br />
              <span className="block mt-2">© {new Date().getFullYear()} LocalEcomer. Todos los derechos reservados.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
