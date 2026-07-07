'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, ShoppingBag, RefreshCw } from 'lucide-react'
import MarketplaceCarousel from './MarketplaceCarousel'

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
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
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

  const carouselRows = useMemo(() => {
    const rows: { categoryName: string; rowTitle: string; products: MarketplaceProduct[] }[] = []
    sortedCategoryNames.forEach((categoryName) => {
      const categoryProducts = groupedProducts[categoryName] || []
      if (categoryProducts.length === 0) return
      for (let i = 0; i < categoryProducts.length; i += 12) {
        const chunk = categoryProducts.slice(i, i + 12)
        const rowTitle = i === 0 
          ? categoryName 
          : `${categoryName} - Línea ${Math.floor(i / 12) + 1}`
        rows.push({ categoryName, rowTitle, products: chunk })
      }
    })
    return rows
  }, [sortedCategoryNames, groupedProducts])

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

      {/* ─── BANNER CARRUSEL (DESCUENTOS - AL INICIO DEL TODO) ─── */}
      {hasDiscounts && (
        <MarketplaceCarousel 
          products={initialProducts} 
          title="Descuentos"
          subtitle="Ofertas exclusivas por 24 horas"
          filterDiscounts={true}
          heightClass="h-[260px] sm:h-[340px]"
          desktopItems={3}
          mobileItems={1.5}
          showPagination={true}
          showArrows={true}
          autoPlay={false}
          hideTextOverlay={true}
          marginClass="mb-10"
          roundedClass="rounded-none"
          borderClass="border-0"
          shadowClass="shadow-none"
        />
      )}

      {/* ─── BARRA DE BUSQUEDA, CATEGORÍAS Y FILTROS (EN EL MEDIO) ─── */}
      <div id="catalog-section" className="space-y-6 mb-8">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Input de Búsqueda */}
          <div className="flex-1 min-w-[280px]">
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

          {/* Selector de ordenación */}
          <div className="flex items-center gap-2 lg:self-stretch">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider hidden sm:inline">
              Ordenar por:
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-white border-2 border-slate-200 rounded-md px-4 py-3.5 font-bold text-slate-700 text-sm outline-none cursor-pointer focus:border-slate-950 transition-colors"
            >
              <option value="newest">Más recientes</option>
              <option value="price-asc">Precio: de menor a mayor</option>
              <option value="price-desc">Precio: de mayor a menor</option>
            </select>
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
                      className="w-full min-h-[38px] px-0.5 py-1 rounded-md text-[10px] font-black text-center flex items-center justify-center border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all leading-tight cursor-pointer"
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
              className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-md transition-all"
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
              className="px-6 py-3 bg-slate-950 hover:bg-slate-900 text-white font-black rounded-md text-sm transition-all"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          /* Carruseles de Categorías integrados verticalmente sin espacios ni títulos de sección */
          <div className="space-y-0 overflow-hidden bg-white">
            {carouselRows.map((row, idx) => {
              const isLast = idx === carouselRows.length - 1
              const borderStyle = isLast ? 'border-0' : 'border-0 border-b border-slate-100'

              return (
                <MarketplaceCarousel
                  key={`${row.rowTitle}-${idx}`}
                  products={row.products}
                  heightClass="h-[260px] sm:h-[340px]"
                  desktopItems={3}
                  mobileItems={1.5}
                  filterDiscounts={false}
                  showPagination={true}
                  showArrows={true}
                  autoPlay={false}
                  hideTextOverlay={true}
                  marginClass="mb-0"
                  roundedClass="rounded-none"
                  borderClass={borderStyle}
                  shadowClass="shadow-none"
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
