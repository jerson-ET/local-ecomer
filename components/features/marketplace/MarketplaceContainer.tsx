'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ShoppingBag, ArrowUpRight, Tag, Store, RefreshCw } from 'lucide-react'
import { formatPrice } from '@/lib/store/marketplace'

export interface MarketplaceStore {
  id: string
  name: string
  slug: string
  theme_color: string
}

export interface MarketplaceProduct {
  id: string
  name: string
  description: string | null
  price: number
  discountPrice: number | null
  discountPercent: number | null
  category: string
  mainImage: string
  store: MarketplaceStore
}

interface Props {
  initialProducts: MarketplaceProduct[]
  stats: {
    stores: number
    products: number
  }
}

const CATEGORIES = [
  'Todos',
  'Calzado',
  'Ropa',
  'Accesorios',
  'Electrónica',
  'Hogar',
  'Mascotas',
  'Artesanía',
  'Gorras',
  'Alimentos',
  'Belleza',
  'Deportes',
  'Otro',
]

export default function MarketplaceContainer({ initialProducts, stats }: Props) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')

  // Filtrado y ordenación reactiva en el cliente
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts]

    // 1. Filtro por categoría
    if (selectedCategory !== 'Todos') {
      result = result.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // 2. Filtro por término de búsqueda
    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.store.name.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      )
    }

    // 3. Ordenación
    if (sortBy === 'newest') {
      // Ya vienen ordenados por fecha por defecto
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price))
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price))
    }

    return result
  }, [initialProducts, selectedCategory, search, sortBy])

  const handleResetFilters = () => {
    setSearch('')
    setSelectedCategory('Todos')
    setSortBy('newest')
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ─── ESTILOS EMBUBIDOS PARA TRANSICIONES Y EFECTOS ULTRA-PREMIUM ─── */}
      <style jsx global>{`
        .glass-header {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .marketplace-title-gradient {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-banner-accent {
          background: linear-gradient(135deg, #ff5a26 0%, #ff8c00 100%);
        }
        .search-glow:focus-within {
          box-shadow: 0 0 0 3px rgba(255, 90, 38, 0.15);
          border-color: #ff5a26;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .product-hover-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .product-hover-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .product-hover-image {
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .product-hover-card:hover .product-hover-image {
          transform: scale(1.06);
        }
      `}</style>

      {/* ─── BANNER DE BIENVENIDA / HERO INFORMATIVO ─── */}
      <div className="mb-12 rounded-3xl p-8 sm:p-12 relative overflow-hidden border-2 border-slate-900 bg-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full blur-3xl -z-10 opacity-70"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-100 rounded-full blur-3xl -z-10 opacity-60"></div>
        
        <div className="space-y-4 max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            <ShoppingBag size={14} />
            Marketplace Activo
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Descubre productos de <span className="text-orange-600">tiendas locales</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
            Compra directamente a tus marcas favoritas sin comisiones ocultas. Compras rápidas e interacciones seguras a través de WhatsApp.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
            <div className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl">
              <span className="block text-2xl font-black text-slate-900">{stats.stores}</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiendas Activas</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl">
              <span className="block text-2xl font-black text-slate-900">{stats.products}</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catálogos en Línea</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full sm:w-auto min-w-[240px]">
          <Link
            href="/dashboard"
            className="w-full text-center px-8 py-4 bg-slate-950 text-white font-black rounded-2xl text-base border-2 border-slate-950 shadow-md hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
          >
            <span>Crear mi Tienda Gratis</span>
            <ArrowUpRight size={18} />
          </Link>
          <button
            onClick={() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full px-8 py-4 bg-white text-slate-950 font-black rounded-2xl text-base border-2 border-slate-200 hover:border-slate-950 hover:bg-slate-50 transition-all"
          >
            Explorar Catálogo
          </button>
        </div>
      </div>

      {/* ─── BARRA DE BUSQUEDA, CATEGORÍAS Y FILTROS ─── */}
      <div id="catalog-section" className="space-y-6 mb-10">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Input de Búsqueda */}
          <div className="flex-1 min-w-[280px]">
            <div className="relative search-glow border-2 border-slate-200 bg-white rounded-2xl flex items-center px-4 py-3.5 transition-all">
              <Search className="text-slate-400 mr-3 shrink-0" size={20} />
              <input
                type="text"
                placeholder="Buscar por producto, tienda o categoría..."
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
              className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3.5 font-bold text-slate-700 text-sm outline-none cursor-pointer focus:border-slate-950 transition-colors"
            >
              <option value="newest">Más recientes</option>
              <option value="price-asc">Precio: de menor a mayor</option>
              <option value="price-desc">Precio: de mayor a menor</option>
            </select>
          </div>
        </div>

        {/* Categorías (Scroll Horizontal en móvil) */}
        <div className="relative">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-black whitespace-nowrap border transition-all ${
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
      </div>

      {/* ─── GRID DE PRODUCTOS EN EL MARKETPLACE ─── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>Resultados</span>
            <span className="bg-slate-100 text-slate-600 text-xs font-black px-2.5 py-1 rounded-full">
              {filteredProducts.length}
            </span>
          </h2>
          {(search || selectedCategory !== 'Todos' || sortBy !== 'newest') && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl transition-all"
            >
              <RefreshCw size={12} />
              Reestablecer Filtros
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          /* Estado vacío */
          <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 animate-bounce">
              <ShoppingBag size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">No se encontraron productos</h3>
            <p className="text-slate-500 font-bold max-w-sm mb-6 text-sm">
              Intenta cambiar los términos de búsqueda o selecciona otra categoría en los filtros.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-3 bg-slate-950 hover:bg-slate-900 text-white font-black rounded-xl text-sm transition-all"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          /* Grid de Productos */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              const hasDiscount = product.discountPrice && product.discountPrice < product.price
              const displayPrice = hasDiscount ? product.discountPrice! : product.price
              const storeColor = product.store.theme_color || '#ff5a26'

              return (
                <div
                  key={product.id}
                  className="product-hover-card bg-white border-2 border-slate-100 rounded-3xl overflow-hidden flex flex-col relative group"
                >
                  {/* Imagen y badges */}
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-50 border-b-2 border-slate-100">
                    <img
                      src={product.mainImage}
                      alt={product.name}
                      loading="lazy"
                      className="product-hover-image w-full h-full object-cover"
                    />

                    {/* Descuento Badge */}
                    {hasDiscount && (
                      <span className="absolute top-3 left-3 bg-orange-600 border border-orange-700 text-white text-[10px] font-black px-2 py-1 rounded-lg z-10 uppercase tracking-wider shadow-sm">
                        -{product.discountPercent}%
                      </span>
                    )}

                    {/* Badge de Tienda Originadora */}
                    <div
                      className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-xl z-10 flex items-center gap-1.5 text-[10px] font-black text-white shadow-md border"
                      style={{
                        backgroundColor: storeColor,
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                      }}
                    >
                      <Store size={10} />
                      <span className="truncate max-w-[80px]">{product.store.name}</span>
                    </div>

                    {/* Hover Link to product directly in the store */}
                    <Link
                      href={`/tienda/${product.store.slug}?productId=${product.id}`}
                      className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center gap-2"
                    >
                      <span className="bg-white text-slate-950 text-xs font-black py-2.5 px-4 rounded-xl shadow-lg border border-slate-200 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-1">
                        Ver Detalles
                        <ArrowUpRight size={14} />
                      </span>
                    </Link>
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      {/* Categoría */}
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Tag size={8} />
                        {product.category}
                      </span>

                      {/* Nombre */}
                      <h4 className="font-bold text-slate-800 text-sm sm:text-base line-clamp-2 hover:text-slate-950 transition-colors">
                        <Link href={`/tienda/${product.store.slug}?productId=${product.id}`}>
                          {product.name}
                        </Link>
                      </h4>
                    </div>

                    {/* Precio y Enlace */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                      <div className="flex flex-col">
                        {hasDiscount && (
                          <span className="text-slate-400 text-[10px] font-bold line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
                        <span className="text-slate-950 font-black text-sm sm:text-base">
                          {formatPrice(displayPrice)}
                        </span>
                      </div>

                      {/* Botón flotante para ir a la tienda */}
                      <Link
                        href={`/tienda/${product.store.slug}?productId=${product.id}`}
                        className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-slate-600 flex items-center justify-center transition-colors border border-slate-100"
                        title={`Comprar en ${product.store.name}`}
                      >
                        <ArrowUpRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
