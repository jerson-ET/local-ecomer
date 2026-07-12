'use client'

import React, { useState, useRef, useCallback } from 'react'
import { UploadedImage } from '@/lib/hooks/useImageUpload'
import { trackAction } from '@/components/analytics/AnalyticsTracker'
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  Trash2,
  Check,
  Plus,
  Upload,
  Tag,
  ImageIcon,
  Package,
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Layers,
  Pencil,
  Save,
  X,
  QrCode,
  Download,
  Store,
  EyeOff,
  FolderSync,
} from 'lucide-react'
import { SingleProductQR, QRSheetModal, QRProduct } from './ProductQRSheet'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TYPES                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface ProductVariant {
  id: string
  color: string
  colorHex: string
  size: string
  type: string
  images: string[]
  uploadedImages: UploadedImage[]
  stock: number
  priceModifier: number
}

export interface DashboardProduct {
  id: string
  name: string
  description: string
  price: number
  discountPrice: number | null
  mainImage: string
  category: string
  variants: ProductVariant[]
  stock: number
  isActive: boolean
  createdAt: string
  sku?: string | null
  showInMarketplace?: boolean
  /* Raw images from DB for editing */
  rawImages?: { full: string; thumbnail: string; isMain: boolean }[]
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Imagen de galería con subida inmediata a R2                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface GalleryImage {
  preview: string
  colorLabel: string
  isMain: boolean
  status: 'uploading' | 'done' | 'error'
  progress: number
  fullUrl: string | null
  thumbnailUrl: string | null
  errorMsg: string | null
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Subir imagen a R2 vía API                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

async function uploadFileToR2(
  file: File,
  folder: string,
  resourceId: string,
  onProgress: (pct: number) => void
): Promise<{ fullUrl: string; thumbnailUrl: string }> {
  const formData = new FormData()
  formData.append('images', file)
  formData.append('folder', folder)
  formData.append('resourceId', resourceId)

  let pct = 0
  const interval = setInterval(() => {
    pct = Math.min(pct + 5, 85)
    onProgress(pct)
  }, 300)

  try {
    const response = await fetch('/api/upload/images', { method: 'POST', body: formData })
    clearInterval(interval)
    onProgress(95)
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data.error || 'Error al subir imagen')
    onProgress(100)
    const img = data.images[0]
    return { fullUrl: img.fullUrl, thumbnailUrl: img.thumbnailUrl }
  } catch (err) {
    clearInterval(interval)
    throw err
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PRODUCT UPLOAD SECTION                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function ProductUploadSection({
  onBack,
  onGoToProducts,
  storeId,
}: {
  onBack: () => void
  onGoToProducts: () => void
  storeId: string | null
}) {
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productDiscountPrice, setProductDiscountPrice] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [productSizes, setProductSizes] = useState('')
  const [productColors, setProductColors] = useState('')
  const [productStock, setProductStock] = useState('10')
  const [productTags, setProductTags] = useState('')
  const [productSku, setProductSku] = useState('')
  const [productCurrency, setProductCurrency] = useState('COP')
  const [showInMarketplace, setShowInMarketplace] = useState(true)
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helpers para formato de precio en tiempo real
  const formatPrice = (val: string) => {
    const num = val.replace(/\D/g, '')
    if (!num) return ''
    return Number(num).toLocaleString('es-CO')
  }
  const parsePrice = (val: string) => val.replace(/\D/g, '')

  const categories = ['Calzado', 'Ropa', 'Accesorios', 'Electrónica', 'Hogar', 'Mascotas', 'Artesanía', 'Gorras', 'Alimentos', 'Belleza', 'Deportes', 'Otro']
  const currencies = [
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

  const handleImagesChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    let currentStoreId = storeId;
    if (!currentStoreId && typeof window !== 'undefined') {
      currentStoreId = localStorage.getItem('activeStoreId');
    }
    if (!currentStoreId) {
      try {
        const storeRes = await fetch('/api/user/stores');
        if (storeRes.ok) {
          const stores = await storeRes.json();
          if (stores.length > 0) {
            currentStoreId = stores[0].id;
            if (typeof window !== 'undefined') localStorage.setItem('activeStoreId', currentStoreId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch store ID", err);
      }
    }
    
    if (!currentStoreId) { setPublishError(`Error: No se detectó el ID de la tienda. (Prop: ${storeId})`); return }
    setPublishError(null)

    for (const file of Array.from(files)) {
      const localPreview = URL.createObjectURL(file)
      const newImg: GalleryImage = {
        preview: localPreview, colorLabel: '', isMain: gallery.length === 0 && Array.from(files).indexOf(file) === 0,
        status: 'uploading', progress: 0, fullUrl: null, thumbnailUrl: null, errorMsg: null,
      }
      setGallery(prev => [...prev, newImg])

      uploadFileToR2(file, 'products', currentStoreId, (pct) => {
        setGallery(prev => prev.map((img) => img.preview === localPreview && img.status === 'uploading' ? { ...img, progress: pct } : img))
      }).then(({ fullUrl, thumbnailUrl }) => {
        setGallery(prev => {
          const idx = prev.findIndex(img => img.preview === localPreview && img.status === 'uploading')
          if (idx === -1) return prev
          const updated = [...prev]
          updated[idx] = { ...updated[idx]!, status: 'done', progress: 100, fullUrl, thumbnailUrl, preview: fullUrl }
          return updated
        })
      }).catch((err) => {
        setGallery(prev => {
          const idx = prev.findIndex(img => img.preview === localPreview && img.status === 'uploading')
          if (idx === -1) return prev
          const updated = [...prev]
          updated[idx] = { ...updated[idx]!, status: 'error', progress: 0, errorMsg: err instanceof Error ? err.message : 'Error' }
          return updated
        })
      })
    }
    e.target.value = ''
  }, [gallery.length, storeId])

  const removeImage = (index: number) => {
    setGallery(prev => {
      const newG = prev.filter((_, i) => i !== index)
      if (prev[index]?.isMain && newG.length > 0) newG[0] = { ...newG[0]!, isMain: true }
      return newG
    })
  }
  const setAsMain = (index: number) => setGallery(prev => prev.map((img, i) => ({ ...img, isMain: i === index })))
  const updateColorLabel = (index: number, val: string) => setGallery(prev => prev.map((img, i) => i === index ? { ...img, colorLabel: val } : img))

  const handlePublish = async () => {
    const mainImg = gallery.find(i => i.isMain) || gallery[0]
    if (!productName || !productPrice || !mainImg) { setPublishError('Faltan datos obligatorios'); return }
    
    let currentStoreId = storeId;
    if (!currentStoreId && typeof window !== 'undefined') {
      currentStoreId = localStorage.getItem('activeStoreId');
    }
    if (!currentStoreId) {
      try {
        const storeRes = await fetch('/api/user/stores');
        if (storeRes.ok) {
          const stores = await storeRes.json();
          if (stores.length > 0) {
            currentStoreId = stores[0].id;
            if (typeof window !== 'undefined') localStorage.setItem('activeStoreId', currentStoreId);
          }
        }
      } catch (err) { }
    }
    if (!currentStoreId) { setPublishError(`Error: No se detectó la tienda. (Prop: ${storeId})`); return }

    const pendingUploads = gallery.filter(g => g.status === 'uploading')
    if (pendingUploads.length > 0) { setPublishError(`Espera a que terminen ${pendingUploads.length} imagen(es)...`); return }
    const failedUploads = gallery.filter(g => g.status === 'error')
    if (failedUploads.length > 0) { setPublishError(`Hay ${failedUploads.length} imagen(es) con error. Elimínalas.`); return }
    const readyImages = gallery.filter(g => g.status === 'done' && g.fullUrl && g.thumbnailUrl)
    if (readyImages.length === 0) { setPublishError('Sube al menos una imagen'); return }

    setIsPublishing(true); setPublishError(null)
    trackAction('product_upload_started', JSON.stringify({ name: productName }))

    try {
      const mainImgData = readyImages.find(g => g.isMain) || readyImages[0]!
      const additionalImgs = readyImages.filter(g => g !== mainImgData)
      const individualColors = productColors.split(',').map(c => c.trim()).filter(Boolean)

      const variantsToSubmit = [{ color: individualColors[0] || 'Original', colorHex: '#000000', size: productSizes || 'Única', type: 'unisex', images: [{ fullUrl: mainImgData.fullUrl!, thumbnailUrl: mainImgData.thumbnailUrl! }], stock: parseInt(productStock) || 1, priceModifier: 0 }]
      additionalImgs.forEach((img) => {
        if (img.colorLabel) variantsToSubmit.push({ color: img.colorLabel, colorHex: '#000000', size: productSizes || 'Única', type: 'unisex', images: [{ fullUrl: img.fullUrl!, thumbnailUrl: img.thumbnailUrl! }], stock: 5, priceModifier: 0 })
      })

      let finalSku = productSku;
      if (!finalSku && productCategory) {
        try {
          const res = await fetch(`/api/products?storeId=${currentStoreId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.products) {
              const catProducts = data.products.filter((p: any) => (p.category_id || p.category) === productCategory && p.sku);
              let max = 0;
              for (const p of catProducts) {
                const num = parseInt(p.sku.replace(/\D/g, ''), 10);
                if (!isNaN(num) && num > max) max = num;
              }
              if (max > 0) {
                finalSku = (max + 1).toString();
              } else {
                const bases: Record<string, number> = { 'Ropa': 3000, 'Gorras': 5000, 'Calzado': 1000, 'Accesorios': 2000, 'Electrónica': 4000, 'Hogar': 6000, 'Mascotas': 7000, 'Artesanía': 8000, 'Alimentos': 9000, 'Belleza': 10000, 'Deportes': 11000 };
                finalSku = (bases[productCategory] || 20000).toString();
              }
            }
          }
        } catch (e) {
          console.error('Error auto-generating SKU', e);
        }
      }

      if (!finalSku || !finalSku.trim()) {
        setPublishError('El Código de Producto (SKU/ID) es obligatorio. Ingrésalo manualmente o selecciona una categoría.');
        setIsPublishing(false);
        return;
      }

      const response = await fetch('/api/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStoreId, name: productName, description: productDescription, price: parseInt(productPrice),
          discountPrice: productDiscountPrice ? parseInt(productDiscountPrice) : null,
          category: productCategory, productTags: productTags.split(',').map(t => t.trim()).filter(Boolean),
          mainImage: { fullUrl: mainImgData.fullUrl!, thumbnailUrl: mainImgData.thumbnailUrl! },
          additionalImages: additionalImgs.map(r => ({ fullUrl: r.fullUrl!, thumbnailUrl: r.thumbnailUrl! })),
          variants: variantsToSubmit,
          sku: finalSku,
          currency: productCurrency,
          showInMarketplace,
        }),
      })
      const result = await response.json()
      if (!response.ok) { setPublishError(result.error || 'Error al publicar'); setIsPublishing(false); return }

      setShowSuccess(true); setIsPublishing(false)
      trackAction('product_published', JSON.stringify({ name: productName }))
      setTimeout(() => { setShowSuccess(false); onGoToProducts() }, 2500)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Error inesperado')
      setIsPublishing(false)
    }
  }

  const uploadedCount = gallery.filter(g => g.status === 'done').length
  const uploadingCount = gallery.filter(g => g.status === 'uploading').length
  const errorCount = gallery.filter(g => g.status === 'error').length
  const anyUploading = uploadingCount > 0

  return (
    <div className="product-upload-section minimal-upload">
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {showSuccess && (<div className="product-success-toast"><CheckCircle2 size={20} /><span>¡Producto publicado!</span></div>)}
      <div className="breadcrumb"><button className="breadcrumb-back" onClick={onBack}><ArrowLeft size={18} /></button><span className="breadcrumb-item">Productos</span><ChevronRight size={14} /><span className="breadcrumb-item active">Nuevo Producto</span></div>

      <div className="product-upload-grid">
        <div className="product-upload-card gallery-card">
          <div className="card-header"><h3><ImageIcon size={18} />Galería de Imágenes</h3><p>Cada imagen se sube a Cloudflare R2 y se convierte a WebP automáticamente.</p></div>
          {gallery.length > 0 && (
            <div style={{ padding: '10px 14px', margin: '0 0 12px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', background: errorCount > 0 ? '#fef2f2' : uploadingCount > 0 ? '#eff6ff' : '#f0fdf4', border: `1px solid ${errorCount > 0 ? '#fecaca' : uploadingCount > 0 ? '#bfdbfe' : '#bbf7d0'}`, color: errorCount > 0 ? '#dc2626' : uploadingCount > 0 ? '#2563eb' : '#166534' }}>
              {errorCount > 0 ? <><AlertCircle size={16} />{errorCount} con error · {uploadedCount} en R2</> : uploadingCount > 0 ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Subiendo {uploadingCount}...</> : <><CheckCircle2 size={16} />{uploadedCount} imágenes en R2 (WebP)</>}
            </div>
          )}
          <div className="minimal-gallery-grid">
            {gallery.map((img, idx) => (
              <div key={idx} className={`gallery-item-minimal ${img.isMain ? 'is-main' : ''}`} style={{ position: 'relative' }}>
                <img src={img.preview} alt="Product" style={{ opacity: img.status === 'uploading' ? 0.5 : img.status === 'error' ? 0.3 : 1, transition: 'opacity 0.3s' }} />
                {img.status === 'uploading' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', gap: '6px', zIndex: 5 }}>
                    <Loader2 size={24} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '11px', color: 'white', fontWeight: 600 }}>{img.progress < 40 ? 'WebP...' : 'R2...'}</span>
                    <div style={{ width: '60%', height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }}><div style={{ width: `${img.progress}%`, height: '100%', background: '#8b5cf6', transition: 'width 0.3s' }} /></div>
                  </div>
                )}
                {img.status === 'error' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(220,38,38,0.5)', borderRadius: '8px', gap: '4px', zIndex: 5 }}>
                    <AlertCircle size={20} color="white" /><span style={{ fontSize: '10px', color: 'white' }}>Error</span>
                    <button onClick={() => removeImage(idx)} style={{ fontSize: '10px', color: 'white', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                  </div>
                )}
                {img.status === 'done' && <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#22c55e', color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px', zIndex: 5 }}><CheckCircle2 size={8} /> WebP</div>}
                {img.status !== 'uploading' && (
                  <div className="gallery-item-actions">
                    <button onClick={() => removeImage(idx)} className="btn-icon-danger"><Trash2 size={14} /></button>
                    {!img.isMain && img.status === 'done' && <button onClick={() => setAsMain(idx)} className="btn-icon-minimal"><Check size={14} /></button>}
                  </div>
                )}
                {img.status === 'done' && <div className="gallery-item-overlay"><input type="text" placeholder="Color" value={img.colorLabel} onChange={(e) => updateColorLabel(idx, e.target.value)} className="color-label-input" /></div>}
                {img.isMain && img.status === 'done' && <span className="main-badge">Principal</span>}
              </div>
            ))}
            <div className="gallery-add-item" onClick={() => fileInputRef.current?.click()}><Plus size={32} /><span>Añadir Imagen</span><span style={{ fontSize: '10px', color: '#94a3b8' }}>Se sube a R2</span></div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImagesChange} style={{ display: 'none' }} />
        </div>

        <div className="product-upload-card info-card">
          <div className="card-header"><h3><Tag size={18} />Información del Producto</h3></div>
          <div className="minimal-form">
            <div className="form-field-minimal"><label>Nombre del Producto</label><input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ej: Zapatillas Urbanas Pro" className="min-input" /></div>
            <div className="form-row-minimal">
              <div className="form-field-minimal"><label>Precio</label><div className="input-prefix-wrapper"><span className="prefix">$</span><input type="text" inputMode="numeric" value={formatPrice(productPrice)} onChange={(e) => setProductPrice(parsePrice(e.target.value))} placeholder="0" className="min-input" /></div></div>
              <div className="form-field-minimal"><label>Moneda</label><select value={productCurrency} onChange={(e) => setProductCurrency(e.target.value)} className="min-select">{currencies.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select></div>
            </div>
            <div className="form-row-minimal">
              <div className="form-field-minimal"><label>Oferta (Opcional)</label><div className="input-prefix-wrapper"><span className="prefix">$</span><input type="text" inputMode="numeric" value={formatPrice(productDiscountPrice)} onChange={(e) => setProductDiscountPrice(parsePrice(e.target.value))} placeholder="0" className="min-input" /></div></div>
            </div>
            <div className="form-field-minimal"><label>Descripción</label><textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} placeholder="Detalles del producto..." className="min-textarea" rows={3} /></div>
            <div className="form-field-minimal">
              <label>Categoría</label>
              <select 
                value={categories.includes(productCategory) ? productCategory : (productCategory ? productCategory : '')} 
                onChange={(e) => { 
                  if(e.target.value === '___new___') { 
                    const custom = window.prompt('Escribe el nombre de la nueva categoría:'); 
                    if(custom && custom.trim()) setProductCategory(custom.trim()); 
                  } else { 
                    setProductCategory(e.target.value); 
                  } 
                }} 
                className="min-select"
              >
                <option value="">Seleccionar...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                {productCategory && !categories.includes(productCategory) && <option value={productCategory}>{productCategory}</option>}
                <option value="___new___" style={{ fontWeight: 'bold', color: '#6366f1' }}>+ Crear nueva categoría</option>
              </select>
            </div>
            <div className="form-row-minimal">
              <div className="form-field-minimal"><label>Tallas</label><input type="text" value={productSizes} onChange={(e) => setProductSizes(e.target.value)} placeholder="S, M, L, XL" className="min-input" /></div>
              <div className="form-field-minimal"><label>Colores</label><input type="text" value={productColors} onChange={(e) => setProductColors(e.target.value)} placeholder="Azul, Negro" className="min-input" /></div>
            </div>
            <div className="form-field-minimal"><label>Stock Total</label><input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} className="min-input" /></div>
            <div className="form-field-minimal"><label>Código ID (Obligatorio para POS)</label><input type="text" value={productSku} onChange={(e) => setProductSku(e.target.value)} placeholder="Ej: ABC-123 (Se auto-generará si se deja vacío)" className="min-input" /></div>
            <div className="form-field-minimal" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '10px', marginBottom: '15px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <input type="checkbox" id="showInMarketplace" checked={showInMarketplace} onChange={(e) => setShowInMarketplace(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#FF5A26', marginTop: '2px' }} />
              <label htmlFor="showInMarketplace" style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                Publicar en el Marketplace General de LocalEcomer
                <span style={{ display: 'block', fontWeight: 500, fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: '1.4' }}>Permite que tu producto sea descubierto en la página principal para todos los compradores.</span>
              </label>
            </div>
            <div className="minimal-actions">
              <button className="btn-minimal-publish" onClick={handlePublish} disabled={!productName || !productPrice || uploadedCount === 0 || isPublishing || anyUploading}>
                {isPublishing ? <><Loader2 size={16} className="spinning" /> Publicando...</> : anyUploading ? <><Loader2 size={16} className="spinning" /> Subiendo...</> : <><Upload size={16} /> Publicar Producto</>}
              </button>
            </div>
            {publishError && (<div className="minimal-error-bar"><AlertCircle size={16} /><span>{publishError}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PRODUCT LIST SECTION — Con edición, eliminación, subida de imágenes       */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function ProductListSection({
  onBack,
  onAddProduct,
  storeId,
  storeSlug,
  activeSection,
}: {
  onBack: () => void
  onAddProduct: () => void
  storeId: string | null
  storeSlug?: string | null
  activeSection?: string
}) {
  const [products, setProducts] = useState<DashboardProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<DashboardProduct | null>(null)
  const [activeViewImage, setActiveViewImage] = useState<string | null>(null)
  const [activeStoreId, setActiveStoreId] = useState<string | null>(storeId)
  const [showQRSheet, setShowQRSheet] = useState(false)

  /* Modals de Gestión de Categorías */
  const [showDeleteCatModal, setShowDeleteCatModal] = useState(false)
  const [deleteCatSelection, setDeleteCatSelection] = useState('')
  const [deleteCatTarget, setDeleteCatTarget] = useState('')
  const [isDeletingCat, setIsDeletingCat] = useState(false)

  const [showMigrateModal, setShowMigrateModal] = useState(false)
  const [migratingProductId, setMigratingProductId] = useState<string | null>(null)

  /* Estado de edición */
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editDiscountPrice, setEditDiscountPrice] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editStock, setEditStock] = useState('')
  const [editSizes, setEditSizes] = useState('')
  const [editColors, setEditColors] = useState('')
  const [editSku, setEditSku] = useState('')
  const [editCurrency, setEditCurrency] = useState('COP')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState(false)
  const [editShowInMarketplace, setEditShowInMarketplace] = useState(true)

  /* Estado de subida de imágenes adicionales */
  const [editImages, setEditImages] = useState<{ full: string; thumbnail: string; isMain: boolean }[]>([])
  const [uploadingNewImage, setUploadingNewImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const [isUpdatingMarketplace, setIsUpdatingMarketplace] = useState(false)

  const handleToggleMarketplace = async (show: boolean) => {
    if (!selectedProduct || !storeId) return
    setIsUpdatingMarketplace(true)
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          storeId,
          showInMarketplace: show
        })
      })
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, showInMarketplace: show } : p))
        setSelectedProduct(prev => prev ? { ...prev, showInMarketplace: show } : null)
      } else {
        const err = await res.json()
        alert(err.error || 'Error al cambiar visibilidad')
      }
    } catch (err) {
      console.error(err)
      alert('Error de conexión')
    } finally {
      setIsUpdatingMarketplace(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!deleteCatSelection || !deleteCatTarget || deleteCatSelection === deleteCatTarget) {
      alert("Debes seleccionar una categoría a eliminar y una de destino (distintas).")
      return
    }
    setIsDeletingCat(true)
    try {
      const res = await fetch('/api/products/bulk-category', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeStoreId, oldCategory: deleteCatSelection, newCategory: deleteCatTarget })
      })
      if (res.ok) {
        setProducts(prev => prev.map(p => p.category === deleteCatSelection ? { ...p, category: deleteCatTarget } : p))
        setShowDeleteCatModal(false)
        setDeleteCatSelection('')
        setDeleteCatTarget('')
        alert('Categoría eliminada y productos migrados exitosamente.')
      } else {
        alert('Error al migrar y eliminar')
      }
    } catch {
      alert('Error de red al intentar eliminar categoría')
    } finally {
      setIsDeletingCat(false)
    }
  }

  const handleMigrateSingleProduct = async (productId: string, newCat: string) => {
    if (!newCat) return
    if (newCat === '___new___') {
      const custom = window.prompt('Escribe el nombre de la nueva categoría:')
      if (!custom || !custom.trim()) return
      newCat = custom.trim()
    }
    setMigratingProductId(productId)
    try {
      const res = await fetch('/api/products/bulk-category', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeStoreId, productId, newCategory: newCat })
      })
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, category: newCat } : p))
      } else {
        alert('Error al migrar el producto')
      }
    } catch {
      alert('Error de red al intentar migrar el producto')
    } finally {
      setMigratingProductId(null)
    }
  }

  const categories = ['Calzado', 'Ropa', 'Accesorios', 'Electrónica', 'Hogar', 'Mascotas', 'Artesanía', 'Gorras', 'Alimentos', 'Belleza', 'Deportes', 'Otro']

  /* ─── Cargar productos ─── */
  React.useEffect(() => {
    let isMounted = true
    async function fetchProducts() {
      // Si ya tenemos productos cargados en memoria, hacemos una recarga silenciosa en segundo plano.
      // Esto evita el molesto parpadeo y la espera en blanco para el usuario.
      if (products.length === 0) {
        setIsLoading(true)
      }
      try {
        let currentStoreId = storeId

        // Si no tenemos storeId como prop, entonces hacemos el fallback
        if (!currentStoreId) {
          const storeRes = await fetch('/api/user/stores')
          if (storeRes.ok) {
            const stores = await storeRes.json()
            if (stores.length > 0) {
              currentStoreId = stores[0].id
              if (isMounted) setActiveStoreId(stores[0].id)
            }
          }
        } else {
          if (isMounted && !activeStoreId) {
            setActiveStoreId(storeId)
          }
        }

        if (!currentStoreId) {
          if (isMounted) { setProducts([]); setIsLoading(false) }
          return
        }

        const res = await fetch(`/api/products?storeId=${currentStoreId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && isMounted) {
            type DbImage = { thumbnail?: string; full?: string; isMain?: boolean }
            type DbVariant = { id: string; color: string; color_hex: string; size: string; type: string; images?: DbImage[]; stock: number; price_modifier: number }
            type DbProduct = { id: string; name: string; description?: string; price: number; discount_price?: number; images?: DbImage[]; category_id?: string; product_variants?: DbVariant[]; is_active: boolean; created_at: string; sku?: string }
            const mapped = data.products.map((p: DbProduct) => ({
              id: p.id, name: p.name, description: p.description || '', price: p.price, discountPrice: p.discount_price,
              mainImage: p.images?.[0]?.thumbnail || p.images?.[0]?.full || '',
              category: p.category_id || 'Sin categoría',
              rawImages: p.images || [],
              sku: p.sku,
              variants: (p.product_variants || []).map((v: DbVariant) => ({
                id: v.id, color: v.color, colorHex: v.color_hex, size: v.size, type: v.type,
                images: v.images?.map((img: DbImage) => img.thumbnail || img.full) || [],
                uploadedImages: [], stock: v.stock, priceModifier: v.price_modifier,
              })),
              stock: (p as any).stock || 0,
              isActive: p.is_active, createdAt: p.created_at,
              showInMarketplace: (p as any).show_in_marketplace !== undefined ? (p as any).show_in_marketplace : true,
            }))
            setProducts(mapped)
          }
        }
      } catch (err) { console.error('Error fetching products', err) }
      finally { if (isMounted) setIsLoading(false) }
    }
    fetchProducts()
    return () => { isMounted = false }
  }, [storeId, activeSection])

  /* ─── Iniciar edición ─── */
  const startEditing = (product: DashboardProduct) => {
    setEditName(product.name)
    setEditDescription(product.description)
    setEditPrice(String(product.price))
    setEditDiscountPrice(product.discountPrice ? String(product.discountPrice) : '')
    setEditCategory(product.category)
    setEditStock(String(product.variants.length > 0 ? product.variants.reduce((acc, v) => acc + v.stock, 0) : product.stock))
    setEditSizes(product.variants.map(v => v.size).filter((v, i, arr) => arr.indexOf(v) === i).join(', '))
    setEditColors(product.variants.map(v => v.color).filter((v, i, arr) => arr.indexOf(v) === i).join(', '))
    setEditImages(product.rawImages || [])
    setEditSku(product.sku || '')
    setEditCurrency((product as any).currency || 'COP')
    setEditShowInMarketplace(product.showInMarketplace !== undefined ? product.showInMarketplace : true)
    setIsEditing(true)
    setEditError(null)
    setEditSuccess(false)
  }

  /* ─── Guardar edición ─── */
  const handleSaveEdit = async () => {
    if (!selectedProduct || !activeStoreId) return
    setIsSaving(true); setEditError(null)

    if (!editName || !editPrice) {
      setEditError('El nombre y el precio son obligatorios.');
      setIsSaving(false);
      return;
    }

    if (!editSku || !editSku.trim()) {
      setEditError('El Código de Producto (SKU/ID) es obligatorio para el sistema POS.');
      setIsSaving(false);
      return;
    }

    try {
      const colors = editColors.split(',').map(c => c.trim()).filter(Boolean)
      const variants = colors.length > 0
        ? colors.map((color, idx) => ({
            color,
            colorHex: '#000000',
            size: editSizes || 'Única',
            type: 'unisex',
            images: editImages[idx] ? [{ fullUrl: editImages[idx]!.full, thumbnailUrl: editImages[idx]!.thumbnail }] : [],
            stock: Math.round((parseInt(editStock) || 10) / colors.length),
            priceModifier: 0,
          }))
        : [{ color: 'Original', colorHex: '#000000', size: editSizes || 'Única', type: 'unisex', images: editImages[0] ? [{ fullUrl: editImages[0].full, thumbnailUrl: editImages[0].thumbnail }] : [], stock: parseInt(editStock) || 10, priceModifier: 0 }]

      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          storeId: activeStoreId,
          name: editName,
          description: editDescription,
          price: parseInt(editPrice),
          discountPrice: editDiscountPrice ? parseInt(editDiscountPrice) : null,
          category: editCategory,
          stock: parseInt(editStock) || 10,
          images: editImages,
          variants,
          sku: editSku,
          currency: editCurrency,
          showInMarketplace: editShowInMarketplace,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setEditError(data.error || 'Error al guardar'); setIsSaving(false); return
      }

      setEditSuccess(true)
      setIsEditing(false)
      setIsSaving(false)

      const localVariants = variants.map((v, i) => ({
        id: selectedProduct.variants[i]?.id || String(Date.now() + i),
        color: v.color,
        colorHex: v.colorHex,
        size: v.size,
        type: v.type,
        images: v.images.map(img => img.thumbnailUrl || img.fullUrl),
        stock: v.stock,
        priceModifier: v.priceModifier
      }))

      /* Actualizar producto en la lista local */
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? {
        ...p, name: editName, description: editDescription, price: parseInt(editPrice),
        discountPrice: editDiscountPrice ? parseInt(editDiscountPrice) : null,
        category: editCategory, mainImage: editImages[0]?.thumbnail || editImages[0]?.full || p.mainImage,
        rawImages: editImages,
        sku: editSku,
        showInMarketplace: editShowInMarketplace,
        variants: localVariants,
      } : p))

      /* Actualizar selectedProduct */
      setSelectedProduct(prev => prev ? {
        ...prev, name: editName, description: editDescription, price: parseInt(editPrice),
        discountPrice: editDiscountPrice ? parseInt(editDiscountPrice) : null,
        category: editCategory, mainImage: editImages[0]?.thumbnail || editImages[0]?.full || prev.mainImage,
        rawImages: editImages,
        sku: editSku,
        showInMarketplace: editShowInMarketplace,
        variants: localVariants,
      } : null)

      setTimeout(() => setEditSuccess(false), 3000)
    } catch {
      setEditError('Error de conexión'); setIsSaving(false)
    }
  }

  /* ─── Eliminar producto ─── */
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return
    if (!window.confirm(`¿Eliminar "${selectedProduct.name}"? Esta acción no se puede deshacer.`)) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/products?productId=${selectedProduct.id}`, { method: 'DELETE' })
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== selectedProduct.id))
        setSelectedProduct(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Error al eliminar')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setIsDeleting(false)
    }
  }

  /* ─── Subir nueva imagen al producto ─── */
  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeStoreId) return
    e.target.value = ''

    setUploadingNewImage(true); setUploadProgress(0)

    try {
      const { fullUrl, thumbnailUrl } = await uploadFileToR2(file, 'products', activeStoreId, (pct) => setUploadProgress(pct))
      setEditImages(prev => [...prev, { full: fullUrl, thumbnail: thumbnailUrl, isMain: prev.length === 0 }])
    } catch {
      alert('Error al subir imagen')
    } finally {
      setUploadingNewImage(false); setUploadProgress(0)
    }
  }

  /* ─── Eliminar imagen del producto ─── */
  const handleRemoveImage = (index: number) => {
    setEditImages(prev => {
      const newImgs = prev.filter((_, i) => i !== index)
      if (prev[index]?.isMain && newImgs.length > 0) newImgs[0] = { ...newImgs[0]!, isMain: true }
      return newImgs
    })
  }

  /* ─── Filtrado ─── */
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory
    return matchesSearch && matchesCategory
  })
  const allCategories = ['all', ...new Set(products.map((p) => p.category))]

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER: Detalle de producto con edición                               */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (selectedProduct) {
    const rawImageUrls = new Set<string>()
    selectedProduct.rawImages?.forEach(img => {
      if (img.full) rawImageUrls.add(img.full)
      if (img.thumbnail) rawImageUrls.add(img.thumbnail)
    })
    if (selectedProduct.mainImage) rawImageUrls.add(selectedProduct.mainImage)

    const allVariantImages = selectedProduct.variants
      .flatMap((v) => v.images.map((img) => ({ img, color: v.color })))
      .filter((v) => !rawImageUrls.has(v.img))

    return (
      <div className="product-detail-view">
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div className="breadcrumb">
          <button className="breadcrumb-back" onClick={() => { setSelectedProduct(null); setIsEditing(false); setActiveViewImage(null); }}><ArrowLeft size={18} /></button>
          <span className="breadcrumb-item">Mis Productos</span><ChevronRight size={14} /><span className="breadcrumb-item active">{selectedProduct.name}</span>
        </div>

        <div className="product-detail-layout">
          {/* ─── Galería ─── */}
          <div className="product-detail-gallery">
            <div className="product-detail-main-img">
              <img src={isEditing && editImages[0] ? (editImages[0].full || editImages[0].thumbnail) : (activeViewImage || selectedProduct.rawImages?.[0]?.full || selectedProduct.mainImage)} alt={selectedProduct.name} />
              {selectedProduct.discountPrice && !isEditing && <span className="detail-discount-badge">-{Math.round(((selectedProduct.price - selectedProduct.discountPrice) / selectedProduct.price) * 100)}%</span>}
            </div>

            {isEditing ? (
              /* Galería editable */
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {editImages.map((img, i) => (
                  <div key={i} style={{ width: 70, height: 70, borderRadius: 8, overflow: 'hidden', position: 'relative', border: img.isMain ? '2px solid #6366f1' : '1px solid #e2e8f0' }}>
                    <img src={img.thumbnail || img.full} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => handleRemoveImage(i)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', width: 20, height: 20, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, padding: 0 }}>
                      <X size={12} />
                    </button>
                    {img.isMain && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#6366f1', color: 'white', fontSize: 8, textAlign: 'center', fontWeight: 700, padding: '1px 0' }}>Principal</div>}
                  </div>
                ))}

                {/* Botón agregar imagen */}
                <div
                  onClick={() => !uploadingNewImage && editFileInputRef.current?.click()}
                  style={{ width: 70, height: 70, borderRadius: 8, border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 2, background: '#f8fafc' }}
                >
                  {uploadingNewImage ? (
                    <><Loader2 size={16} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: 8, color: '#6366f1' }}>{uploadProgress}%</span></>
                  ) : (
                    <><Plus size={16} color="#94a3b8" /><span style={{ fontSize: 8, color: '#94a3b8' }}>Añadir</span></>
                  )}
                </div>
                <input ref={editFileInputRef} type="file" accept="image/*" onChange={handleAddImage} style={{ display: 'none' }} />
              </div>
            ) : (
              /* Thumbnails normales */
              <div className="product-detail-thumbnails" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {selectedProduct.rawImages && selectedProduct.rawImages.length > 0 ? (
                  selectedProduct.rawImages.map((img, i) => {
                    const imgSrc = img.thumbnail || img.full
                    const isImgActive = activeViewImage === img.full || (!activeViewImage && i === 0)
                    return (
                      <div key={`raw-${i}`} className={`thumb-item ${isImgActive ? 'active' : ''}`} onClick={() => setActiveViewImage(img.full)}>
                        <img src={imgSrc} alt="" />
                        <span className="thumb-label">{img.isMain ? 'Principal' : `Img ${i+1}`}</span>
                      </div>
                    )
                  })
                ) : (
                  <div className={`thumb-item ${!activeViewImage ? 'active' : ''}`} onClick={() => setActiveViewImage(null)}>
                    <img src={selectedProduct.mainImage} alt="Principal" />
                    <span className="thumb-label">Principal</span>
                  </div>
                )}
                {allVariantImages.map((v, i) => (
                  <div key={`var-${i}`} className={`thumb-item ${activeViewImage === v.img ? 'active' : ''}`} onClick={() => setActiveViewImage(v.img)}>
                    <img src={v.img} alt={v.color} />
                    <span className="thumb-label">{v.color}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Info / Edición ─── */}
          <div className="product-detail-info">
            {isEditing ? (
              /* MODO EDICIÓN */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><Pencil size={18} /> Editar Producto</h3>
                  <button onClick={() => setIsEditing(false)} style={{ background: '#f1f5f9', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' }}><X size={18} color="#64748b" /></button>
                </div>

                <div><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Nombre</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Descripción</label><textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, resize: 'none' }} /></div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Precio</label><input type="text" inputMode="numeric" value={editPrice ? Number(editPrice).toLocaleString('es-CO') : ''} onChange={(e) => setEditPrice(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Moneda</label><select value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }}>{[{code:'COP',label:'🇨🇴 COP'},{code:'USD',label:'🇺🇸 USD'},{code:'EUR',label:'🇪🇺 EUR'},{code:'ARS',label:'🇦🇷 ARS'},{code:'MXN',label:'🇲🇽 MXN'},{code:'BRL',label:'🇧🇷 BRL'},{code:'CLP',label:'🇨🇱 CLP'},{code:'PEN',label:'🇵🇪 PEN'},{code:'BOB',label:'🇧🇴 BOB'},{code:'UYU',label:'🇺🇾 UYU'},{code:'PYG',label:'🇵🇾 PYG'},{code:'VES',label:'🇻🇪 VES'},{code:'CNY',label:'🇨🇳 CNY'},{code:'GBP',label:'🇬🇧 GBP'},{code:'JPY',label:'🇯🇵 JPY'}].map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select></div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Oferta</label><input type="text" inputMode="numeric" value={editDiscountPrice ? Number(editDiscountPrice).toLocaleString('es-CO') : ''} onChange={(e) => setEditDiscountPrice(e.target.value.replace(/\D/g, ''))} placeholder="Opcional" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} /></div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Categoría</label>
                  <select 
                    value={categories.includes(editCategory) ? editCategory : (editCategory ? editCategory : '')} 
                    onChange={(e) => {
                      if (e.target.value === '___new___') {
                        const custom = window.prompt('Escribe el nombre de la nueva categoría:');
                        if (custom && custom.trim()) setEditCategory(custom.trim());
                      } else {
                        setEditCategory(e.target.value);
                      }
                    }} 
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }}
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    {editCategory && !categories.includes(editCategory) && <option value={editCategory}>{editCategory}</option>}
                    <option value="___new___" style={{ fontWeight: 'bold', color: '#6366f1' }}>+ Crear nueva categoría</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Tallas</label><input type="text" value={editSizes} onChange={(e) => setEditSizes(e.target.value)} placeholder="S, M, L" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Colores</label><input type="text" value={editColors} onChange={(e) => setEditColors(e.target.value)} placeholder="Azul, Negro" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} /></div>
                </div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Stock Total</label><input type="number" value={editStock} onChange={(e) => setEditStock(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Código ID (Obligatorio para POS)</label><input type="text" value={editSku} onChange={(e) => setEditSku(e.target.value)} placeholder="Ej: ABC-123" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} /></div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '10px', marginBottom: '10px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <input type="checkbox" id="editShowInMarketplace" checked={editShowInMarketplace} onChange={(e) => setEditShowInMarketplace(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#FF5A26', marginTop: '2px' }} />
                  <label htmlFor="editShowInMarketplace" style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                    Publicar en el Marketplace General
                    <span style={{ display: 'block', fontWeight: 500, fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: '1.4' }}>Visible en la página de inicio para todos los compradores.</span>
                  </label>
                </div>

                {editError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={16} />{editError}</div>}
                {editSuccess && <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, color: '#166534', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={16} />¡Producto actualizado!</div>}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={handleSaveEdit} disabled={isSaving} style={{ flex: 2, background: '#0f172a', color: 'white', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: isSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {isSaving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</> : <><Save size={16} /> Guardar Cambios</>}
                  </button>
                  <button onClick={() => setIsEditing(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', padding: '14px', borderRadius: 12, fontWeight: 600, fontSize: 14, border: '1px solid #e2e8f0', cursor: 'pointer' }}>Cancelar</button>
                </div>
              </div>
            ) : (
              /* MODO VISTA */
              <>
                <div className="detail-top-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span className="product-detail-category">{selectedProduct.category}</span>
                    <span className={`product-status ${selectedProduct.isActive ? 'active' : 'inactive'}`}>{selectedProduct.isActive ? '● Activo en Tienda' : '○ Inactivo en Tienda'}</span>
                  </div>
                  
                  {/* Botones de acción rápida para el Marketplace */}
                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
                    <button
                      onClick={() => handleToggleMarketplace(true)}
                      disabled={isUpdatingMarketplace}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        cursor: isUpdatingMarketplace ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        border: selectedProduct.showInMarketplace !== false ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: selectedProduct.showInMarketplace !== false ? '#eff6ff' : '#ffffff',
                        color: selectedProduct.showInMarketplace !== false ? '#2563eb' : '#64748b',
                        boxShadow: selectedProduct.showInMarketplace !== false ? '0 4px 6px -1px rgba(37, 99, 235, 0.08)' : 'none',
                      }}
                    >
                      {isUpdatingMarketplace && selectedProduct.showInMarketplace !== false ? (
                        <Loader2 size={12} className="spinning" />
                      ) : (
                        '🌐'
                      )}
                      <span>Publicar en Marketplace</span>
                    </button>
                    
                    <button
                      onClick={() => handleToggleMarketplace(false)}
                      disabled={isUpdatingMarketplace}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        cursor: isUpdatingMarketplace ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        border: selectedProduct.showInMarketplace === false ? '2px solid #ff5a26' : '1px solid #cbd5e1',
                        background: selectedProduct.showInMarketplace === false ? '#fef2f2' : '#ffffff',
                        color: selectedProduct.showInMarketplace === false ? '#ff5a26' : '#64748b',
                        boxShadow: selectedProduct.showInMarketplace === false ? '0 4px 6px -1px rgba(255, 90, 38, 0.08)' : 'none',
                      }}
                    >
                      {isUpdatingMarketplace && selectedProduct.showInMarketplace === false ? (
                        <Loader2 size={12} className="spinning" />
                      ) : (
                        '🔒'
                      )}
                      <span>Quitar de Marketplace</span>
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h2 style={{ margin: 0 }}>{selectedProduct.name}</h2>
                  {selectedProduct.sku && <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>{selectedProduct.sku}</span>}
                </div>
                <p className="product-detail-desc">{selectedProduct.description || 'Sin descripción'}</p>
                <div className="product-detail-pricing">{selectedProduct.discountPrice && <span className="product-detail-original-price">${selectedProduct.price.toLocaleString('es-CO')}</span>}<span className="product-detail-price">${(selectedProduct.discountPrice || selectedProduct.price).toLocaleString('es-CO')}</span></div>

                <h4 className="product-detail-section-title"><Layers size={16} />Variantes ({selectedProduct.variants.length})</h4>
                <div className="product-detail-variants">
                  {selectedProduct.variants.map((v) => (
                    <div key={v.id} className="product-detail-variant-card">
                      <div className="variant-card-header"><span className="variant-color-dot-lg" style={{ background: v.colorHex }} /><div><strong>{v.color}</strong><span className="variant-meta">Talla {v.size} · {v.type}</span></div></div>
                      <div className="variant-card-images">{v.images.map((img, i) => <img key={i} src={img} alt={`${v.color} ${i}`} />)}</div>
                      <div className="variant-card-footer"><span>Stock: {v.stock}</span>{v.priceModifier !== 0 && <span className={v.priceModifier > 0 ? 'price-up' : 'price-down'}>{v.priceModifier > 0 ? '+' : ''}${Math.abs(v.priceModifier).toLocaleString('es-CO')}</span>}</div>
                    </div>
                  ))}
                </div>

                <div className="product-detail-stats-row">
                  <div className="stat-box"><ImageIcon size={14} /><span>{selectedProduct.variants.reduce((acc, v) => acc + v.images.length, 0) + 1} imágenes</span></div>
                  <div className="stat-box"><Layers size={14} /><span>{selectedProduct.variants.length} variantes</span></div>
                  <div className="stat-box"><Package size={14} /><span>{selectedProduct.variants.length > 0 ? selectedProduct.variants.reduce((acc, v) => acc + v.stock, 0) : (selectedProduct.stock ?? 0)} en stock</span></div>
                </div>

                {/* ─── CÓDIGO QR DEL PRODUCTO ─── */}
                <div style={{ marginTop: 20, padding: 20, background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', borderRadius: 18, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <QrCode size={18} color="white" />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Código QR del Producto</h4>
                      <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Escaneable desde el Sistema POS</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <SingleProductQR product={{ id: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, discountPrice: selectedProduct.discountPrice, sku: selectedProduct.sku, mainImage: selectedProduct.mainImage }} size={130} />
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontSize: 12, color: '#475569', marginBottom: 6 }}>
                        <strong>Código:</strong> {selectedProduct.sku || selectedProduct.id.substring(0, 12) + '...'}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
                        Imprime este QR y pégalo en el producto físico. Al escanear con la cámara del POS se agregará automáticamente al carrito.
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button onClick={() => startEditing(selectedProduct)} style={{ flex: 1, background: '#0f172a', color: 'white', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Pencil size={16} /> Editar Producto
                  </button>
                  <button onClick={handleDeleteProduct} disabled={isDeleting} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: isDeleting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 140 }}>
                    <Trash2 size={16} /> {isDeleting ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>

                {editSuccess && <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, color: '#166534', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={16} />¡Cambios guardados!</div>}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER: Lista de productos                                            */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="product-list-section">
      <div className="breadcrumb">
        <button className="breadcrumb-back" onClick={onBack}><ArrowLeft size={18} /></button>
        <span className="breadcrumb-item">Productos</span><ChevronRight size={14} /><span className="breadcrumb-item active">Todos los Productos</span>
      </div>

      <div className="products-topbar">
        <div className="products-search-wrapper"><Search size={18} /><input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="products-search-input" /></div>
        <div className="products-topbar-actions">
          <button
            onClick={() => setShowDeleteCatModal(true)}
            style={{ background: '#1e293b', color: '#fff', border: '1px solid #fecaca', borderRadius: 6, padding: '6px 12px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
          >
            <Trash2 size={16} />
            <span>Eliminar Categorías</span>
          </button>
          <button
            onClick={() => setShowMigrateModal(true)}
            style={{ background: '#1e293b', color: '#fff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '6px 12px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
          >
            <FolderSync size={16} />
            <span>Migrar Productos</span>
          </button>
          {products.length > 0 && (
            <button
              onClick={() => setShowQRSheet(true)}
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none', borderRadius: 6, padding: '3px 12px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 15px rgba(99,102,241,0.3)', transition: 'transform 0.15s', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
            >
              <QrCode size={16} />
              <span>QR PDF</span>
            </button>
          )}
          <button className="btn-add-new-product" onClick={onAddProduct}><Plus size={18} /><span>Subir</span></button>
        </div>
      </div>
      <div className="products-filters">
        {allCategories.map((cat) => <button key={cat} className={`filter-chip ${filterCategory === cat ? 'active' : ''}`} onClick={() => setFilterCategory(cat)}>{cat === 'all' ? 'Todos' : cat}</button>)}
      </div>
      {isLoading ? (
        <div className="products-empty"><Loader2 size={48} className="spinning" style={{ marginBottom: 16 }} /><h3>Cargando productos...</h3></div>
      ) : filteredProducts.length === 0 ? (
        <div className="products-empty"><Package size={64} /><h3>No hay productos</h3><p>Sube tu primer producto para verlo aquí</p><button className="btn-add-new-product" onClick={onAddProduct}><Plus size={18} />Subir</button></div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card-dashboard" onClick={() => setSelectedProduct(product)}>
              <div className="product-card-image">
                <img src={product.rawImages?.[0]?.full || product.mainImage} alt={product.name} />
                {product.discountPrice && <span className="product-card-discount">-{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%</span>}
                
                {/* Badge Marketplace */}
                <div className={`product-card-marketplace-badge ${product.showInMarketplace === false ? 'off' : ''}`}>
                  {product.showInMarketplace === false ? <EyeOff size={12} /> : <Store size={12} />}
                  {product.showInMarketplace === false ? 'Oculto' : 'Marketplace'}
                </div>

                {/* Badge Más Imágenes */}
                {((product.rawImages?.length || 1) + product.variants.reduce((acc, v) => acc + (v.images?.length || 0), 0) > 1) && (
                  <div className="product-card-images-badge">
                    <ImageIcon size={12} />
                    {(product.rawImages?.length || 1) + product.variants.reduce((acc, v) => acc + (v.images?.length || 0), 0)}
                  </div>
                )}

                <div className="product-card-variants-badge"><Layers size={12} />{product.variants.length}</div>
              </div>
              <div className="product-card-body">
                <span className="product-card-category">{product.category}</span>
                <h4 className="product-card-name">{product.name}</h4>
                <div className="product-card-pricing">
                  {product.discountPrice ? (<><span className="product-card-old-price">${product.price.toLocaleString('es-CO')}</span><span className="product-card-price">${product.discountPrice.toLocaleString('es-CO')}</span></>) : (<span className="product-card-price">${product.price.toLocaleString('es-CO')}</span>)}
                </div>
                <div className="product-card-colors">{product.variants.map((v) => <span key={v.id} className="product-card-color-dot" style={{ background: v.colorHex }} title={`${v.color} - ${v.size}`} />)}</div>
                <div className="product-card-meta"><span><ImageIcon size={12} />{product.variants.reduce((acc, v) => acc + v.images.length, 0) + 1}</span><span><Package size={12} />{product.variants.length > 0 ? product.variants.reduce((acc, v) => acc + v.stock, 0) : (product.stock ?? 0)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de hoja QR para PDF */}
      {showQRSheet && (
        <QRSheetModal
          products={products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            discountPrice: p.discountPrice,
            sku: p.sku,
            mainImage: p.mainImage,
          }))}
          onClose={() => setShowQRSheet(false)}
        />
      )}

      {/* Modal: Eliminar Categoría */}
      {showDeleteCatModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 20, width: '100%', maxWidth: 450, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><Trash2 size={24} color="#ef4444" /> Eliminar Categoría</h3>
            
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>1. Categoría a eliminar</label>
            <select 
              value={deleteCatSelection} 
              onChange={e => { setDeleteCatSelection(e.target.value); setDeleteCatTarget(''); }}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, marginBottom: 16 }}
            >
              <option value="">Seleccionar...</option>
              {allCategories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {deleteCatSelection && (
              <>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 16px', borderRadius: 12, marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 500 }}>
                    Esta categoría tiene <strong>{products.filter(p => p.category === deleteCatSelection).length} productos</strong>. 
                    ¿Deseas migrarlos a otra categoría antes de eliminarla?
                  </p>
                </div>

                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>2. Mover productos a:</label>
                <select 
                  value={deleteCatTarget} 
                  onChange={e => setDeleteCatTarget(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, marginBottom: 24 }}
                >
                  <option value="">Seleccionar destino...</option>
                  {allCategories.filter(c => c !== 'all' && c !== deleteCatSelection).map(c => <option key={`target-${c}`} value={c}>{c}</option>)}
                </select>
              </>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={handleDeleteCategory} 
                disabled={isDeletingCat || !deleteCatSelection || !deleteCatTarget || deleteCatSelection === deleteCatTarget} 
                style={{ flex: 1, background: '#ef4444', color: 'white', padding: '12px', borderRadius: 12, fontWeight: 700, border: 'none', cursor: (isDeletingCat || !deleteCatSelection || !deleteCatTarget || deleteCatSelection === deleteCatTarget) ? 'not-allowed' : 'pointer', opacity: (isDeletingCat || !deleteCatSelection || !deleteCatTarget || deleteCatSelection === deleteCatTarget) ? 0.5 : 1 }}
              >
                {isDeletingCat ? 'Procesando...' : 'Confirmar y Eliminar'}
              </button>
              <button 
                onClick={() => { setShowDeleteCatModal(false); setDeleteCatSelection(''); setDeleteCatTarget(''); }} 
                style={{ flex: 1, background: '#f1f5f9', color: '#475569', padding: '12px', borderRadius: 12, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Migrar Productos */}
      {showMigrateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#f8fafc', padding: 24, borderRadius: 20, width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><FolderSync size={24} color="#2563eb" /> Migrar Productos</h3>
              <button onClick={() => setShowMigrateModal(false)} style={{ background: '#e2e8f0', border: 'none', padding: 8, borderRadius: 10, cursor: 'pointer' }}><X size={20} color="#475569" /></button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: 8, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {allCategories.filter(c => c !== 'all').map(cat => (
                <div key={`migr-${cat}`} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 16 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={18} color="#6366f1" /> {cat} <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 20 }}>{products.filter(p => p.category === cat).length}</span></h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {products.filter(p => p.category === cat).map(prod => (
                      <div key={prod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '10px 14px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={prod.mainImage} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{prod.name}</div>
                            {prod.sku && <div style={{ fontSize: 11, color: '#64748b' }}>ID: {prod.sku}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Mover a:</span>
                          <select 
                            value="" 
                            onChange={e => handleMigrateSingleProduct(prod.id, e.target.value)}
                            disabled={migratingProductId === prod.id}
                            style={{ width: 140, padding: '8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 600, color: '#334155' }}
                          >
                            <option value="" disabled>{migratingProductId === prod.id ? 'Moviendo...' : 'Seleccionar...'}</option>
                            {allCategories.filter(c => c !== 'all' && c !== cat).map(c => <option key={`opt-${prod.id}-${c}`} value={c}>{c}</option>)}
                            <option value="___new___" style={{ fontWeight: 'bold', color: '#6366f1' }}>+ Nueva Categoría</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {allCategories.filter(c => c !== 'all').length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No hay categorías ni productos disponibles.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
