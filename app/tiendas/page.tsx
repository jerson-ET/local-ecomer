'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Star,
  ShoppingBag,
  Store,
  MapPin,
  Filter,
  Grid3X3,
  Shirt,
  Smartphone,
  Gamepad2,
  Sofa,
  Dumbbell,
  Gem,
  Crown,
  Bike,
  Coffee,
  Footprints,
  Sparkles,
  Package,
} from 'lucide-react'
import { marketplaceProducts, formatCOP, type MarketplaceProduct } from '@/lib/store/marketplace'

/* ─────── Datos de tiendas con info extendida ─────── */

interface StoreInfo {
  name: string
  slug: string
  url: string
  color: string
  description: string
  productCount: number
  rating: number
  category: string
  image: string
  products: MarketplaceProduct[]
}

const categoryIcons: Record<string, React.ReactNode> = {
  Todos: <Grid3X3 size={15} />,
  Moda: <Shirt size={15} />,
  Tecnología: <Smartphone size={15} />,
  Calzado: <Footprints size={15} />,
  Gaming: <Gamepad2 size={15} />,
  Hogar: <Sofa size={15} />,
  Deportes: <Dumbbell size={15} />,
  Belleza: <Sparkles size={15} />,
  Accesorios: <Crown size={15} />,
  Alimentos: <Coffee size={15} />,
  Motos: <Bike size={15} />,
  Joyería: <Gem size={15} />,
}

/* Generar la lista de tiendas desde los datos del marketplace */
function buildStoreList(): StoreInfo[] {
  const storeMap = new Map<string, StoreInfo>()

  for (const p of marketplaceProducts) {
    const existing = storeMap.get(p.storeTemplate)
    if (existing) {
      existing.productCount++
      existing.products.push(p)
      existing.rating = Math.max(existing.rating, p.rating)
    } else {
      storeMap.set(p.storeTemplate, {
        name: p.storeName,
        slug: p.storeTemplate,
        url: p.storeUrl,
        color: p.storeColor,
        description: getStoreDescription(p.storeTemplate),
        productCount: 1,
        rating: p.rating,
        category: p.category,
        image: p.image,
        products: [p],
      })
    }
  }
  return Array.from(storeMap.values())
}

function getStoreDescription(template: string): string {
  const descriptions: Record<string, string> = {
    moda: 'Ropa moderna y tendencias de moda para todos los estilos',
    calzado: 'Sneakers originales y calzado de las mejores marcas',
    celulares: 'Tecnología de punta: celulares, audífonos y más',
    gaming: 'Todo para gamers: consolas, periféricos y accesorios',
    hogar: 'Decoración y artículos para tu hogar',
    deportes: 'Equipamiento deportivo profesional',
    fitness: 'Artículos de fitness y entrenamiento',
    gorras: 'Gorras exclusivas: snapbacks, truckers y más',
    cafe: 'Café colombiano especial de origen',
    joyeria: 'Joyería fina en plata y piedras preciosas',
    motos: 'Accesorios y cascos para motociclistas',
    organico: 'Productos orgánicos y naturales frescos',
    luxury: 'Artículos de lujo y relojes premium',
    wayuu: 'Artesanías Wayuu hechas a mano',
    belleza: 'Skincare, maquillaje y belleza premium',
    mascotas: 'Todo para el cuidado de tus mascotas',
    minimal: 'Productos con diseño minimalista',
  }
  return descriptions[template] || 'Tienda en LocalEcomer'
}

/* ─────── Componente Principal ─────── */

export default function TiendasPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')

  const allStores = useMemo(() => buildStoreList(), [])

  const filteredStores = useMemo(() => {
    let stores = allStores

    if (selectedCategory !== 'Todos') {
      stores = stores.filter((s) => s.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      stores = stores.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      )
    }

    return stores
  }, [allStores, selectedCategory, searchQuery])

  const categories = ['Todos', ...new Set(allStores.map((s) => s.category))]

  return (
    <div className="tiendas-page">
      {/* ── Header ── */}
      <div className="tiendas-header">
        <div className="tiendas-header__title">
          <Store size={22} />
          <div>
            <h1>Tiendas</h1>
            <p>{allStores.length} tiendas disponibles</p>
          </div>
        </div>
      </div>

      {/* ── Búsqueda ── */}
      <div className="tiendas-search-wrap">
        <div className="tiendas-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar tiendas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Filtros por categoría ── */}
      <div className="tiendas-cats">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`tiendas-cat-btn ${selectedCategory === cat ? 'tiendas-cat-btn--active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {categoryIcons[cat] || <Filter size={15} />}
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* ── Lista de Tiendas ── */}
      <div className="tiendas-list">
        {filteredStores.length === 0 ? (
          <div className="tiendas-empty">
            <Search size={32} />
            <h3>No se encontraron tiendas</h3>
            <p>Intenta con otra categoría o término</p>
          </div>
        ) : (
          filteredStores.map((store) => (
            <Link key={store.slug} href={store.url} className="tienda-card">
              {/* Banner de tienda */}
              <div
                className="tienda-card__banner"
                style={{ background: `linear-gradient(135deg, ${store.color}, ${store.color}cc)` }}
              >
                <div className="tienda-card__avatar">
                  <Store size={22} />
                </div>
                <div className="tienda-card__badge">
                  <Star size={10} fill="currentColor" />
                  <span>{store.rating}</span>
                </div>
              </div>

              {/* Info */}
              <div className="tienda-card__info">
                <h3 className="tienda-card__name">{store.name}</h3>
                <p className="tienda-card__desc">{store.description}</p>
                <div className="tienda-card__meta">
                  <span className="tienda-card__cat">
                    {categoryIcons[store.category]}
                    {store.category}
                  </span>
                  <span className="tienda-card__count">
                    <Package size={12} />
                    {store.productCount} productos
                  </span>
                </div>
              </div>

              {/* Preview de productos */}
              <div className="tienda-card__preview">
                {store.products.slice(0, 3).map((product) => (
                  <div key={product.id} className="tienda-card__preview-item">
                    <img src={product.image} alt={product.name} />
                    <span>{formatCOP(product.price)}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="tienda-card__cta">
                <ShoppingBag size={14} />
                <span>Ver Tienda</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* ── Aviso para vendedores ── */}
      <div className="tiendas-seller-cta">
        <MapPin size={20} />
        <div>
          <strong>¿Tienes un negocio local?</strong>
          <p>Inicia sesión para crear tu tienda y vender tus productos</p>
        </div>
      </div>
    </div>
  )
}
