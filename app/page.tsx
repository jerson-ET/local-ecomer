import { createClient } from '@/lib/supabase/server'
import AuthGate from '@/components/auth/AuthGate'
import InstallPWA from '@/components/pwa/InstallPWA'
import Link from 'next/link'
import MarketplaceContainer, { MarketplaceProduct } from '@/components/features/marketplace/MarketplaceContainer'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// SEO metadata tags automatically handled by Next.js metadata system:
export const metadata = {
  title: 'LocalEcomer Marketplace - Compra Directo a Tiendas Locales',
  description: 'Explora y compra productos directamente de tiendas locales en Colombia. Encuentra calzado, ropa, accesorios y más en Naira Shop y otros comercios.',
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

async function getMarketplaceProducts(): Promise<MarketplaceProduct[]> {
  const supabase = await createClient()

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
      stores!inner(id, name, slug, theme_color, is_active)
    `)
    .eq('is_active', true)
    .eq('stores.is_active', true)

  const queryResult = await query
    .or('show_in_marketplace.is.null,show_in_marketplace.eq.true')
    .order('created_at', { ascending: false })

  let data: any[] | null = queryResult.data
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
        stores!inner(id, name, slug, theme_color, is_active)
      `)
      .eq('is_active', true)
      .eq('stores.is_active', true)
      .order('created_at', { ascending: false })

    if (fallbackError) {
      console.error('Fallback query failed:', fallbackError)
      return []
    }
    data = fallbackData
  }

  if (!data) return []

  return data.map((p: any) => {
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
      store: {
        id: p.stores.id,
        name: p.stores.name,
        slug: p.stores.slug,
        theme_color: p.stores.theme_color || '#ff5a26',
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
      <nav className="sticky top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-slate-900 shadow-sm shrink-0">
              <img src="/logo-le-small.png" alt="LocalEcomer" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-xl tracking-tight leading-none text-slate-900">LocalEcomer</span>
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1 leading-none">Marketplace</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <InstallPWA />
            <AuthGate
              className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-2.5 sm:py-3.5 text-sm sm:text-base font-black text-white shadow-md border-2 border-slate-950 transition-all cursor-pointer"
              label="Mi Panel"
              fallbackHref="/dashboard"
            />
          </div>
        </div>
      </nav>

      {/* ─── CONTENEDOR PRINCIPAL DEL MARKETPLACE ─── */}
      <main className="pb-24">
        <MarketplaceContainer initialProducts={products} stats={stats} />
      </main>

      {/* ─── FOOTER MODERNISTA Y SOPORTES ─── */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/20 bg-white p-1">
                <img src="/logo-le-small.png" alt="LocalEcomer" className="w-full h-full object-contain" />
              </div>
              <span className="font-black text-xl tracking-tight text-white">LocalEcomer</span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs font-medium leading-relaxed">
              La plataforma para el comercio independiente en Colombia. Conecta tiendas de barrio y marcas emprendedoras con compradores directos.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">Plataforma</h4>
            <ul className="space-y-2 text-slate-300 font-bold text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-orange-500 transition-colors">Panel del Vendedor</Link>
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
