'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, ShoppingBag, RefreshCw, Store } from 'lucide-react'
import Link from 'next/link'

export interface MarketplaceStore {
  id: string
  name: string
  slug: string
  theme_color: string
  location?: string
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
  createdAt?: string
  updatedAt?: string
  store: MarketplaceStore
}

interface Props {
  initialProducts: MarketplaceProduct[]
  stats: {
    stores: number
    products: number
  }
}

const CATEGORIES_ORDER = [
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

export default function MarketplaceContainer({ initialProducts, stats: _stats }: Props) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')
  const [isMobile, setIsMobile] = useState(false)
  const [isPc, setIsPc] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsPc(window.innerWidth >= 1024)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  // Categorías dinámicas: solo se muestran las que tienen productos en el sistema
  const categories = useMemo(() => {
    const activeCats = new Set<string>()
    initialProducts.forEach((p) => {
      if (p.category) {
        const matched = CATEGORIES_ORDER.find(c => c.toLowerCase() === p.category.toLowerCase())
        activeCats.add(matched || p.category)
      }
    })
    
    const sorted = Array.from(activeCats).sort((a, b) => {
      const idxA = CATEGORIES_ORDER.indexOf(a)
      const idxB = CATEGORIES_ORDER.indexOf(b)
      const posA = idxA === -1 ? Infinity : idxA
      const posB = idxB === -1 ? Infinity : idxB
      if (posA !== posB) return posA - posB
      return a.localeCompare(b)
    })
    
    return ['Todos', ...sorted]
  }, [initialProducts])

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

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: MarketplaceProduct[] } = {}
    filteredProducts.forEach((product) => {
      const cat = product.category || 'Otros'
      if (!groups[cat]) {
        groups[cat] = []
      }
      groups[cat].push(product)
    })
    return groups
  }, [filteredProducts])

  // Sort category keys based on CATEGORIES_ORDER array order
  const sortedCategoryNames = useMemo(() => {
    const categoriesInGroup = Object.keys(groupedProducts)
    return categoriesInGroup.sort((a, b) => {
      const indexA = CATEGORIES_ORDER.indexOf(a)
      const indexB = CATEGORIES_ORDER.indexOf(b)
      const posA = indexA === -1 ? Infinity : indexA
      const posB = indexB === -1 ? Infinity : indexB
      return posA - posB
    })
  }, [groupedProducts])

  const hasDiscounts = useMemo(() => {
    return initialProducts.some(p => {
      const discount = Number(p.discountPrice)
      const price = Number(p.price)
      return discount && discount < price
    })
  }, [initialProducts])


  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          background: linear-gradient(135deg, #007AFF 0%, #0056B3 100%);
        }
        .search-glow:focus-within {
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
          border-color: #007AFF;
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
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
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

      {/* ─── BANNER VIDEO (AL INICIO DEL TODO) ─── */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-10 overflow-hidden rounded-none relative border-y border-slate-200/50 bg-slate-950">
        <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'linear-gradient(105deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0) 41%, rgba(255,255,255,0) 100%)' }} />
        <video 
          src="/carrucel.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-[200px] sm:h-[340px] md:h-[400px] object-cover"
        />
        {/* Shopping bag overlay badge to hide the watermark */}
        <div className="absolute bottom-[-1px] right-4 sm:bottom-[7px] sm:right-6 z-20 flex items-center justify-center">
          <div className="relative group">
            {/* Pulsing outer glow */}
            <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-md group-hover:bg-blue-500/50 transition-all duration-300 animate-pulse" />
            <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-white shadow-lg group-hover:scale-105 group-hover:border-blue-500/50 transition-all duration-300">
              <ShoppingBag className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] text-blue-600 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE BUSQUEDA, CATEGORÍAS Y FILTROS (EN EL MEDIO) ─── */}
      <div id="catalog-section" className="space-y-6 mb-8">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Input de Búsqueda */}
          <div className="w-full">
            <div className="relative search-glow border-2 border-slate-200 bg-white rounded-md flex items-center px-4 py-3.5 transition-all">
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
        </div>

        {/* Categorías (Grid en móvil de 5 en 5, scroll horizontal en desktop) */}
        <div className="relative">
          {isMobile ? (
            /* Mobile Grid: 5 columnas, filas auto-generadas */
            <div className="grid grid-cols-5 gap-1.5 px-1">
              {(isExpanded || categories.length <= 10
                ? categories
                : [...categories.slice(0, 9), 'Ver más']
              ).map((cat) => {
                if (cat === 'Ver más') {
                  return (
                    <button
                      key="ver-mas"
                      onClick={() => setIsExpanded(true)}
                      className="w-full min-h-[38px] px-0.5 py-1 rounded-md text-[10px] font-black text-center flex items-center justify-center border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all leading-tight cursor-pointer"
                    >
                      Ver más
                    </button>
                  )
                }

                const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full min-h-[38px] px-0.5 py-1 rounded-md text-[10px] font-black text-center flex items-center justify-center border transition-all leading-tight ${
                      isActive
                        ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          ) : (
            /* Desktop/Tablet Layout: Scroll horizontal */
            <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-md text-sm font-black whitespace-nowrap border transition-all ${
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
          )}
        </div>
      </div>

      {/* ─── BLOQUE DE PRODUCTOS Y CARRUSELES (ABAJO) ─── */}
      <div className="space-y-6">
        {(search || selectedCategory !== 'Todos' || sortBy !== 'newest') && (
          <div className="flex items-center justify-end">
            <button
              onClick={handleResetFilters}
              className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-md transition-all"
            >
              <RefreshCw size={12} />
              Reestablecer Filtros
            </button>
          </div>
        )}

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
              className="px-6 py-3 bg-slate-950 hover:bg-slate-900 text-white font-black rounded-md text-sm transition-all"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          /* Grilla de productos por categoría (2 columnas, hasta 3 filas/6 productos por sección) */
          <div className="space-y-10">
            {sortedCategoryNames.map((categoryName) => {
              const categoryProducts = groupedProducts[categoryName] || []
              if (categoryProducts.length === 0) return null
              // Show max 6 products per category (3 rows, 2 columns) unless expanded, or 5 if PC (1 row, 5 columns)
              const isCategoryExpanded = expandedCategory === categoryName
              const defaultLimit = isPc ? 5 : 6
              const productsToShow = isCategoryExpanded ? categoryProducts : categoryProducts.slice(0, defaultLimit)

              return (
                <div key={categoryName} className="border-b border-slate-100 pb-8 last:border-0 last:pb-0">
                  <div className="mb-6 px-1">
                    <h2 className="text-xl sm:text-2xl font-black text-[#0a1d37] tracking-tight">
                      {categoryName}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-1">
                    {productsToShow.map((product) => {
                      const hasDiscount = product.discountPrice && product.discountPrice < product.price
                      const displayPrice = hasDiscount ? product.discountPrice! : product.price
                      return (
                        <Link href={`/tienda/${product.store.slug}?productId=${product.id}`} key={product.id}>
                          <div className="w-full flex flex-col overflow-hidden group bg-slate-100 cursor-pointer rounded-t-2xl rounded-b-[6px] shadow-sm border border-slate-200/50 transition-all duration-300 hover:shadow-md hover:border-slate-300">
                            {/* Product Image */}
                            <div className="w-full aspect-square relative overflow-hidden bg-slate-100">
                              <img 
                                src={product.mainImage} 
                                alt={product.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                draggable={false}
                                loading="lazy"
                              />
                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                                <span className="bg-white/95 text-[#0a1d37] font-black px-4 py-2 rounded-full transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 shadow-lg text-xs backdrop-blur-sm">
                                  Ver detalles
                                </span>
                              </div>

                              {/* Store name overlay top */}
                              <div className="absolute top-2.5 left-2.5 z-10">
                                <span
                                  className="font-black leading-none text-base sm:text-lg"
                                  style={{
                                    color: '#ffffff',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                  }}
                                >
                                  {product.store.name}
                                </span>
                              </div>
                            </div>

                            {/* Product Details overlay bottom */}
                            <div 
                              className="w-full pt-0 pb-1.5 px-2 bg-white text-slate-900 flex flex-col gap-0 border-t border-slate-200/80"
                            >
                              <div className="flex gap-0.5" style={{ fontSize: '22px', lineHeight: '1' }}>
                                {[...Array(4)].map((_, i) => (
                                  <span key={i} style={{ color: '#FFD700', WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.4)' }}>★</span>
                                ))}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-bold text-slate-900 text-base sm:text-lg line-clamp-1 flex-1 mb-0 leading-none py-1">
                                  {product.name}
                                </h3>
                                <span className="text-slate-900 font-black text-base sm:text-lg shrink-0 leading-none py-1">
                                  ${displayPrice.toLocaleString('es-CO')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>

                  {categoryProducts.length > defaultLimit && (
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => setExpandedCategory(isCategoryExpanded ? null : categoryName)}
                        className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95 flex items-center gap-1.5"
                      >
                        {isCategoryExpanded ? 'Ver menos productos' : 'Ver más productos'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
