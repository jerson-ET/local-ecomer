'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Sparkles,
  Upload,
  CheckCircle2,
  Loader2,
  AlertCircle,
  MessageCircle as MessageCircleIcon,
  Star,
  Zap,
  Eye,
  Check,
  Package,
  RefreshCw,
  ExternalLink,
  Eye as EyeIcon,
  Trash2,
  DollarSign,
  X,
  ImageIcon,
} from 'lucide-react'
import { useImageUpload } from '@/lib/hooks/useImageUpload'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  STORE TEMPLATES                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const storeTemplates = [
  {
    id: 'store-minimal',
    name: 'Vendedor Minimalista',
    description: 'Catálogo ultra limpio con enfoque en productos físicos.',
    category: 'Productos',
    colors: ['#FFFFFF', '#F8FAFC', '#E2E8F0', '#1E293B'],
    features: ['Diseño Minimalista Claro', 'Enfoque en Producto', 'Checkout Rápido', 'Optimizado para Móvil'],
    popular: true,
    rating: 5.0,
    uses: '1.2k',
    storeUrl: '/store/minimal',
    previewImage: '',
  },
]

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  COMPONENTE: Slot individual de banner                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface BannerSlotProps {
  index: number
  label: string
  preview: string | null
  isUploading: boolean
  uploadProgress: number
  onFileSelect: (file: File) => void
  onRemove: () => void
}

function BannerSlot({ index, label, preview, isUploading, uploadProgress, onFileSelect, onRemove }: BannerSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
      /* Reset input para poder seleccionar el mismo archivo de nuevo */
      e.target.value = ''
    }
  }

  return (
    <div style={{
      flex: 1,
      minWidth: '140px',
      position: 'relative',
    }}>
      <label style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#64748b',
        marginBottom: '8px',
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {label}
      </label>

      <div
        onClick={() => !preview && !isUploading && inputRef.current?.click()}
        style={{
          width: '100%',
          height: '140px',
          border: preview ? '2px solid #22c55e' : '2px dashed #cbd5e1',
          borderRadius: '16px',
          cursor: preview ? 'default' : 'pointer',
          overflow: 'hidden',
          position: 'relative',
          background: preview ? '#000' : '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
      >
        {isUploading ? (
          /* Estado: Subiendo */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Loader2 size={28} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>
              {uploadProgress < 50 ? 'Convirtiendo a WebP...' : 'Subiendo a R2...'}
            </span>
            <div style={{
              width: '80%',
              height: '4px',
              background: '#e2e8f0',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        ) : preview ? (
          /* Estado: Imagen subida */
          <>
            <img
              src={preview}
              alt={`Banner ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Badge de éxito */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: '#22c55e',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <CheckCircle2 size={10} /> WebP
            </div>
            {/* Botón eliminar */}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                border: 'none',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={14} />
            </button>
            {/* Botón cambiar */}
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              Cambiar
            </button>
          </>
        ) : (
          /* Estado: Vacío */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#f1f5f9',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ImageIcon size={24} color="#94a3b8" />
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
              Toca para subir
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CREATE STORE SECTION                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CreateStoreSection({ onBack, store }: { onBack: () => void; store?: any }) {
  const router = useRouter()
  const isUpdating = !!store
  const [step, setStep] = useState(1)

  /* ─── Info de tienda ─── */
  const [storeName, setStoreName] = useState(store?.name || '')
  const [storeSlug, setStoreSlug] = useState(store?.slug || '')

  /* ─── Extraer config existente si hay ─── */
  let initialWhatsapp = store?.whatsapp_number || ''
  let initialLocation = store?.shipping_location || ''
  let initialDescription = store?.description || ''
  let initialBannerUrls: string[] = []
  let initialFooter = ''
  let initialInsta = ''
  let initialFb = ''

  if (store?.banner_url && typeof store.banner_url === 'string' && store.banner_url.startsWith('{')) {
    try {
      const config = JSON.parse(store.banner_url)
      initialWhatsapp = config.whatsappNumber || initialWhatsapp
      initialLocation = config.shippingLocation || initialLocation
      initialBannerUrls = config.customUrls || (config.customUrl ? [config.customUrl] : [])
      initialFooter = config.footerInfo || ''
      initialInsta = config.socialInstagram || ''
      initialFb = config.socialFacebook || ''
    } catch (e) {
      console.error('Error parsing store config', e)
    }
  }

  const [storeWhatsapp, setStoreWhatsapp] = useState(initialWhatsapp)
  const [storeLocation, setStoreLocation] = useState(initialLocation)
  const [footerInfo, setFooterInfo] = useState(initialFooter)
  const [socialFacebook, setSocialFacebook] = useState(initialFb)
  const [socialInstagram, setSocialInstagram] = useState(initialInsta)
  const [storeDescription, setStoreDescription] = useState(initialDescription)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  /* ─── Banner: 3 slots individuales con URLs de R2 ─── */
  const [bannerUrls, setBannerUrls] = useState<(string | null)[]>([
    initialBannerUrls[0] || null,
    initialBannerUrls[1] || null,
    initialBannerUrls[2] || null,
  ])
  const [bannerUploading, setBannerUploading] = useState<boolean[]>([false, false, false])
  const [bannerProgress, setBannerProgress] = useState<number[]>([0, 0, 0])
  const [bannerError, setBannerError] = useState<string | null>(null)

  /* ─── Hook de upload para banners ─── */
  const { uploadSingleImage } = useImageUpload({
    maxFiles: 1,
    onError: (err) => setBannerError(err),
  })

  /* ─── Productos iniciales ─── */
  const [initialProducts, setInitialProducts] = useState([
    { name: '', price: '', description: '', colors: '', sizes: '', images: [] as File[], previews: [] as string[] },
    { name: '', price: '', description: '', colors: '', sizes: '', images: [] as File[], previews: [] as string[] },
    { name: '', price: '', description: '', colors: '', sizes: '', images: [] as File[], previews: [] as string[] },
  ])

  /* ─── Hook de upload para productos ─── */
  const productUpload = useImageUpload({
    maxFiles: 10,
    onError: (err) => setCreateError(err),
  })

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  HANDLERS: Banner upload                                               */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const handleBannerUpload = async (slotIndex: number, file: File) => {
    setBannerError(null)

    /* Marcar slot como subiendo */
    setBannerUploading(prev => { const n = [...prev]; n[slotIndex] = true; return n })
    setBannerProgress(prev => { const n = [...prev]; n[slotIndex] = 0; return n })

    /* Simular progreso */
    let pct = 0
    const interval = setInterval(() => {
      pct = Math.min(pct + 5, 90)
      setBannerProgress(prev => { const n = [...prev]; n[slotIndex] = pct; return n })
    }, 300)

    try {
      const result = await uploadSingleImage(file, 'banners', storeSlug || `store-${Date.now()}`)

      clearInterval(interval)

      if (!result) {
        setBannerError(`Error al subir imagen ${slotIndex + 1}`)
        setBannerUploading(prev => { const n = [...prev]; n[slotIndex] = false; return n })
        return
      }

      /* Guardar URL de R2 */
      setBannerUrls(prev => {
        const n = [...prev]
        n[slotIndex] = result.fullUrl
        return n
      })
      setBannerProgress(prev => { const n = [...prev]; n[slotIndex] = 100; return n })
    } catch {
      clearInterval(interval)
      setBannerError(`Error al subir imagen ${slotIndex + 1}`)
    } finally {
      setBannerUploading(prev => { const n = [...prev]; n[slotIndex] = false; return n })
    }
  }

  const handleBannerRemove = (slotIndex: number) => {
    setBannerUrls(prev => {
      const n = [...prev]
      n[slotIndex] = null
      return n
    })
    setBannerProgress(prev => { const n = [...prev]; n[slotIndex] = 0; return n })
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  HANDLERS: Productos                                                   */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const handleProductImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      const newProducts = [...initialProducts]
      const prod = newProducts[index]
      if (prod) {
        prod.images = [...prod.images, ...files].slice(0, 4)
        prod.previews = prod.images.map(f => URL.createObjectURL(f))
      }
      setInitialProducts(newProducts)
    }
  }

  const handleProductChange = (index: number, field: 'name' | 'price' | 'description' | 'colors' | 'sizes', value: string) => {
    const newProducts = [...initialProducts]
    const prod = newProducts[index]
    if (prod) prod[field] = value
    setInitialProducts(newProducts)
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  HANDLERS: Navegación y creación                                       */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const handleStoreNameChange = (value: string) => {
    setStoreName(value)
    setStoreSlug(value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'))
  }

  const handleContinueToTemplates = () => {
    if (storeName.trim().length >= 3 && storeWhatsapp.trim().length >= 7) setStep(2)
  }

  const handleCreateStore = async () => {
    const tmpl = storeTemplates[0]!
    setIsCreating(true)
    setCreateError(null)

    try {
      /* ─── Las URLs de banner ya están subidas a R2 ─── */
      const uploadedBannerUrls = bannerUrls.filter((u): u is string => u !== null)
      const uploadedBannerUrl = uploadedBannerUrls[0] || undefined

      /* ─── Crear/actualizar tienda ─── */
      const res = await fetch(isUpdating ? '/api/stores/update' : '/api/stores', {
        method: isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store?.id,
          name: storeName,
          slug: storeSlug,
          templateId: tmpl.id,
          templateUrl: tmpl.storeUrl,
          themeColor: tmpl.colors[2] || '#6366f1',
          description: storeDescription.trim() || `Catálogo de ${storeName}`,
          footerInfo,
          socialFacebook,
          socialInstagram,
          whatsappNumber: storeWhatsapp,
          shippingLocation: storeLocation,
          bannerUrl: uploadedBannerUrl,
          bannerUrls: uploadedBannerUrls,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error + (data.details ? `: ${data.details}` : ''))
        setIsCreating(false)
        return
      }

      /* Usar el ID retornado por la API o el ID de la tienda que estamos editando */
      const newStoreId = data.store?.id || store?.id || data.id
      
      if (!newStoreId) {
        throw new Error('No se pudo identificar el ID de la tienda para subir productos.')
      }

      /* ─── Subir productos iniciales ─── */
      for (const prod of initialProducts) {
        if (prod.name.trim() && prod.price.trim()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let mainImg = null; let additionalImgs: any[] = []

          if (prod.images.length > 0) {
            /* Subir imágenes del producto a R2 */
            const pFormData = new FormData()
            prod.images.forEach(img => pFormData.append('images', img))
            pFormData.append('folder', 'products')
            pFormData.append('resourceId', newStoreId)

            const pRes = await fetch('/api/upload/images', { method: 'POST', body: pFormData })
            if (pRes.ok) {
              const pData = await pRes.json()
              if (pData.images?.length > 0) {
                mainImg = { fullUrl: pData.images[0].fullUrl, thumbnailUrl: pData.images[0].thumbnailUrl }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                additionalImgs = pData.images.slice(1).map((img: any) => ({
                  fullUrl: img.fullUrl,
                  thumbnailUrl: img.thumbnailUrl,
                }))
              }
            }
          }

          /* Solo intentar crear el producto si tiene al menos una imagen subida o seleccionada */
          if (!mainImg) {
            console.warn(`[CATALOGO] Ignorando producto "${prod.name}" porque no tiene imagen principal asignada.`)
            continue
          }

          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storeId: newStoreId,
              name: prod.name,
              price: parseFloat(prod.price) || 0,
              description: prod.description || '',
              category: 'General',
              stock: 100,
              is_active: true,
              mainImage: mainImg || { fullUrl: '', thumbnailUrl: '' },
              additionalImages: additionalImgs,
              variants: prod.colors
                ? prod.colors.split(',').map(c => ({
                    color: c.trim(),
                    colorHex: '#000',
                    size: prod.sizes || '',
                    type: 'color',
                    stock: 10,
                    priceModifier: 0,
                    images: [],
                  }))
                : [],
            }),
          })
        }
      }

      setCreateSuccess(true)
      setTimeout(() => router.push(`/tienda/${storeSlug}`), 1800)
    } catch (err: any) {
      console.error('Error in handleCreateStore:', err)
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setCreateError(`Error: ${errorMsg}. Por favor, intenta de nuevo.`)
      setIsCreating(false)
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const bannerLabels = ['Subir primera imagen', 'Subir segunda imagen', 'Subir tercera imagen']

  return (
    <div className="create-store-section premium-flow">
      {/* Estilos para animación de spin */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="premium-breadcrumb">
        <button className="premium-back-btn" onClick={onBack}><ArrowLeft size={20} /><span>Volver</span></button>
        <div className="premium-step-indicator"><span className={`step-dot ${step >= 1 ? 'active' : ''}`} /><span className={`step-line ${step >= 2 ? 'active' : ''}`} /><span className={`step-dot ${step >= 2 ? 'active' : ''}`} /></div>
        <div className="premium-step-text">Paso {step} de 2</div>
      </div>

      {step === 1 && (
        <div className="premium-step-container step-anim-enter">
          <div className="premium-hero-header">
            <div className="glow-icon"><Sparkles size={40} /></div>
            <h1 className="hero-title">{isUpdating ? 'Actualiza tu catálogo' : 'Crea catálogo de productos'}</h1>
            <p className="hero-subtitle">{isUpdating ? 'Modifica los datos de tu tienda digital.' : 'Dale un nombre único y memorable a tu tienda digital.'}</p>
          </div>
          <div className="premium-form-card">
            <div className="premium-input-group"><label>Nombre de tu Tienda</label><input type="text" className="premium-input massive-input" placeholder="Escribe el nombre..." value={storeName} onChange={(e) => handleStoreNameChange(e.target.value)} maxLength={40} autoFocus /></div>
            {storeSlug && <div className="premium-url-showcase anim-fade-in"><div className="url-badge">Tu enlace único</div><div className="url-string">localecomer.vercel.app/tienda/<span className="glow-text">{storeSlug}</span></div></div>}
            <div className="premium-input-group mt-spacing" style={{ marginTop: '24px' }}><label>Ubicación para envíos</label><input type="text" className="premium-input" placeholder="Ej: Envíos a todo el país desde Medellín" value={storeLocation} onChange={(e) => setStoreLocation(e.target.value)} maxLength={60} /></div>
            <div className="premium-input-group mt-spacing" style={{ marginTop: '24px' }}><label>WhatsApp de la Tienda</label><div className="input-with-icon"><MessageCircleIcon size={20} className="input-icon" /><input type="tel" className="premium-input" placeholder="Ej: 300 000 0000" value={storeWhatsapp} onChange={(e) => setStoreWhatsapp(e.target.value.replace(/[^0-9]/g, ''))} maxLength={15} /></div></div>
            <div className="premium-input-group mt-spacing" style={{ marginTop: '24px' }}><label>Descripción (Opcional)</label><input type="text" className="premium-input" placeholder="Ej: La mejor moda y estilo." value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} maxLength={80} /></div>
            <div className="premium-input-group mt-spacing" style={{ marginTop: '24px' }}><label>Pie de página</label><textarea className="premium-input" placeholder="Ej: Políticas de envío, devoluciones..." value={footerInfo} onChange={(e) => setFooterInfo(e.target.value)} rows={3} style={{ resize: 'none' }} /></div>
            <div className="premium-input-group mt-spacing" style={{ marginTop: '24px' }}><label>Instagram (Opcional)</label><input type="text" className="premium-input" placeholder="Ej: https://instagram.com/mitienda" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} /></div>
            <div className="premium-input-group mt-spacing" style={{ marginTop: '24px', marginBottom: '8px' }}><label>Facebook (Opcional)</label><input type="text" className="premium-input" placeholder="Ej: https://facebook.com/mitienda" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} /></div>
            <button className={`premium-btn-main ${storeName.length < 3 || storeWhatsapp.length < 7 ? 'disabled' : ''}`} onClick={handleContinueToTemplates} disabled={storeName.length < 3 || storeWhatsapp.length < 7}>Continuar <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} /></button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="premium-step-container step-anim-enter">
          <div className="premium-hero-header compact">
            <h1 className="hero-title">Sube tu Inventario Inicial</h1>
            <p className="hero-subtitle">Sube tu banner promocional y agrega tus 3 primeros productos.</p>
          </div>

          <div className="premium-form-card" style={{ padding: '32px 24px' }}>
            {/* ─── BANNER: 3 SLOTS INDIVIDUALES ─── */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <ImageIcon size={18} />
                Portada de la tienda
              </h3>
              <p style={{
                fontSize: '13px',
                color: '#64748b',
                marginBottom: '16px',
              }}>
                Sube hasta 3 imágenes de portada. Cada una se convierte automáticamente a WebP y se guarda en la nube.
              </p>

              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                {bannerLabels.map((label, i) => (
                  <BannerSlot
                    key={i}
                    index={i}
                    label={label}
                    preview={bannerUrls[i] || null}
                    isUploading={bannerUploading[i] || false}
                    uploadProgress={bannerProgress[i] || 0}
                    onFileSelect={(file) => handleBannerUpload(i, file)}
                    onRemove={() => handleBannerRemove(i)}
                  />
                ))}
              </div>

              {bannerError && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  color: '#dc2626',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <AlertCircle size={16} />
                  {bannerError}
                </div>
              )}

              {/* Resumen de banners subidos */}
              {bannerUrls.filter(Boolean).length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  color: '#166534',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <CheckCircle2 size={16} />
                  {bannerUrls.filter(Boolean).length} de 3 imágenes subidas a Cloudflare R2 (WebP)
                </div>
              )}
            </div>

            {/* ─── PRODUCTOS INICIALES ─── */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Mis Primeros Productos</h3>
              {initialProducts.map((prod, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', background: '#fff', border: '1px solid #eee', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ width: '80px', height: '80px', borderRadius: '8px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
                      {prod.previews.length > 0 ? (
                        <>
                          <img src={prod.previews[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Producto" />
                          {prod.previews.length > 1 && <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '4px' }}>+{prod.previews.length - 1}</span>}
                        </>
                      ) : (
                        <Upload size={24} color="#aaa" />
                      )}
                      <input type="file" multiple accept="image/*" onChange={(e) => handleProductImageChange(index, e)} style={{ display: 'none' }} />
                    </label>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input type="text" placeholder="Nombre de producto" value={prod.name} onChange={(e) => handleProductChange(index, 'name', e.target.value)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
                      <input type="number" placeholder="Precio (Ej: 50000)" value={prod.price} onChange={(e) => handleProductChange(index, 'price', e.target.value)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
                    </div>
                  </div>
                  <input type="text" placeholder="Descripción breve..." value={prod.description} onChange={(e) => handleProductChange(index, 'description', e.target.value)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="text" placeholder="Colores (Ej: Rojo, Azul...)" value={prod.colors} onChange={(e) => handleProductChange(index, 'colors', e.target.value)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', flex: 1 }} />
                    <input type="text" placeholder="Tallas (Ej: S, M, L...)" value={prod.sizes} onChange={(e) => handleProductChange(index, 'sizes', e.target.value)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', flex: 1 }} />
                  </div>
                </div>
              ))}
              <p style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>Podrás subir y editar ilimitados productos desde tu panel una vez crear el catálogo.</p>
            </div>

            {createError && <div className="premium-error-banner" style={{ marginBottom: '16px' }}><AlertCircle size={18} />{createError}</div>}

            {createSuccess ? (
              <div className="success-state" style={{ padding: '20px', textAlign: 'center' }}>
                <CheckCircle2 size={48} className="success-check" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Magia realizada</h2>
                <p>Tu tienda digital está lista.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="premium-btn-ghost" onClick={() => setStep(1)} disabled={isCreating} style={{ flex: 1 }}>Volver Atrás</button>
                <button
                  className={`premium-btn-main ${isCreating ? 'disabled' : ''}`}
                  onClick={handleCreateStore}
                  disabled={isCreating}
                  style={{ flex: 2 }}
                >
                  {isCreating ? <Loader2 className="animate-spin" size={20} /> : isUpdating ? 'Actualizar mi Catálogo' : 'Crear mi Catálogo'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CHANGE TEMPLATE / STORE SETTINGS SECTION                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ChangeTemplateSection({ onBack, store, initialTemplate, onAddProduct }: { onBack: () => void; store: any; initialTemplate: string; onAddProduct: () => void }) {
  const [currentTemplate, setCurrentTemplate] = useState(initialTemplate)
  const [_isChanging, setIsChanging] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const storeTemplateItems = [{ id: 'store-minimal', name: 'Vendedor Minimalista', emoji: '🛍️' }]

  const handleConfirmChange = async (templateId: string) => {
    setIsChanging(true)
    try {
      const res = await fetch('/api/stores/template', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId: store.id, templateId }) })
      if (res.ok) { setCurrentTemplate(templateId); setPreviewKey((k) => k + 1); alert('¡Diseño actualizado!') } else alert('Hubo un error.')
    } catch { alert('Error de conexión.') } finally { setIsChanging(false) }
  }

  const handleDeleteStore = async () => {
    if (!window.confirm('¿Estás 100% seguro de eliminar todo tu catálogo?')) return
    setIsDeleting(true)
    try { const res = await fetch(`/api/stores/${store.id}`, { method: 'DELETE' }); if (res.ok) window.location.reload(); else alert('Error al eliminar.') }
    catch { alert('Error de conexión.') } finally { setIsDeleting(false) }
  }

  return (
    <>
      <style>{`
        .live-editor-container { display: flex; height: 100%; min-height: calc(100vh - 100px); margin: -24px; background: #f8fafc; }
        .live-editor-sidebar { width: 420px; background: #fff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow-y: auto; flex-shrink: 0; }
        .live-editor-iframe-area { flex: 1; padding: 40px; display: flex; justify-content: center; align-items: flex-start; overflow-y: auto; }
        .live-editor-phone-frame { width: 100%; max-width: 400px; height: 800px; background: #fff; border-radius: 40px; border: 14px solid #0f172a; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; position: relative; }
        .live-editor-notch { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 120px; height: 30px; background: #0f172a; border-bottom-left-radius: 20px; border-bottom-right-radius: 20px; z-index: 10; }
        @media (max-width: 900px) { .live-editor-container { flex-direction: column; margin: -20px; } .live-editor-sidebar { width: 100%; border-right: none; border-bottom: 2px solid #e2e8f0; } .live-editor-iframe-area { padding: 20px; } .live-editor-phone-frame { border: 6px solid #0f172a; border-radius: 24px; height: 600px; } .live-editor-notch { display: none; } }
      `}</style>
      <div className="live-editor-container">
        <div className="live-editor-sidebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', flexShrink: 0 }}><ArrowLeft size={20} /></button>
            <div><h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Editor en Vivo</h2><p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Gestiona {store.name}</p></div>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <button onClick={onAddProduct} className="premium-btn-main" style={{ width: '100%', marginBottom: '12px', padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><Package size={18} /> Subir Producto</button>
              <button onClick={() => setPreviewKey((k) => k + 1)} className="premium-btn-ghost" style={{ width: '100%', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><RefreshCw size={16} /> Recargar Vista</button>
              <button onClick={async () => { const url = `${window.location.origin}/tienda/${store.slug}`; try { await navigator.clipboard.writeText(url); alert('Enlace copiado') } catch { window.prompt('Copia:', url) } }} className="premium-btn-ghost" style={{ width: '100%', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px' }}><ExternalLink size={16} /> Copiar enlace</button>
              <button onClick={() => window.open(`/tienda/${store.slug}`, '_blank')} className="premium-btn-ghost" style={{ width: '100%', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px' }}><EyeIcon size={16} /> Abrir tienda</button>
            </div>
            <div>
              <h4 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '1px', margin: '0 0 16px' }}>Esquema de Diseño</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {storeTemplateItems.map((tmpl) => {
                  const isCurrent = currentTemplate === tmpl.id
                  return (
                    <div key={tmpl.id} onClick={() => !isCurrent && handleConfirmChange(tmpl.id)} style={{ border: `2px solid ${isCurrent ? '#6366f1' : '#e2e8f0'}`, borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isCurrent ? 'default' : 'pointer', background: isCurrent ? '#eef2ff' : '#ffffff', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ fontSize: '24px' }}>{tmpl.emoji}</span><strong style={{ color: isCurrent ? '#4338ca' : '#1e293b', fontSize: '15px' }}>{tmpl.name}</strong></div>
                      {isCurrent ? <CheckCircle2 size={20} color="#6366f1" /> : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 'auto', padding: '24px', borderTop: '1px solid #e2e8f0', background: '#fafafa' }}>
            <button onClick={handleDeleteStore} disabled={isDeleting} style={{ width: '100%', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Trash2 size={18} /> {isDeleting ? 'Eliminando...' : 'Destruir Catálogo'}</button>
          </div>
        </div>
        <div className="live-editor-iframe-area">
          <div className="live-editor-phone-frame"><div className="live-editor-notch" /><iframe key={previewKey} src={`/tienda/${store.slug}`} title="Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} loading="lazy" /></div>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CHECKOUT CONFIG SECTION                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function StoreCheckoutConfigSection({ onBack, store }: { onBack: () => void; store: Record<string, unknown> }) {
  let initialWhatsapp = (store?.whatsapp_number as string) || ''
  if (!initialWhatsapp && store?.banner_url && typeof store.banner_url === 'string' && store.banner_url.startsWith('{')) {
    try { const config = JSON.parse(store.banner_url); initialWhatsapp = config.whatsappNumber || '' } catch {}
  }
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp)
  const [paymentMethods, setPaymentMethods] = useState<string[]>((store?.payment_methods as string[]) || ['efectivo'])
  const [autoDiscountRules, setAutoDiscountRules] = useState(store?.auto_discount_rules ? JSON.stringify(store.auto_discount_rules, null, 2) : '[\n  {\n    "trigger_keyword": "descuento10",\n    "discount_percentage": 10\n  }\n]')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const togglePaymentMethod = (method: string) => setPaymentMethods((prev) => prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let parsedRules = null
      if (autoDiscountRules.trim()) { try { parsedRules = JSON.parse(autoDiscountRules) } catch { alert('JSON inválido.'); setIsSaving(false); return } }
      const res = await fetch('/api/stores/update', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId: store.id, whatsappNumber: whatsapp, paymentMethods, autoDiscountRules: parsedRules }) })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) } else alert('Error guardando.')
    } catch { alert('Error de conexión.') } finally { setIsSaving(false) }
  }

  return (
    <div className="change-template-section">
      <div className="breadcrumb"><button className="breadcrumb-back" onClick={onBack}><ArrowLeft size={18} /></button><span className="breadcrumb-item">Administrar Tienda</span><X size={14} style={{ opacity: 0 }} /><span className="breadcrumb-item active">Caja (IA)</span></div>
      <div className="change-template-header" style={{ marginBottom: '24px' }}><div className="change-template-title-row"><DollarSign size={22} /><h2>Configuración de Caja y IA</h2></div><p>Configura reglas para cobrar y guiar ventas.</p></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div><label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>WhatsApp (con código 57)</label><input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }} placeholder="Ej: 573001234567" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
        <div><label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Métodos de Pago</label><div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{['efectivo', 'transferencia', 'nequi', 'daviplata', 'tarjeta', 'contra_entrega'].map((method) => <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: paymentMethods.includes(method) ? '#e0f2fe' : '#f1f5f9', padding: '6px 12px', borderRadius: '16px', cursor: 'pointer', border: paymentMethods.includes(method) ? '1px solid #38bdf8' : '1px solid transparent' }}><input type="checkbox" checked={paymentMethods.includes(method)} onChange={() => togglePaymentMethod(method)} style={{ display: 'none' }} /><span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{method.replace('_', ' ')}</span></label>)}</div></div>
        <div><label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Reglas de Descuento (JSON)</label><p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Instrucciones para la IA.</p><textarea style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', minHeight: '120px', fontFamily: 'monospace' }} value={autoDiscountRules} onChange={(e) => setAutoDiscountRules(e.target.value)} /></div>
        <button onClick={handleSave} disabled={isSaving} style={{ background: '#111', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: isSaving ? 'wait' : 'pointer' }}>{isSaving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Configuración'}</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TEMPLATE CARD (export for reuse)                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function TemplateCard({ template, isSelected, onSelect, onPreview }: {
  template: (typeof storeTemplates)[0]; isSelected: boolean; onSelect: () => void; onPreview: () => void
}) {
  const router = useRouter()
  return (
    <div className={`template-card ${isSelected ? 'template-card--selected' : ''}`} onClick={onSelect}>
      <div className="template-preview">
        <div className="template-preview-inner">
          <div className="template-browser-bar"><span className="browser-dot" /><span className="browser-dot" /><span className="browser-dot" /></div>
          <div className="template-layout">
            {template.previewImage ? (<img src={template.previewImage} alt={`${template.name} preview`} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '140px', display: 'block' }} />) : (<><div className="template-header-mock" style={{ background: template.colors[0] }} /><div className="template-body-mock"><div className="template-accent-bar" style={{ background: template.colors[2] }} /><div className="template-grid-mock">{[0, 1, 2, 3].map((i) => <div key={i} className="template-grid-item" style={{ background: template.colors[i % template.colors.length], opacity: 0.6 + i * 0.1 }} />)}</div></div></>)}
          </div>
        </div>
        {template.popular && <div className="template-popular-badge"><Zap size={12} />Popular</div>}
        {template.storeUrl ? (<button className="template-preview-btn" onClick={(e) => { e.stopPropagation(); router.push(template.storeUrl!) }}><Eye size={14} />Ver Tienda</button>) : (<button className="template-preview-btn" onClick={(e) => { e.stopPropagation(); onPreview() }}><Eye size={14} />Vista previa</button>)}
      </div>
      <div className="template-info">
        <div className="template-info-top"><h3 className="template-name">{template.name}</h3><span className="template-category">{template.category}</span></div>
        <p className="template-description">{template.description}</p>
        <div className="template-colors">{template.colors.map((color, i) => <span key={i} className="template-color-dot" style={{ background: color }} />)}</div>
        <div className="template-meta"><div className="template-rating"><Star size={12} fill="#f97316" stroke="#f97316" /><span>{template.rating}</span></div><span className="template-uses">{template.uses} tiendas</span></div>
        <div className="template-features">{template.features.slice(0, 3).map((feature, i) => <span key={i} className="template-feature-tag">{feature}</span>)}{template.features.length > 3 && <span className="template-feature-more">+{template.features.length - 3}</span>}</div>
      </div>
      {isSelected && <div className="template-selected-indicator"><Check size={16} /></div>}
    </div>
  )
}
