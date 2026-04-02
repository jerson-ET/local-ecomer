'use client'

import React, { useEffect, useState } from 'react'
import { X, Store } from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'
import './product-bottom-sheet.css'

export interface SheetProduct {
  id: string
  name: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  images?: string[]
  storeName: string
  storeUrl?: string | undefined
  storeColor?: string | undefined
  category?: string
  description?: string
  addons?: { id: string; nombre: string; precio: number }[]
  variants?: { color: string; colorHex: string; size: string; images: string[] }[]
}

interface ProductBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  product: SheetProduct | null
  onAddToCart?: (
    product: SheetProduct,
    selectedAddons: { id: string; nombre: string; precio: number }[],
    selectedColors: string[]
  ) => void
}

export default function ProductBottomSheet({
  isOpen,
  onClose,
  product,
  onAddToCart,
}: ProductBottomSheetProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [selectedAddons, setSelectedAddons] = useState<
    { id: string; nombre: string; precio: number }[]
  >([])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setActiveImage(0)
      setSelectedAddons([])
      setQuantity(1)
      const firstColor = product?.variants?.[0]?.color
      if (firstColor) {
        setSelectedColors([firstColor])
      } else {
        setSelectedColors([])
      }
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, product])

  if (!isOpen || !product) return null

  // Combinar imagen principal con imágenes adicionales si existen
  const allImages = [product.image, ...(product.images || [])].filter(Boolean)

  const handleMaskClick = (e: React.MouseEvent) => {
    if ((e.target as Element).classList.contains('pbs-overlay')) {
      onClose()
    }
  }


  return (
    <div className="pbs-overlay" onClick={handleMaskClick}>
      <div className="pbs-container">
        {/* Handle visual */}
        <div className="pbs-drag-handle" />

        {/* Header */}
        <div className="pbs-header">
          <div className="pbs-store-info">
            <div
              className="pbs-store-avatar"
              style={{ backgroundColor: product.storeColor || '#1c1c1e' }}
            >
              <Store size={16} />
            </div>
            <span className="pbs-store-name">{product.storeName}</span>
          </div>
          <button className="pbs-close-btn" onClick={onClose} aria-label="Cerrar detalles">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="pbs-content">
          {/* Image Carousel */}
          <div className="pbs-image-container">
            <div className="pbs-main-image-wrapper">
               <img src={allImages[activeImage]} alt={product.name} />
            </div>
            
            {allImages.length > 1 && (
              <div className="pbs-thumbnail-row">
                 {allImages.map((img, idx) => (
                   <button 
                     key={idx} 
                     className={`pbs-thumb-item ${idx === activeImage ? 'active' : ''}`}
                     onClick={() => setActiveImage(idx)}
                   >
                      <img src={img} alt={`Thumb ${idx}`} />
                   </button>
                 ))}
              </div>
            )}
          </div>

          <div className="pbs-details">
            {/* Pricing */}
            <div className="pbs-price-row">
              <span className="pbs-price">{formatCOP(product.price)}</span>
              {product.discount ? (
                <>
                  <span className="pbs-original">
                    {formatCOP(product.originalPrice || product.price)}
                  </span>
                  <span className="pbs-discount-badge">-{product.discount}%</span>
                </>
              ) : null}
            </div>

            {/* Title */}
            <h2 className="pbs-title">{product.name}</h2>

            {/* Description */}
            {product.description && (
              <p
                className="pbs-description"
                style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.5 }}
              >
                {product.description}
              </p>
            )}

            {/* Color Multi-Selection Checklist */}
            {product.variants && product.variants.length > 0 && (
              <div className="pbs-variant-section" style={{ marginTop: 24 }}>
                <div className="pbs-variant-title">
                  <span>Marca los colores que te encantan</span>
                </div>
                <div className="pbs-checklist-container">
                   {product.variants.map((v, i) => {
                     const isSelected = selectedColors.includes(v.color)
                     return (
                       <div 
                         key={i} 
                         className={`pbs-checklist-item ${isSelected ? 'active' : ''}`}
                         onClick={() => {
                           if (isSelected) {
                             setSelectedColors(prev => prev.filter(c => c !== v.color))
                           } else {
                             setSelectedColors(prev => [...prev, v.color])
                             if (v.images && v.images.length > 0) {
                               const imgUrl = v.images[0];
                               if (imgUrl) {
                                 const allImgs: string[] = [product.image, ...(product.images || [])].filter((img): img is string => !!img);
                                 const imgIndex = allImgs.indexOf(imgUrl);
                                 if (imgIndex !== -1) setActiveImage(imgIndex)
                               }
                             }
                           }
                         }}
                       >
                          <div className="pbs-item-main">
                             <div className="pbs-checkbox" style={{ background: isSelected ? v.colorHex : 'transparent', borderColor: isSelected ? v.colorHex : '#d1d1d6' }}>
                                {isSelected && <span>✓</span>}
                             </div>
                             <div className="pbs-color-info">
                                <span className="pbs-color-name">{v.color}</span>
                                <span className="pbs-color-meta">Disponible</span>
                             </div>
                          </div>
                          <div className="pbs-mini-thumb"><img src={v.images?.[0] || product.image} alt={v.color} /></div>
                       </div>
                     )
                   })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="pbs-quantity-section" style={{ marginTop: 24, paddingBottom: 20 }}>
               <div className="pbs-variant-title"><span>Cantidad</span></div>
               <div className="pbs-qty-controls">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <span className="pbs-qty-value">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)}>+</button>
               </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA */}
        <div className="pbs-bottom-cta">
          <button
            className="pbs-btn-whatsapp"
            style={{
              background: '#1c1c1e',
              color: 'white',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              border: 'none',
              flex: 1,
              borderRadius: 18,
              height: 60,
              fontSize: 17,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => {
              if (onAddToCart) {
                onAddToCart(product, selectedAddons, selectedColors)
                onClose()
                if (window && (window as any).triggerAI) {
                  (window as any).triggerAI(product.name)
                }
              }
            }}
          >
            ¡LO QUIERO!
          </button>
        </div>
      </div>
    </div>
  )
}
