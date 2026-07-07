'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, ShoppingBag, ChevronRight, ChevronLeft } from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'
import Link from 'next/link'

interface RecommendedProduct {
  id: string
  name: string
  description: string | null
  price: number
  discount_price: number | null
  images: any[] | null
  stores: {
    name: string
    slug: string
  }
}

export default function RecommendedProducts() {
  const [products, setProducts] = useState<RecommendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/buyer/dashboard')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.recommendations || [])
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

  const getMainImage = (images: any) => {
    const imgs = (images || []) as any[]
    if (imgs.length > 0) {
      const main = imgs.find((img: any) => img.isMain) || imgs[0]
      if (main) return main.thumbnail || main.full || '/placeholder.png'
    }
    return '/placeholder.png'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[200px] h-64 bg-gray-100 rounded-2xl flex-shrink-0"></div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles size={28} />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">Sigue tiendas para recibir recomendaciones personalizadas</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Tus productos recomendados basados en tus gustos aparecerán aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <Sparkles className="text-amber-500" /> Para Ti
        </h3>
        
        <div className="flex gap-2">
          <button 
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map(product => {
          const isDiscounted = product.discount_price && product.discount_price < product.price
          const displayPrice = product.discount_price || product.price
          
          return (
            <Link 
              key={product.id}
              href={`/tienda/${product.stores?.slug}?productId=${product.id}`}
              className="min-w-[220px] max-w-[220px] bg-gray-50 rounded-2xl overflow-hidden group/card flex-shrink-0 snap-start border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="aspect-[4/5] relative overflow-hidden bg-gray-200">
                <img 
                  src={getMainImage(product.images)} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                />
                {isDiscounted && (
                  <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                    Oferta
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag size={14} /> Ver
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">
                  {product.stores?.name}
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-2 truncate leading-tight">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-900">{formatCOP(displayPrice)}</span>
                  {isDiscounted && (
                    <span className="text-xs text-gray-400 line-through font-bold">
                      {formatCOP(product.price)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
