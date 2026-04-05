'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useImageUpload, UploadedImage } from '@/lib/hooks/useImageUpload'
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
  Share2,
  Heart,
  MessageCircle as MessageCircleIcon,
  Eye as EyeIcon,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Layers,
  Smartphone,
  Bot
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
  
  // New Image management: [{ base64, file, colorLabel, isMain }]
  const [gallery, setGallery] = useState<{ base64: string, file: File | null, colorLabel: string, isMain: boolean }[]>([])

  const [showSuccess, setShowSuccess] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [previewProduct, setPreviewProduct] = useState(false)

  const {
    uploadImages,
    uploadSingleImage,
    uploading,
    progress,
  } = useImageUpload({
    maxFiles: 12,
    onError: (err) => setPublishError(err),
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    'Calzado', 'Ropa', 'Accesorios', 'Electrónica', 'Hogar',
    'Mascotas', 'Artesanía', 'Gorras', 'Alimentos', 'Belleza', 'Deportes', 'Otro',
  ]

  const handleImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const fileArray = Array.from(files)
      fileArray.forEach((file) => {
        const reader = new FileReader()
        reader.onload = () => {
          setGallery((prev) => [
            ...prev,
            { 
              base64: reader.result as string, 
              file, 
              colorLabel: '', 
              isMain: prev.length === 0 
            }
          ])
        }
        reader.readAsDataURL(file)
      })
    }
  }, [])

  const removeImage = (index: number) => {
    setGallery((prev: any[]) => {
      const newGallery = prev.filter((_, i) => i !== index)
      if (prev[index].isMain && newGallery.length > 0) {
        newGallery[0].isMain = true
      }
      return newGallery
    })
  }

  const setAsMain = (index: number) => {
    setGallery((prev: any[]) => prev.map((img, i) => ({ ...img, isMain: i === index })))
  }

  const updateColorLabel = (index: number, val: string) => {
    setGallery((prev: any[]) => prev.map((img, i) => i === index ? { ...img, colorLabel: val } : img))
  }



  const handlePublish = async () => {
    const mainImg = gallery.find(i => i.isMain) || gallery[0]
    if (!productName || !productPrice || !mainImg) {
      setPublishError('Faltan datos obligatorios (Nombre, Precio e Imagen principal)')
      return
    }
    if (!storeId) { setPublishError('Error interno: No se ha detectado el ID de tu tienda.'); return }

    setIsPublishing(true); setPublishError(null)
    trackAction('product_upload_started', JSON.stringify({ name: productName, price: productPrice, category: productCategory, images: gallery.length }))
    try {
      // 1. Upload Main Image
      const mainResult = await uploadSingleImage(mainImg.file!, 'products', storeId)
      if (!mainResult) { setPublishError('Error al subir la imagen principal'); setIsPublishing(false); return }

      // 2. Upload Additional Images
      const additionalFiles = gallery.filter(i => !i.isMain).map(i => i.file).filter(Boolean) as File[]
      let additionalResults: UploadedImage[] = []
      if (additionalFiles.length > 0) {
        additionalResults = await uploadImages(additionalFiles, 'products', storeId)
      }

      // 3. Map Colors to Variants (simplified)
      // We'll create a variant for each image that has a color label, or just one main variant if not.
      // For now, let's just group them by color or create dummy variants for the API compatibility.
      const variantsToSubmit = []
      
      // If user provided colors in the color field, we use them.
      const individualColors = productColors.split(',').map(c => c.trim()).filter(Boolean)
      
      // Standard variant for the main item
      variantsToSubmit.push({
        color: individualColors[0] || 'Original',
        colorHex: '#000000',
        size: productSizes || 'Única',
        type: 'unisex',
        images: [{ fullUrl: mainResult.fullUrl, thumbnailUrl: mainResult.thumbnailUrl }],
        stock: parseInt(productStock) || 1,
        priceModifier: 0,
      })

      // Add variants for other colors/images if they have labels
      const secondaryImages = gallery.filter(i => !i.isMain)
      secondaryImages.forEach((img, idx) => {
        if (img.colorLabel) {
           variantsToSubmit.push({
             color: img.colorLabel,
             colorHex: '#000000',
             size: productSizes || 'Única',
             type: 'unisex',
             images: [{ 
               fullUrl: additionalResults[idx]?.fullUrl || '', 
               thumbnail: additionalResults[idx]?.thumbnailUrl || '' 
             }],
             stock: 5, // Default stock for secondary color if not specified
             priceModifier: 0,
           })
        }
      })

      const productData = {
        storeId, 
        name: productName, 
        description: productDescription,
        price: parseInt(productPrice), 
        discountPrice: productDiscountPrice ? parseInt(productDiscountPrice) : null,
        category: productCategory, 
        productTags: productTags.split(',').map((t) => t.trim()).filter(Boolean),
        mainImage: { fullUrl: mainResult.fullUrl, thumbnailUrl: mainResult.thumbnailUrl },
        additionalImages: additionalResults.map(r => ({ fullUrl: r.fullUrl, thumbnailUrl: r.thumbnailUrl })),
        variants: variantsToSubmit,
      }

      const response = await fetch('/api/products', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(productData) 
      })
      const result = await response.json()
      if (!response.ok) { setPublishError(result.error || 'Error al publicar'); setIsPublishing(false); return }

      setShowSuccess(true)
      setIsPublishing(false)
      trackAction('product_published', JSON.stringify({ name: productName, price: productPrice, category: productCategory, images: gallery.length }))
      setTimeout(() => { setShowSuccess(false); onGoToProducts() }, 2500)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Error inesperado')
      setIsPublishing(false)
      trackAction('product_upload_failed', err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  const mainImg = gallery.find(i => i.isMain) || gallery[0]


  if (previewProduct) {
    return (
      <div className="product-preview-view">
        <div className="breadcrumb">
          <button className="breadcrumb-back" onClick={() => setPreviewProduct(false)}><ArrowLeft size={18} /></button>
          <span className="breadcrumb-item">Subir Producto</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-item active">Vista Previa</span>
        </div>
        <div className="product-detail-layout">
          <div className="product-detail-gallery">
            <div className="product-detail-main-img">{mainImg && <img src={mainImg.base64} alt={productName} />}</div>
            {gallery.length > 1 && (
              <div className="product-detail-thumbnails">
                  {gallery.map((img, i) => (
                    <div key={i} className={`thumb-item ${img.isMain ? 'active' : ''}`}>
                       <img src={img.base64} alt={`Preview ${i}`} />
                       {img.colorLabel && <span className="thumb-label">{img.colorLabel}</span>}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="product-detail-info">
            <span className="product-detail-category">{productCategory || 'Sin categoría'}</span>
            <h2>{productName || 'Nombre del producto'}</h2>
            <p className="product-detail-desc">{productDescription || 'Sin descripción'}</p>
            <div className="product-detail-pricing">
              {productDiscountPrice && <span className="product-detail-original-price">${parseInt(productPrice || '0').toLocaleString()}</span>}
              <span className="product-detail-price">${parseInt(productDiscountPrice || productPrice || '0').toLocaleString()}</span>
            </div>
            
            <div className="product-minimal-info">
               {productSizes && <div className="info-attr"><strong>Tallas:</strong><span>{productSizes}</span></div>}
               {productColors && <div className="info-attr"><strong>Colores:</strong><span>{productColors}</span></div>}
               <div className="info-attr"><strong>Disponibilidad:</strong><span>{productStock} unidades</span></div>
            </div>

            <div className="product-detail-stats-row">
              <div className="stat-box"><ImageIcon size={18} /><span>{gallery.length} imágenes</span></div>
              <div className="stat-box"><Package size={18} /><span>{productStock} en stock</span></div>
            </div>
            <button className="btn-publish" onClick={handlePublish} disabled={isPublishing || uploading}><CheckCircle2 size={18} />Publicar Producto</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-upload-section minimal-upload">
      {showSuccess && (<div className="product-success-toast"><CheckCircle2 size={20} /><span>¡Producto publicado exitosamente!</span></div>)}
      <div className="breadcrumb">
        <button className="breadcrumb-back" onClick={onBack}><ArrowLeft size={18} /></button>
        <span className="breadcrumb-item">Productos</span><ChevronRight size={14} /><span className="breadcrumb-item active">Nuevo Producto</span>
      </div>
      
      <div className="product-upload-grid">
        {/* Left: Images */}
        <div className="product-upload-card gallery-card">
          <div className="card-header">
             <h3><ImageIcon size={18} />Galería de Imágenes</h3>
             <p>La primera será la principal. Añade etiquetas de color.</p>
          </div>
          
          <div className="minimal-gallery-grid">
             {gallery.map((img, idx) => (
               <div key={idx} className={`gallery-item-minimal ${img.isMain ? 'is-main' : ''}`}>
                  <img src={img.base64} alt="Product" />
                  <div className="gallery-item-actions">
                      <button onClick={() => removeImage(idx)} className="btn-icon-danger"><Trash2 size={14} /></button>
                      {!img.isMain && <button onClick={() => setAsMain(idx)} className="btn-icon-minimal"><Check size={14} /></button>}
                  </div>
                  <div className="gallery-item-overlay">
                      <input 
                        type="text" 
                        placeholder="Color (ej: Azul)" 
                        value={img.colorLabel} 
                        onChange={(e) => updateColorLabel(idx, e.target.value)}
                        className="color-label-input"
                      />
                  </div>
                  {img.isMain && <span className="main-badge">Principal</span>}
               </div>
             ))}
             
             <div className="gallery-add-item" onClick={() => fileInputRef.current?.click()}>
                <Plus size={32} />
                <span>Añadir Imagen</span>
             </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImagesChange} style={{ display: 'none' }} />
        </div>

        {/* Right: Info */}
        <div className="product-upload-card info-card">
           <div className="card-header">
              <h3><Tag size={18} />Información del Producto</h3>
           </div>
           
           <div className="minimal-form">
              <div className="form-field-minimal">
                 <label>Nombre del Producto</label>
                 <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ej: Zapatillas Urbanas Pro" className="min-input" />
              </div>
              
              <div className="form-row-minimal">
                 <div className="form-field-minimal">
                    <label>Precio</label>
                    <div className="input-prefix-wrapper"><span className="prefix">$</span><input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="0" className="min-input" /></div>
                 </div>
                 <div className="form-field-minimal">
                    <label>Oferta (Opcional)</label>
                    <div className="input-prefix-wrapper"><span className="prefix">$</span><input type="number" value={productDiscountPrice} onChange={(e) => setProductDiscountPrice(e.target.value)} placeholder="0" className="min-input" /></div>
                 </div>
              </div>

              <div className="form-field-minimal">
                 <label>Descripción</label>
                 <textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} placeholder="Escribe detalles sobre el producto..." className="min-textarea" rows={3} />
              </div>

              <div className="form-field-minimal">
                 <label>Categoría</label>
                 <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="min-select">
                    <option value="">Seleccionar...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>

              <div className="form-row-minimal">
                 <div className="form-field-minimal">
                    <label>Tallas (como texto)</label>
                    <input type="text" value={productSizes} onChange={(e) => setProductSizes(e.target.value)} placeholder="S, M, L, XL" className="min-input" />
                 </div>
                 <div className="form-field-minimal">
                    <label>Colores (como texto)</label>
                    <input type="text" value={productColors} onChange={(e) => setProductColors(e.target.value)} placeholder="Azul, Negro, Blanco" className="min-input" />
                 </div>
              </div>

              <div className="form-field-minimal">
                 <label>Stock Total</label>
                 <input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} className="min-input" />
              </div>

              <div className="form-field-minimal">
                 <label>Etiquetas (Separadas por coma)</label>
                 <input type="text" value={productTags} onChange={(e) => setProductTags(e.target.value)} placeholder="moda, deportivo, oferta" className="min-input" />
              </div>

              <div className="minimal-actions">
                 <button className="btn-minimal-preview" onClick={() => setPreviewProduct(true)} disabled={!productName || gallery.length === 0}><Eye size={16} /> Vista Previa</button>
                 <button className="btn-minimal-publish" onClick={handlePublish} disabled={!productName || !productPrice || gallery.length === 0 || isPublishing || uploading}>
                    {isPublishing || uploading ? (<><Loader2 size={16} className="spinning" /> Publicando...</>) : (<><Upload size={16} /> Publicar Producto</>)}
                 </button>
              </div>

              {(uploading || isPublishing) && (
                <div className="minimal-upload-progress">
                   <div className="progress-info"><span>Subiendo catálogo...</span><span>{progress.percent}%</span></div>
                   <div className="progress-track"><div className="progress-fill" style={{ width: `${progress.percent}%` }} /></div>
                </div>
              )}

              {publishError && (<div className="minimal-error-bar"><AlertCircle size={16} /><span>{publishError}</span></div>)}
           </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PRODUCT LIST SECTION                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function ProductListSection({
  onBack,
  onAddProduct,
  storeId,
}: {
  onBack: () => void
  onAddProduct: () => void
  storeId: string | null
}) {
  const [products, setProducts] = useState<DashboardProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<DashboardProduct | null>(null)
  const [activeVariantImg, setActiveVariantImg] = useState<string | null>(null)
  const [shareToast, setShareToast] = useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true
    async function fetchProducts() {
      if (!storeId) { if (isMounted) { setProducts([]); setIsLoading(false) }; return }
      try {
        const res = await fetch(`/api/products?storeId=${storeId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && isMounted) {
            type DbImage = { thumbnail?: string; full?: string }
            type DbVariant = { id: string; color: string; color_hex: string; size: string; type: string; images?: DbImage[]; stock: number; price_modifier: number }
            type DbProduct = { id: string; name: string; description?: string; price: number; discount_price?: number; images?: DbImage[]; category_id?: string; product_variants?: DbVariant[]; is_active: boolean; created_at: string }

            const mapped = data.products.map((p: DbProduct) => ({
              id: p.id, name: p.name, description: p.description || '', price: p.price, discountPrice: p.discount_price,
              mainImage: p.images?.[0]?.thumbnail || p.images?.[0]?.full || '',
              category: p.category_id || 'Sin categoría',
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

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const allCategories = ['all', ...new Set(products.map((p) => p.category))]

  if (selectedProduct) {
    const allVariantImages = selectedProduct.variants.flatMap((v) =>
      v.images.map((img) => ({ img, color: v.color, size: v.size, type: v.type }))
    )
    const displayImage = activeVariantImg || selectedProduct.mainImage

    return (
      <div className="product-detail-view">
        <div className="breadcrumb">
          <button className="breadcrumb-back" onClick={() => { setSelectedProduct(null); setActiveVariantImg(null) }}><ArrowLeft size={18} /></button>
          <span className="breadcrumb-item">Mis Productos</span><ChevronRight size={14} /><span className="breadcrumb-item active">{selectedProduct.name}</span>
        </div>
        <div className="product-detail-layout">
          <div className="product-detail-gallery">
            <div className="product-detail-main-img">
              <img src={displayImage} alt={selectedProduct.name} />
              {selectedProduct.discountPrice && <span className="detail-discount-badge">-{Math.round(((selectedProduct.price - selectedProduct.discountPrice) / selectedProduct.price) * 100)}%</span>}
            </div>
            <div className="product-detail-thumbnails">
              <div className={`thumb-item ${!activeVariantImg ? 'active' : ''}`} onClick={() => setActiveVariantImg(null)}><img src={selectedProduct.mainImage} alt="Principal" /><span className="thumb-label">Principal</span></div>
              {allVariantImages.map((v, i) => <div key={i} className={`thumb-item ${activeVariantImg === v.img ? 'active' : ''}`} onClick={() => setActiveVariantImg(v.img)}><img src={v.img} alt={`${v.color} ${v.size}`} /><span className="thumb-label">{v.color}</span></div>)}
            </div>
          </div>
          <div className="product-detail-info">
            <div className="detail-top-row"><span className="product-detail-category">{selectedProduct.category}</span><span className={`product-status ${selectedProduct.isActive ? 'active' : 'inactive'}`}>{selectedProduct.isActive ? '● Activo' : '○ Inactivo'}</span></div>
            <h2>{selectedProduct.name}</h2>
            <p className="product-detail-desc">{selectedProduct.description}</p>
            <div className="product-detail-pricing">{selectedProduct.discountPrice && <span className="product-detail-original-price">${selectedProduct.price.toLocaleString()}</span>}<span className="product-detail-price">${(selectedProduct.discountPrice || selectedProduct.price).toLocaleString()}</span></div>
            <h4 className="product-detail-section-title"><Layers size={16} />Variantes ({selectedProduct.variants.length})</h4>
            <div className="product-detail-variants">
              {selectedProduct.variants.map((v) => (
                <div key={v.id} className="product-detail-variant-card" onClick={() => setActiveVariantImg(v.images[0] ?? null)}>
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
            <button className="btn-share-community" onClick={() => { setShareToast(selectedProduct.name); setTimeout(() => setShareToast(null), 3000) }}><Share2 size={18} />Compartir en Comunidad</button>
            <div className="community-stats-card">
              <h4 className="community-stats-title"><Share2 size={16} />Estadísticas</h4>
              <div className="community-stats-grid">
                <div className="community-stat"><Heart size={20} color="#e74c3c" /><span className="community-stat-value">—</span><span className="community-stat-label">Me gusta</span></div>
                <div className="community-stat"><MessageCircleIcon size={20} color="#5eb5f7" /><span className="community-stat-value">—</span><span className="community-stat-label">Comentarios</span></div>
                <div className="community-stat"><EyeIcon size={20} color="#f39c12" /><span className="community-stat-value">—</span><span className="community-stat-label">Vistas</span></div>
                <div className="community-stat"><ExternalLink size={20} color="#4dcd5e" /><span className="community-stat-value">—</span><span className="community-stat-label">Visitas tienda</span></div>
              </div>
            </div>
          </div>
        </div>
        {shareToast && <div className="share-toast"><CheckCircle2 size={18} /><span>&quot;{shareToast}&quot; compartido en la Comunidad</span></div>}
      </div>
    )
  }

  return (
    <div className="product-list-section">
      <div className="breadcrumb">
        <button className="breadcrumb-back" onClick={onBack}><ArrowLeft size={18} /></button>
        <span className="breadcrumb-item">Productos</span><ChevronRight size={14} /><span className="breadcrumb-item active">Todos los Productos</span>
      </div>

      {/* --- TELEGRAM BANNER --- */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-[2rem] p-6 sm:p-8 mb-8 shadow-xl shadow-purple-500/20 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10">
           <h3 className="text-xl sm:text-2xl font-black mb-2 flex items-center gap-2">
             <Bot className="text-blue-200" size={28} />
             ¡Sube productos desde Telegram con IA!
           </h3>
           <p className="text-sm sm:text-base text-blue-100 font-medium max-w-2xl leading-relaxed">
             No pierdas tiempo llenando formularios. Abre el chat de nuestro bot oficial <strong>@Localecomerbot</strong>, envíale la foto de tu producto, escribe el precio y la descripción, y nuestra IA lo publicará automáticamente en este catálogo por ti.
           </p>
        </div>
        <a href="https://t.me/Localecomerbot" target="_blank" rel="noopener noreferrer" className="relative z-10 bg-white text-blue-700 px-6 sm:px-8 py-4 rounded-xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2 shrink-0">
           <Smartphone size={18} /> ABRIR EN TELEGRAM
        </a>
      </div>
      {/* ---------------------- */}
      <div className="products-topbar">
        <div className="products-search-wrapper"><Search size={18} /><input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="products-search-input" /></div>
        <button className="btn-add-new-product" onClick={onAddProduct}><Plus size={18} /><span>Subir Producto</span></button>
      </div>
      <div className="products-filters">
        {allCategories.map((cat) => <button key={cat} className={`filter-chip ${filterCategory === cat ? 'active' : ''}`} onClick={() => setFilterCategory(cat)}>{cat === 'all' ? 'Todos' : cat}</button>)}
      </div>
      {isLoading ? (
        <div className="products-empty"><Loader2 size={48} className="spinning" style={{ marginBottom: 16 }} /><h3>Cargando productos...</h3></div>
      ) : filteredProducts.length === 0 ? (
        <div className="products-empty"><Package size={64} /><h3>No hay productos</h3><p>Sube tu primer producto para verlo aquí</p><button className="btn-add-new-product" onClick={onAddProduct}><Plus size={18} />Subir Producto</button></div>
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
