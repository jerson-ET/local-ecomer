'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { X, Store, ArrowRightLeft, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/store/marketplace'
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
  currency?: string
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

  /* ─── Conversor de moneda del comprador ─── */
  const [buyerCurrency, setBuyerCurrency] = useState('')
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const [showConverter, setShowConverter] = useState(false)

  const currencyOptions = [
    { code: 'COP', label: '🇨🇴 COP - Peso Colombiano' },
    { code: 'USD', label: '🇺🇸 USD - Dólar' },
    { code: 'EUR', label: '🇪🇺 EUR - Euro' },
    { code: 'ARS', label: '🇦🇷 ARS - Peso Argentino' },
    { code: 'MXN', label: '🇲🇽 MXN - Peso Mexicano' },
    { code: 'BRL', label: '🇧🇷 BRL - Real' },
    { code: 'CLP', label: '🇨🇱 CLP - Peso Chileno' },
    { code: 'PEN', label: '🇵🇪 PEN - Sol Peruano' },
    { code: 'BOB', label: '🇧🇴 BOB - Boliviano' },
    { code: 'UYU', label: '🇺🇾 UYU - Peso Uruguayo' },
    { code: 'PYG', label: '🇵🇾 PYG - Guaraní' },
    { code: 'VES', label: '🇻🇪 VES - Bolívar' },
    { code: 'CNY', label: '🇨🇳 CNY - Yuan' },
    { code: 'GBP', label: '🇬🇧 GBP - Libra' },
    { code: 'JPY', label: '🇯🇵 JPY - Yen' },
  ]

  const fetchRates = useCallback(async () => {
    if (exchangeRates) return // Ya cargadas
    setRatesLoading(true)
    try {
      const res = await fetch('/api/exchange-rates')
      const data = await res.json()
      if (data.success && data.rates) {
        setExchangeRates(data.rates)
      }
    } catch (err) {
      console.error('Error fetching rates:', err)
    } finally {
      setRatesLoading(false)
    }
  }, [exchangeRates])

  const convertPrice = (price: number, fromCurrency: string, toCurrency: string): number | null => {
    if (!exchangeRates || !fromCurrency || !toCurrency || fromCurrency === toCurrency) return null
    const fromRate = exchangeRates[fromCurrency]
    const toRate = exchangeRates[toCurrency]
    if (!fromRate || !toRate) return null
    // Convert: price in fromCurrency -> USD -> toCurrency
    return (price / fromRate) * toRate
  }

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

  // Combinar imagen principal con imágenes adicionales y deduplicar para evitar clones
  const allImages = Array.from(new Set([product.image, ...(product.images || [])].filter(Boolean)))

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
              <span className="pbs-price">{formatPrice(product.price, product.currency)}</span>
              {product.discount ? (
                <>
                  <span className="pbs-original">
                    {formatPrice(product.originalPrice || product.price, product.currency)}
                  </span>
                  <span className="pbs-discount-badge">-{product.discount}%</span>
                </>
              ) : null}
            </div>

            {/* ─── Conversor de moneda del comprador ─── */}
            <div style={{ marginTop: 12, marginBottom: 4 }}>
              <button
                onClick={() => { setShowConverter(!showConverter); if (!exchangeRates) fetchRates() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                  border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 14px',
                  fontSize: 12, fontWeight: 600, color: '#6366f1', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <ArrowRightLeft size={14} />
                {showConverter ? 'Ocultar conversor' : 'Ver en mi moneda'}
              </button>

              {showConverter && (
                <div style={{
                  marginTop: 10, padding: 14, background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
                  borderRadius: 14, border: '1px solid #e0e7ff',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Convertir a mi moneda
                  </div>
                  <select
                    value={buyerCurrency}
                    onChange={(e) => { setBuyerCurrency(e.target.value); if (!exchangeRates) fetchRates() }}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      border: '1px solid #c7d2fe', fontSize: 14, fontWeight: 600,
                      background: 'white', color: '#1e293b', cursor: 'pointer',
                    }}
                  >
                    <option value="">Selecciona tu moneda...</option>
                    {currencyOptions
                      .filter(c => c.code !== (product.currency || 'COP'))
                      .map(c => <option key={c.code} value={c.code}>{c.label}</option>)
                    }
                  </select>

                  {ratesLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: '#6366f1', fontSize: 12 }}>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Cargando tasas...
                    </div>
                  )}

                  {buyerCurrency && exchangeRates && (() => {
                    const storeCurr = product.currency || 'COP'
                    const converted = convertPrice(product.price, storeCurr, buyerCurrency)
                    const convertedOriginal = product.originalPrice
                      ? convertPrice(product.originalPrice, storeCurr, buyerCurrency)
                      : null
                    if (converted === null) return null

                    // Calcular la tasa directa entre las dos monedas
                    const fromRate = exchangeRates[storeCurr] || 1
                    const toRate = exchangeRates[buyerCurrency] || 1
                    const directRate = toRate / fromRate

                    return (
                      <div style={{ marginTop: 12, padding: '12px 14px', background: 'white', borderRadius: 12, border: '1px solid #e0e7ff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                            {formatPrice(product.price, storeCurr)}
                          </span>
                          <ArrowRightLeft size={12} color="#94a3b8" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                          <span style={{ fontSize: 22, fontWeight: 900, color: '#6366f1' }}>
                            {formatPrice(converted, buyerCurrency)}
                          </span>
                          {convertedOriginal && product.discount ? (
                            <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>
                              {formatPrice(convertedOriginal, buyerCurrency)}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ marginTop: 8, padding: '6px 10px', background: '#f8fafc', borderRadius: 8, fontSize: 11, color: '#64748b' }}>
                          <div style={{ fontWeight: 700 }}>
                            📊 Tasa: 1 {storeCurr} = {directRate < 0.01 ? directRate.toFixed(6) : directRate < 1 ? directRate.toFixed(4) : directRate.toFixed(2)} {buyerCurrency}
                          </div>
                          <div style={{ marginTop: 2, fontStyle: 'italic', fontSize: 10, color: '#94a3b8' }}>
                            Tasa del día · Fuente: exchangerate-api.com
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
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
                                 const imgIndex = allImages.indexOf(imgUrl);
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
