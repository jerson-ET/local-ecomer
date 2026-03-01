'use client'

import React, { useEffect, useState } from 'react'
import { X, Store, MessageCircle } from 'lucide-react'
import Link from 'next/link'
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
}

interface ProductBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  product: SheetProduct | null
}

export default function ProductBottomSheet({ isOpen, onClose, product }: ProductBottomSheetProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('M')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setActiveImage(0)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !product) return null

  // Combinar imagen principal con imágenes adicionales si existen
  const allImages = [product.image, ...(product.images || [])].filter(Boolean)

  const handleMaskClick = (e: React.MouseEvent) => {
    if ((e.target as Element).classList.contains('pbs-overlay')) {
      onClose()
    }
  }

  // Ejemplo de tallas hardcodeadas para efecto de la demo Premium
  const dummySizes = ['S', 'M', 'L', 'XL']

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
            {allImages.map((img, idx) => (
              <div key={idx} className="pbs-image-slide">
                <img src={img} alt={`${product.name} - Imagen ${idx + 1}`} />
              </div>
            ))}
            {allImages.length > 1 && (
              <div className="pbs-dots">
                {allImages.map((_, idx) => (
                  <div key={idx} className={`pbs-dot ${idx === activeImage ? 'active' : ''}`} />
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

            {/* Demo Variants */}
            <div className="pbs-variant-section">
              <div className="pbs-variant-title">
                <span>Seleccionar Talla</span>
                <span style={{ color: '#aeaeb2', fontWeight: 500, fontSize: 12 }}>
                  Guía de tallas
                </span>
              </div>
              <div className="pbs-variant-options">
                {dummySizes.map((size) => (
                  <button
                    key={size}
                    className={`pbs-size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA */}
        <div className="pbs-bottom-cta">
          {product.storeUrl && (
            <Link
              href={`${product.storeUrl}?product=${product.id}`}
              className="pbs-btn-store"
              aria-label="Ver en la tienda"
            >
              <Store size={24} />
            </Link>
          )}
          <button
            className="pbs-btn-whatsapp"
            onClick={() => {
              // Simula llevar al whatsapp
              alert(
                'Llevando al WhatsApp del vendedor:\n\n"Hola, quiero comprar ' + product.name + '"'
              )
            }}
          >
            <MessageCircle size={22} fill="white" />
            Lo quiero
          </button>
        </div>
      </div>
    </div>
  )
}
