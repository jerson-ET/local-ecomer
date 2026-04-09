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
} from 'lucide-react'

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
  isActive: boolean
  createdAt: string
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
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = ['Calzado', 'Ropa', 'Accesorios', 'Electrónica', 'Hogar', 'Mascotas', 'Artesanía', 'Gorras', 'Alimentos', 'Belleza', 'Deportes', 'Otro']

  const handleImagesChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (!storeId) { setPublishError('Error: No se detectó el ID de la tienda.'); return }
    setPublishError(null)

    for (const file of Array.from(files)) {
      const localPreview = URL.createObjectURL(file)
      const newImg: GalleryImage = {
        preview: localPreview, colorLabel: '', isMain: gallery.length === 0 && Array.from(files).indexOf(file) === 0,
        status: 'uploading', progress: 0, fullUrl: null, thumbnailUrl: null, errorMsg: null,
      }
      setGallery(prev => [...prev, newImg])

      uploadFileToR2(file, 'products', storeId, (pct) => {
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
    if (!storeId) { setPublishError('Error: No se detectó la tienda'); return }

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

      const response = await fetch('/api/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId, name: productName, description: productDescription, price: parseInt(productPrice),
          discountPrice: productDiscountPrice ? parseInt(productDiscountPrice) : null,
          category: productCategory, productTags: productTags.split(',').map(t => t.trim()).filter(Boolean),
          mainImage: { fullUrl: mainImgData.fullUrl!, thumbnailUrl: mainImgData.thumbnailUrl! },
          additionalImages: additionalImgs.map(r => ({ fullUrl: r.fullUrl!, thumbnailUrl: r.thumbnailUrl! })),
          variants: variantsToSubmit,
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
              <div className="form-field-minimal"><label>Precio</label><div className="input-prefix-wrapper"><span className="prefix">$</span><input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="0" className="min-input" /></div></div>
              <div className="form-field-minimal"><label>Oferta (Opcional)</label><div className="input-prefix-wrapper"><span className="prefix">$</span><input type="number" value={productDiscountPrice} onChange={(e) => setProductDiscountPrice(e.target.value)} placeholder="0" className="min-input" /></div></div>
            </div>
            <div className="form-field-minimal"><label>Descripción</label><textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} placeholder="Detalles del producto..." className="min-textarea" rows={3} /></div>
            <div className="form-field-minimal"><label>Categoría</label><select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="min-select"><option value="">Seleccionar...</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="form-row-minimal">
              <div className="form-field-minimal"><label>Tallas</label><input type="text" value={productSizes} onChange={(e) => setProductSizes(e.target.value)} placeholder="S, M, L, XL" className="min-input" /></div>
              <div className="form-field-minimal"><label>Colores</label><input type="text" value={productColors} onChange={(e) => setProductColors(e.target.value)} placeholder="Azul, Negro" className="min-input" /></div>
            </div>
            <div className="form-field-minimal"><label>Stock Total</label><input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} className="min-input" /></div>
            <div className="form-field-minimal"><label>Etiquetas</label><input type="text" value={productTags} onChange={(e) => setProductTags(e.target.value)} placeholder="moda, deportivo" className="min-input" /></div>
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
}: {
  onBack: () => void
  onAddProduct: () => void
  storeId: string | null
  storeSlug?: string | null
}) {
  const [products, setProducts] = useState<DashboardProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<DashboardProduct | null>(null)

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
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState(false)

  /* Estado de subida de imágenes adicionales */
  const [editImages, setEditImages] = useState<{ full: string; thumbnail: string; isMain: boolean }[]>([])
  const [uploadingNewImage, setUploadingNewImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const categories = ['Calzado', 'Ropa', 'Accesorios', 'Electrónica', 'Hogar', 'Mascotas', 'Artesanía', 'Gorras', 'Alimentos', 'Belleza', 'Deportes', 'Otro']

  /* ─── Cargar productos ─── */
  React.useEffect(() => {
    let isMounted = true
    async function fetchProducts() {
      if (!storeId) { if (isMounted) { setProducts([]); setIsLoading(false) }; return }
      try {
        const res = await fetch(`/api/products?storeId=${storeId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && isMounted) {
            type DbImage = { thumbnail?: string; full?: string; isMain?: boolean }
            type DbVariant = { id: string; color: string; color_hex: string; size: string; type: string; images?: DbImage[]; stock: number; price_modifier: number }
            type DbProduct = { id: string; name: string; description?: string; price: number; discount_price?: number; images?: DbImage[]; category_id?: string; product_variants?: DbVariant[]; is_active: boolean; created_at: string }
            const mapped = data.products.map((p: DbProduct) => ({
              id: p.id, name: p.name, description: p.description || '', price: p.price, discountPrice: p.discount_price,
              mainImage: p.images?.[0]?.thumbnail || p.images?.[0]?.full || '',
              category: p.category_id || 'Sin categoría',
              rawImages: p.images || [],
              variants: (p.product_variants || []).map((v: DbVariant) => ({
                id: v.id, color: v.color, colorHex: v.color_hex, size: v.size, type: v.type,
                images: v.images?.map((img: DbImage) => img.thumbnail || img.full) || [],
                uploadedImages: [], stock: v.stock, priceModifier: v.price_modifier,
              })),
              isActive: p.is_active, createdAt: p.created_at,
            }))
            setProducts(mapped)
          }
        }
      } catch (err) { console.error('Error fetching products', err) }
      finally { if (isMounted) setIsLoading(false) }
    }
    fetchProducts()
    return () => { isMounted = false }
  }, [storeId])

  /* ─── Iniciar edición ─── */
  const startEditing = (product: DashboardProduct) => {
    setEditName(product.name)
    setEditDescription(product.description)
    setEditPrice(String(product.price))
    setEditDiscountPrice(product.discountPrice ? String(product.discountPrice) : '')
    setEditCategory(product.category)
    setEditStock(String(product.variants.reduce((acc, v) => acc + v.stock, 0)))
    setEditSizes(product.variants.map(v => v.size).filter((v, i, arr) => arr.indexOf(v) === i).join(', '))
    setEditColors(product.variants.map(v => v.color).filter((v, i, arr) => arr.indexOf(v) === i).join(', '))
    setEditImages(product.rawImages || [])
    setIsEditing(true)
    setEditError(null)
    setEditSuccess(false)
  }

  /* ─── Guardar edición ─── */
  const handleSaveEdit = async () => {
    if (!selectedProduct || !storeId) return
    setIsSaving(true); setEditError(null)

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
          storeId,
          name: editName,
          description: editDescription,
          price: parseInt(editPrice),
          discountPrice: editDiscountPrice ? parseInt(editDiscountPrice) : null,
          category: editCategory,
          stock: parseInt(editStock) || 10,
          images: editImages,
          variants,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setEditError(data.error || 'Error al guardar'); setIsSaving(false); return
      }

      setEditSuccess(true)
      setIsEditing(false)
      setIsSaving(false)

      /* Actualizar producto en la lista local */
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? {
        ...p, name: editName, description: editDescription, price: parseInt(editPrice),
        discountPrice: editDiscountPrice ? parseInt(editDiscountPrice) : null,
        category: editCategory, mainImage: editImages[0]?.thumbnail || editImages[0]?.full || p.mainImage,
        rawImages: editImages,
      } : p))

      /* Actualizar selectedProduct */
      setSelectedProduct(prev => prev ? {
        ...prev, name: editName, description: editDescription, price: parseInt(editPrice),
        discountPrice: editDiscountPrice ? parseInt(editDiscountPrice) : null,
        category: editCategory, mainImage: editImages[0]?.thumbnail || editImages[0]?.full || prev.mainImage,
        rawImages: editImages,
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
    if (!file || !storeId) return
    e.target.value = ''

    setUploadingNewImage(true); setUploadProgress(0)

    try {
      const { fullUrl, thumbnailUrl } = await uploadFileToR2(file, 'products', storeId, (pct) => setUploadProgress(pct))
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
    const allVariantImages = selectedProduct.variants.flatMap((v) => v.images.map((img) => ({ img, color: v.color })))

    return (
      <div className="product-detail-view">
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div className="breadcrumb">
          <button className="breadcrumb-back" onClick={() => { setSelectedProduct(null); setIsEditing(false) }}><ArrowLeft size={18} /></button>
          <span className="breadcrumb-item">Mis Productos</span><ChevronRight size={14} /><span className="breadcrumb-item active">{selectedProduct.name}</span>
        </div>

        <div className="product-detail-layout">
          {/* ─── Galería ─── */}
          <div className="product-detail-gallery">
            <div className="product-detail-main-img">
              <img src={isEditing && editImages[0] ? (editImages[0].full || editImages[0].thumbnail) : selectedProduct.mainImage} alt={selectedProduct.name} />
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
              <div className="product-detail-thumbnails">
                <div className="thumb-item active"><img src={selectedProduct.mainImage} alt="Principal" /><span className="thumb-label">Principal</span></div>
                {allVariantImages.map((v, i) => <div key={i} className="thumb-item"><img src={v.img} alt={v.color} /><span className="thumb-label">{v.color}</span></div>)}
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
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Precio</label><input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Oferta</label><input type="number" value={editDiscountPrice} onChange={(e) => setEditDiscountPrice(e.target.value)} placeholder="Opcional" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} /></div>
                </div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Categoría</label><select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }}><option value="">Seleccionar...</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Tallas</label><input type="text" value={editSizes} onChange={(e) => setEditSizes(e.target.value)} placeholder="S, M, L" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Colores</label><input type="text" value={editColors} onChange={(e) => setEditColors(e.target.value)} placeholder="Azul, Negro" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} /></div>
                </div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Stock Total</label><input type="number" value={editStock} onChange={(e) => setEditStock(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} /></div>

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
                <div className="detail-top-row"><span className="product-detail-category">{selectedProduct.category}</span><span className={`product-status ${selectedProduct.isActive ? 'active' : 'inactive'}`}>{selectedProduct.isActive ? '● Activo' : '○ Inactivo'}</span></div>
                <h2>{selectedProduct.name}</h2>
                <p className="product-detail-desc">{selectedProduct.description || 'Sin descripción'}</p>
                <div className="product-detail-pricing">{selectedProduct.discountPrice && <span className="product-detail-original-price">${selectedProduct.price.toLocaleString()}</span>}<span className="product-detail-price">${(selectedProduct.discountPrice || selectedProduct.price).toLocaleString()}</span></div>

                <h4 className="product-detail-section-title"><Layers size={16} />Variantes ({selectedProduct.variants.length})</h4>
                <div className="product-detail-variants">
                  {selectedProduct.variants.map((v) => (
                    <div key={v.id} className="product-detail-variant-card">
                      <div className="variant-card-header"><span className="variant-color-dot-lg" style={{ background: v.colorHex }} /><div><strong>{v.color}</strong><span className="variant-meta">Talla {v.size} · {v.type}</span></div></div>
                      <div className="variant-card-images">{v.images.map((img, i) => <img key={i} src={img} alt={`${v.color} ${i}`} />)}</div>
                      <div className="variant-card-footer"><span>Stock: {v.stock}</span>{v.priceModifier !== 0 && <span className={v.priceModifier > 0 ? 'price-up' : 'price-down'}>{v.priceModifier > 0 ? '+' : ''}${Math.abs(v.priceModifier).toLocaleString()}</span>}</div>
                    </div>
                  ))}
                </div>

                <div className="product-detail-stats-row">
                  <div className="stat-box"><ImageIcon size={18} /><span>{selectedProduct.variants.reduce((acc, v) => acc + v.images.length, 0) + 1} imágenes</span></div>
                  <div className="stat-box"><Layers size={18} /><span>{selectedProduct.variants.length} variantes</span></div>
                  <div className="stat-box"><Package size={18} /><span>{selectedProduct.variants.reduce((acc, v) => acc + v.stock, 0)} en stock</span></div>
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
        <button className="btn-add-new-product" onClick={onAddProduct}><Plus size={18} /><span>Subir</span></button>
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
                <img src={product.mainImage} alt={product.name} />
                {product.discountPrice && <span className="product-card-discount">-{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%</span>}
                <span className={`product-card-status ${product.isActive ? 'active' : 'inactive'}`}>{product.isActive ? 'Activo' : 'Inactivo'}</span>
                <div className="product-card-variants-badge"><Layers size={12} />{product.variants.length}</div>
              </div>
              <div className="product-card-body">
                <span className="product-card-category">{product.category}</span>
                <h4 className="product-card-name">{product.name}</h4>
                <div className="product-card-pricing">
                  {product.discountPrice ? (<><span className="product-card-old-price">${product.price.toLocaleString()}</span><span className="product-card-price">${product.discountPrice.toLocaleString()}</span></>) : (<span className="product-card-price">${product.price.toLocaleString()}</span>)}
                </div>
                <div className="product-card-colors">{product.variants.map((v) => <span key={v.id} className="product-card-color-dot" style={{ background: v.colorHex }} title={`${v.color} - ${v.size}`} />)}</div>
                <div className="product-card-meta"><span><ImageIcon size={12} />{product.variants.reduce((acc, v) => acc + v.images.length, 0) + 1}</span><span><Package size={12} />{product.variants.reduce((acc, v) => acc + v.stock, 0)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
