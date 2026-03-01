/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                   RED DE DROPSHIPPING LOCALECOMER                            */
/*                                                                              */
/*   Marketplace B2B donde dueños de tiendas publican productos con             */
/*   comisiones, y revendedores generan sus links de afiliados para vender.     */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client'

import './community.css'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Store,
  X,
  ShoppingBag,
  TrendingUp,
  Shirt,
  Home,
  Smartphone,
  Dog,
  Sparkles,
  MoreHorizontal,
  Link as LinkIcon,
  CheckCircle2,
  Share2,
  Percent,
} from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'
import { fuzzySearch } from '@/lib/fuzzySearch'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                              TYPES                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

type CategoryId =
  | 'all'
  | 'moda'
  | 'hogar'
  | 'tecnologia'
  | 'mascotas'
  | 'alimentos'
  | 'belleza'
  | 'otros'

interface DropshippingProduct {
  id: string
  storeId: string
  storeName: string
  storeColor: string
  storeUrl: string
  category: CategoryId
  productName: string
  productImage: string
  price: number
  commissionRate: number // Porcentaje (ej: 15 para 15%)
  stock: number
  activeResellers: number
  totalSales: number
  timestamp: Date
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                           DEMO DATA                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

const DEMO_PRODUCTS: DropshippingProduct[] = [
  {
    id: 'p1',
    storeId: 's1',
    storeName: 'SneakerVault',
    storeColor: '#6c5ce7',
    storeUrl: '/store/calzado',
    category: 'moda',
    productName: 'Air Jordan 1 Retro High OG',
    productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
    price: 459000,
    commissionRate: 15,
    stock: 24,
    activeResellers: 12,
    totalSales: 45,
    timestamp: new Date('2026-02-25'),
  },
  {
    id: 'p2',
    storeId: 's2',
    storeName: 'Cap Kings',
    storeColor: '#00b894',
    storeUrl: '/store/gorras',
    category: 'moda',
    productName: 'Gorra Snapback NY Yankees Gold',
    productImage: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=600',
    price: 69000,
    commissionRate: 20,
    stock: 50,
    activeResellers: 8,
    totalSales: 102,
    timestamp: new Date('2026-02-24'),
  },
  {
    id: 'p3',
    storeId: 's3',
    storeName: 'Beauty Glow',
    storeColor: '#ff69b4',
    storeUrl: '/store/belleza',
    category: 'belleza',
    productName: 'Kit Completo Skincare Coreano',
    productImage: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600',
    price: 178000,
    commissionRate: 25,
    stock: 15,
    activeResellers: 34,
    totalSales: 210,
    timestamp: new Date('2026-02-20'),
  },
  {
    id: 'p4',
    storeId: 's4',
    storeName: 'TechZone',
    storeColor: '#0984e3',
    storeUrl: '/store/tecnologia',
    category: 'tecnologia',
    productName: 'Audífonos Inalámbricos Pro ANC',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    price: 189000,
    commissionRate: 10,
    stock: 40,
    activeResellers: 5,
    totalSales: 18,
    timestamp: new Date('2026-02-26'),
  },
  {
    id: 'p5',
    storeId: 's5',
    storeName: 'PetHappy',
    storeColor: '#fdcb6e',
    storeUrl: '/store/mascotas',
    category: 'mascotas',
    productName: 'Cama Ortopédica Perros Grandes',
    productImage: 'https://images.unsplash.com/photo-1541781777631-faaf29752167?w=600',
    price: 120000,
    commissionRate: 15,
    stock: 10,
    activeResellers: 18,
    totalSales: 56,
    timestamp: new Date('2026-02-22'),
  },
]

const CATEGORIES: { id: CategoryId; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Todos', icon: <ShoppingBag size={15} /> },
  { id: 'moda', label: 'Moda', icon: <Shirt size={15} /> },
  { id: 'hogar', label: 'Hogar', icon: <Home size={15} /> },
  { id: 'tecnologia', label: 'Tecnología', icon: <Smartphone size={15} /> },
  { id: 'mascotas', label: 'Mascotas', icon: <Dog size={15} /> },
  { id: 'belleza', label: 'Belleza', icon: <Sparkles size={15} /> },
  { id: 'otros', label: 'Otros', icon: <MoreHorizontal size={15} /> },
]

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         COMPONENTE PRINCIPAL                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function DropshippingNetworkPage() {
  /* ── State ── */
  const [products] = useState<DropshippingProduct[]>(DEMO_PRODUCTS)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all')
  const [sortBy, setSortBy] = useState<'commission' | 'trending'>('commission')

  // Link generation variables
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  /* ── Handlers ── */
  const handleGenerateLink = (product: DropshippingProduct) => {
    setGeneratingFor(product.id)

    // Simulate API call to generate affiliate link
    setTimeout(() => {
      // Usamos un ID de revendedor ficticio 'req_1234' para la demo
      const affiliateLink = `https://localecomer.vercel.app${product.storeUrl}?product=${product.id}&ref=req_1234`

      navigator.clipboard.writeText(affiliateLink).then(() => {
        setGeneratingFor(null)
        setCopiedLink(product.id)
        setTimeout(() => setCopiedLink(null), 3000)
      })
    }, 600)
  }

  /* ── Filtering Logic ── */
  const filteredProducts = useMemo(() => {
    let result = products

    if (searchQuery.length > 1) {
      result = fuzzySearch(result, searchQuery, ['productName', 'storeName'])
    } else if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory)
    }

    if (searchQuery.length <= 1) {
      result = [...result].sort((a, b) => {
        if (sortBy === 'trending') return b.totalSales - a.totalSales
        return b.commissionRate - a.commissionRate
      })
    }

    return result
  }, [products, searchQuery, activeCategory, sortBy])

  return (
    <div className="cm-app dropshipping-network">
      {/* HEADER */}
      <div className="cm-header">
        <div className="cm-header-info">
          <div className="cm-header-name">
            Red de Afiliados
            {activeCategory !== 'all' && (
              <span className="cm-header-cat-badge">
                • {CATEGORIES.find((c) => c.id === activeCategory)?.label}
              </span>
            )}
          </div>
        </div>

        <div className="cm-header-actions">
          <button
            className={`cm-header-btn ${showSearch ? 'active' : ''}`}
            onClick={() => {
              setShowSearch(!showSearch)
              if (!showSearch)
                setTimeout(() => document.getElementById('cm-search-input')?.focus(), 100)
            }}
          >
            <Search size={22} />
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      {showSearch && (
        <div className="cm-search-bar">
          <Search size={18} className="cm-search-icon" />
          <input
            id="cm-search-input"
            type="text"
            className="cm-search-input"
            placeholder="Buscar productos o tiendas para revender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          {searchQuery && (
            <button className="cm-search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* CATEGORIES */}
      <div className="cm-categories-scroll">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`cm-cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(cat.id)
              setSearchQuery('')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* STATUS & SORT */}
      <div className="cm-feed-status-bar">
        <span>
          {searchQuery ? (
            <>Resultados para "{searchQuery}"</>
          ) : (
            <>Productos Disponibles para Dropshipping</>
          )}
        </span>

        {!searchQuery && (
          <div className="cm-sort-toggles">
            <button
              className={`cm-sort-btn ${sortBy === 'commission' ? 'active' : ''}`}
              onClick={() => setSortBy('commission')}
            >
              <Percent size={14} /> Mayor Comisión
            </button>
            <button
              className={`cm-sort-btn ${sortBy === 'trending' ? 'active' : ''}`}
              onClick={() => setSortBy('trending')}
            >
              <TrendingUp size={14} /> Más Vendidos
            </button>
          </div>
        )}
      </div>

      {/* FEED */}
      <div className="cm-feed">
        {activeCategory === 'all' && !searchQuery && (
          <div className="network-promo-banner">
            <div className="network-promo-content">
              <h2>Monetiza tu influencia</h2>
              <p>Genera enlaces de afiliado y gana hasta 30% de comisión por cada venta.</p>
            </div>
            <Link href="/dashboard" className="network-promo-btn">
              Ir a mi Panel
            </Link>
          </div>
        )}

        {filteredProducts.map((product) => {
          const commissionAmount = Math.round(product.price * (product.commissionRate / 100))

          return (
            <article key={product.id} className="cm-post dropshipping-card">
              {/* Product Store */}
              <div className="cm-post-header">
                <div className="cm-post-avatar" style={{ background: product.storeColor }}>
                  <Store size={16} />
                </div>
                <div className="cm-post-store-info">
                  <div className="cm-post-store-name">{product.storeName}</div>
                  <div className="cm-post-time" style={{ color: '#2ecc71', fontWeight: 600 }}>
                    <Store size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Socio Verificado
                  </div>
                </div>

                <div className="ds-commission-badge">
                  <span>{product.commissionRate}%</span> Comisión
                </div>
              </div>

              {/* Product Layout */}
              <div className="ds-product-layout">
                <Link
                  href={`${product.storeUrl}?product=${product.id}`}
                  className="ds-product-image"
                >
                  <img src={product.productImage} alt={product.productName} />
                </Link>

                <div className="ds-product-info">
                  <h3 className="ds-product-name">{product.productName}</h3>
                  <div className="ds-product-stats">
                    <span>
                      <Share2 size={12} /> {product.activeResellers} revendiendo
                    </span>
                    <span>
                      <TrendingUp size={12} /> {product.totalSales} ventas
                    </span>
                  </div>

                  <div className="ds-earnings-box">
                    <div className="ds-earnings-label">Precio Público</div>
                    <div className="ds-earnings-value price">{formatCOP(product.price)}</div>
                    <div className="ds-earnings-divider" />
                    <div className="ds-earnings-label highlight">Ganas por venta</div>
                    <div className="ds-earnings-value commission">
                      {formatCOP(commissionAmount)}
                    </div>
                  </div>

                  <button
                    className={`ds-generate-btn ${copiedLink === product.id ? 'success' : ''}`}
                    onClick={() => handleGenerateLink(product)}
                    disabled={generatingFor === product.id}
                  >
                    {generatingFor === product.id ? (
                      <span className="ds-loader" />
                    ) : copiedLink === product.id ? (
                      <>
                        <CheckCircle2 size={18} /> ¡Enlace Copiado!
                      </>
                    ) : (
                      <>
                        <LinkIcon size={18} /> Generar Link de Afiliado
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          )
        })}

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className="cm-empty">
            <Search size={48} />
            <h3>Sin resultados</h3>
            <p>No encontramos productos de dropshipping para "{searchQuery || activeCategory}"</p>
            {searchQuery && (
              <button className="cm-empty-btn" onClick={() => setSearchQuery('')}>
                Ver todo
              </button>
            )}
          </div>
        )}

        <div className="cm-bottom-spacer" />
      </div>
    </div>
  )
}
