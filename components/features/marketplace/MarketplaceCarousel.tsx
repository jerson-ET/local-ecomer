'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Tag, Store } from 'lucide-react'
import Link from 'next/link'
import { MarketplaceProduct } from './MarketplaceContainer'

interface MarketplaceCarouselProps {
  products?: MarketplaceProduct[]
  title?: string
  subtitle?: string
  heightClass?: string
  desktopItems?: number
  mobileItems?: number
  filterDiscounts?: boolean
  showPagination?: boolean
  showArrows?: boolean
  autoPlay?: boolean
  hideTextOverlay?: boolean
  marginClass?: string
  roundedClass?: string
  borderClass?: string
}

export default function MarketplaceCarousel({ 
  products = [],
  title,
  subtitle,
  heightClass = 'h-[300px] sm:h-[400px]',
  desktopItems = 3,
  mobileItems = 1.5,
  filterDiscounts = false,
  showPagination = true,
  showArrows = true,
  autoPlay = true,
  hideTextOverlay = false,
  marginClass,
  roundedClass = 'rounded-3xl',
  borderClass = 'border-2 border-slate-900'
}: MarketplaceCarouselProps) {
  
  // Filter and limit products to maximum of 12 items.
  const activeProducts = useMemo(() => {
    if (!filterDiscounts) {
      // Just limit to 12
      return products.slice(0, 12)
    }
    const validDiscountProducts = products.filter(p => {
      const discount = Number(p.discountPrice)
      const price = Number(p.price)
      
      if (!discount || discount >= price) return false
      
      const referenceDate = p.updatedAt || p.createdAt
      if (!referenceDate) return false
      
      return true
    })
    
    // Sort by newest first, then limit to 12
    return validDiscountProducts
      .sort((a, b) => new Date(b.updatedAt || b.createdAt!).getTime() - new Date(a.updatedAt || a.createdAt!).getTime())
      .slice(0, 12)
  }, [products, filterDiscounts])

  const [visibleItems, setVisibleItems] = useState(desktopItems)
  const [itemWidth, setItemWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Resize observer to get item width and visible item count dynamically
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Use container's actual width in pixels
        const width = entry.contentRect.width || entry.target.getBoundingClientRect().width
        const windowWidth = window.innerWidth
        let currentVisible = 1.2
        if (windowWidth >= 1400) {
          currentVisible = 5
        } else if (windowWidth >= 1100) {
          currentVisible = 4
        } else if (windowWidth >= 800) {
          currentVisible = 3
        } else if (windowWidth >= 500) {
          currentVisible = 2
        }
        setVisibleItems(currentVisible)
        if (width > 0) {
          setItemWidth(width / currentVisible)
        }
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [desktopItems, mobileItems, activeProducts.length])

  // Determine if we have enough items to scroll and loop infinitely without duplicates
  const shouldScroll = useMemo(() => {
    return activeProducts.length > visibleItems
  }, [activeProducts.length, visibleItems])

  const shouldLoop = useMemo(() => {
    // Only loop infinitely if we have more items than the visible slots + 1.
    // This guarantees no clone repetitions are visible during transitions.
    return activeProducts.length > visibleItems + 1
  }, [activeProducts.length, visibleItems])

  // Prepare carousel items based on looping availability
  const CAROUSEL_ITEMS = useMemo(() => {
    if (activeProducts.length === 0) return []
    return shouldLoop 
      ? [...activeProducts, ...activeProducts, ...activeProducts]
      : activeProducts
  }, [activeProducts, shouldLoop])

  const startIndex = useMemo(() => {
    return shouldLoop ? activeProducts.length : 0
  }, [shouldLoop, activeProducts.length])

  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Reset currentIndex when startIndex or activeProducts changes
  useEffect(() => {
    setCurrentIndex(startIndex)
  }, [startIndex, activeProducts.length])

  // Autoplay interval
  useEffect(() => {
    if (!autoPlay || isHovered || isDragging || activeProducts.length === 0) return

    if (!shouldScroll) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (shouldLoop) return prev + 1

        const maxIndex = activeProducts.length - Math.floor(visibleItems)
        if (prev >= maxIndex) {
          return 0
        }
        return prev + 1
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [autoPlay, shouldLoop, shouldScroll, isHovered, isDragging, activeProducts.length, visibleItems])

  // Infinite wrap-around check
  useEffect(() => {
    if (!shouldLoop || activeProducts.length === 0) return

    if (currentIndex >= activeProducts.length * 2) {
      setTimeout(() => setCurrentIndex(currentIndex - activeProducts.length), 300)
    }
    if (currentIndex <= 0) {
      setTimeout(() => setCurrentIndex(currentIndex + activeProducts.length), 300)
    }
  }, [currentIndex, shouldLoop, activeProducts.length])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (shouldLoop) return prev + 1
      // For non-looping, clamp to the last possible scroll state
      return Math.min(prev + 1, activeProducts.length - Math.floor(visibleItems))
    })
  }, [shouldLoop, activeProducts.length, visibleItems])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => {
      if (shouldLoop) return prev - 1
      // For non-looping, clamp to index 0
      return Math.max(prev - 1, 0)
    })
  }, [shouldLoop])

  const handleDragEnd = (e: any, { offset }: PanInfo) => {
    setIsDragging(false)
    if (!shouldScroll) return
    const swipeThreshold = 50
    if (offset.x < -swipeThreshold) {
      handleNext()
    } else if (offset.x > swipeThreshold) {
      handlePrev()
    }
  }

  // Calculate total dots for pagination
  const totalDots = useMemo(() => {
    if (shouldLoop) return activeProducts.length
    return Math.max(1, activeProducts.length - Math.floor(visibleItems) + 1)
  }, [shouldLoop, activeProducts.length, visibleItems])

  // Now we can conditionally return AFTER all hooks
  if (activeProducts.length === 0) {
    if (filterDiscounts) {
      return (
        <div className="mb-12 relative w-full overflow-hidden rounded-3xl bg-white border-2 border-slate-200 shadow-xl p-12 flex flex-col items-center justify-center min-h-[300px]">
          {/* Glass highlight */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0) 41%, rgba(255,255,255,0) 100%)' }} />
          
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 drop-shadow-md mb-2 relative z-20">
            Descuentos
          </h2>
          <p className="text-slate-500 font-medium text-center max-w-md relative z-20">
            Actualmente no hay ofertas activas. Los descuentos publicados aparecerán aquí y rotarán cada 24 horas.
          </p>
        </div>
      )
    }
    return null
  }

  const containerMargin = marginClass !== undefined 
    ? marginClass 
    : (title || subtitle ? 'mb-12' : 'mb-6')

  return (
    <div 
      className={`relative w-full overflow-hidden ${roundedClass} bg-white ${borderClass} shadow-xl ${containerMargin}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => {
        setIsHovered(false)
        setIsDragging(false)
      }}
      ref={containerRef}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Glossy Crystal Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'linear-gradient(105deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0) 41%, rgba(255,255,255,0) 100%)' }} />

      {/* Title overlay */}
      {(title || subtitle) && (
        <div className="absolute top-6 left-6 z-20 pointer-events-none">
          {title && (
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 drop-shadow-sm">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-slate-500 font-medium mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <motion.div
        className={`flex items-center ${heightClass}`}
        animate={{
          x: -(currentIndex * itemWidth)
        }}
        transition={{
          type: 'spring',
          stiffness: 250,
          damping: 30,
          mass: 1
        }}
        drag={shouldScroll ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={shouldScroll ? 0.2 : 0}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ width: `${CAROUSEL_ITEMS.length * itemWidth}px` }}
      >
        {CAROUSEL_ITEMS.map((product, index) => {
          const hasDiscount = product.discountPrice && product.discountPrice < product.price
          const displayPrice = hasDiscount ? product.discountPrice! : product.price
          const storeColor = product.store.theme_color || '#ff5a26'

          return (
            <div 
              key={`${product.id}-${index}`} 
              className="h-full flex-shrink-0 p-[1px]"
              style={{ width: `${itemWidth}px` }}
            >
              <Link href={`/tienda/${product.store.slug}?productId=${product.id}`}>
                <div className="w-full h-full relative overflow-hidden group bg-slate-800 cursor-pointer rounded-2xl sm:rounded-3xl border border-white/10 shadow-lg">
                  <img 
                    src={product.mainImage} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    draggable={false}
                  />
                  
                  {/* Overlay on hover con botón Ver Detalles */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-[15]">
                    <span className="bg-white/95 text-slate-900 font-black px-6 py-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl text-sm backdrop-blur-sm">
                      Ver detalles
                    </span>
                  </div>

                  
                  {/* Badges overlay top left */}
                  <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                    <span 
                      className="px-2.5 py-1.5 rounded-xl text-[9px] font-black text-white shadow-md flex items-center gap-1 border border-white/20"
                      style={{ backgroundColor: storeColor }}
                    >
                      <Store size={10} />
                      <span className="truncate max-w-[80px]">{product.store.name}</span>
                    </span>
                    {hasDiscount && (
                      <span className="bg-orange-600 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-md flex items-center gap-1">
                        <Tag size={8} />
                        -{product.discountPercent}%
                      </span>
                    )}
                  </div>
                  
                  {/* Product Details overlay bottom */}
                  {!hideTextOverlay && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
                      style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}
                    >
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <Tag size={8} />
                        {product.category}
                      </span>
                      <h3 className="font-bold text-white text-base sm:text-lg line-clamp-1 mb-1">
                        {product.name}
                      </h3>
                      <div className="flex items-end gap-2">
                        <span className="text-orange-400 font-black text-xl">
                          ${displayPrice.toLocaleString('es-CO')}
                        </span>
                        {hasDiscount && (
                          <span className="text-slate-300 text-sm font-bold line-through mb-0.5">
                            ${product.price.toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          )
        })}
      </motion.div>

      {/* Navigation Arrows */}
      {showArrows && shouldScroll && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/40 transition-all shadow-lg active:scale-95 cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/40 transition-all shadow-lg active:scale-95 cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Pagination indicators */}
      {showPagination && shouldScroll && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {Array.from({ length: totalDots }).map((_, idx) => {
            const activeIdx = shouldLoop ? currentIndex % activeProducts.length : currentIndex
            const isActive = idx === activeIdx
            return (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${isActive ? 'w-6 bg-slate-800' : 'w-1.5 bg-slate-400/50'}`} 
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
