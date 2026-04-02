'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CREATE STORE SECTION                                                      */
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

export function CreateStoreSection({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [storeWhatsapp, setStoreWhatsapp] = useState('')
  const [storeLocation, setStoreLocation] = useState('')
  const [footerInfo, setFooterInfo] = useState('')
  const [socialFacebook, setSocialFacebook] = useState('')
  const [socialInstagram, setSocialInstagram] = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [storeBanners, setStoreBanners] = useState<File[]>([])
  const [storeBannerPreviews, setStoreBannerPreviews] = useState<string[]>([])
  const [initialProducts, setInitialProducts] = useState([
    { name: '', price: '', description: '', colors: '', sizes: '', images: [] as File[], previews: [] as string[] },
    { name: '', price: '', description: '', colors: '', sizes: '', images: [] as File[], previews: [] as string[] },
    { name: '', price: '', description: '', colors: '', sizes: '', images: [] as File[], previews: [] as string[] },
  ])

  const handleProductImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      const newProducts = [...initialProducts]
      const prod = newProducts[index]
      if (prod) { prod.images = [...prod.images, ...files].slice(0, 4); prod.previews = prod.images.map(f => URL.createObjectURL(f)) }
      setInitialProducts(newProducts)
    }
  }

  const handleProductChange = (index: number, field: 'name' | 'price' | 'description' | 'colors' | 'sizes', value: string) => {
    const newProducts = [...initialProducts]; const prod = newProducts[index]; if (prod) prod[field] = value; setInitialProducts(newProducts)
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      const newBanners = [...storeBanners, ...files].slice(0, 3)
      setStoreBanners(newBanners)
      setStoreBannerPreviews(newBanners.map((f) => URL.createObjectURL(f)))
      setCreateError(null)
    }
  }

  const handleStoreNameChange = (value: string) => {
    setStoreName(value)
    setStoreSlug(value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'))
  }

  const handleContinueToTemplates = () => { if (storeName.trim().length >= 3 && storeWhatsapp.trim().length >= 7) setStep(2) }

  const handleCreateStore = async () => {
    const tmpl = storeTemplates[0]!
    setIsCreating(true); setCreateError(null)
    try {
      let uploadedBannerUrl = undefined
      let uploadedBannerUrls: string[] = []
      if (storeBanners.length > 0) {
        const formData = new FormData()
        storeBanners.forEach(banner => formData.append('images', banner))
        formData.append('folder', 'banners')
        const uploadRes = await fetch('/api/upload/images', { method: 'POST', body: formData })
        if (!uploadRes.ok) { const uploadData = await uploadRes.json(); throw new Error(uploadData.error || 'Error al subir la portada') }
        const uploadData = await uploadRes.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uploadedBannerUrls = uploadData.images.map((img: any) => img.fullUrl)
        uploadedBannerUrl = uploadedBannerUrls[0]
      }

      const res = await fetch('/api/stores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeName, slug: storeSlug, templateId: tmpl.id, templateUrl: tmpl.storeUrl,
          themeColor: tmpl.colors[2] || '#6366f1', description: storeDescription.trim() || `Catálogo de ${storeName}`,
          footerInfo, socialFacebook, socialInstagram, whatsappNumber: storeWhatsapp,
          shippingLocation: storeLocation, bannerUrl: uploadedBannerUrl, bannerUrls: uploadedBannerUrls,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error + (data.details ? `: ${data.details}` : '')); setIsCreating(false); return }

      const newStoreId = data.store.id
      for (const prod of initialProducts) {
        if (prod.name.trim() && prod.price.trim()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let mainImg = null; let additionalImgs: any[] = []
          if (prod.images.length > 0) {
            const pFormData = new FormData()
            prod.images.forEach(img => pFormData.append('images', img))
            pFormData.append('folder', 'products')
            const pRes = await fetch('/api/upload/images', { method: 'POST', body: pFormData })
            if (pRes.ok) {
              const pData = await pRes.json()
              if (pData.images?.length > 0) {
                mainImg = { fullUrl: pData.images[0].fullUrl, thumbnailUrl: pData.images[0].thumbnailUrl }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                additionalImgs = pData.images.slice(1).map((img: any) => ({ fullUrl: img.fullUrl, thumbnailUrl: img.thumbnailUrl }))
              }
            }
          }
          await fetch('/api/products', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storeId: newStoreId, name: prod.name, price: parseFloat(prod.price) || 0,
              description: prod.description || '', category: 'General', stock: 100, is_active: true,
              mainImage: mainImg || { fullUrl: '', thumbnailUrl: '' }, additionalImages: additionalImgs,
              variants: prod.colors ? prod.colors.split(',').map(c => ({ color: c.trim(), colorHex: '#000', size: prod.sizes || '', type: 'color', stock: 10, priceModifier: 0, images: [] })) : [],
            }),
          })
        }
      }

      setCreateSuccess(true)
      setTimeout(() => router.push(`/tienda/${storeSlug}`), 1800)
    } catch { setCreateError('Error de conexión. Verifica tu internet e intenta de nuevo.'); setIsCreating(false) }
  }

  return (
    <div className="create-store-section premium-flow">
      <div className="premium-breadcrumb">
        <button className="premium-back-btn" onClick={onBack}><ArrowLeft size={20} /><span>Volver</span></button>
        <div className="premium-step-indicator"><span className={`step-dot ${step >= 1 ? 'active' : ''}`} /><span className={`step-line ${step >= 2 ? 'active' : ''}`} /><span className={`step-dot ${step >= 2 ? 'active' : ''}`} /></div>
        <div className="premium-step-text">Paso {step} de 2</div>
      </div>
      {step === 1 && (
        <div className="premium-step-container step-anim-enter">
          <div className="premium-hero-header"><div className="glow-icon"><Sparkles size={40} /></div><h1 className="hero-title">Crea catálogo de productos</h1><p className="hero-subtitle">Dale un nombre único y memorable a tu tienda digital.</p></div>
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
          <div className="premium-hero-header compact"><h1 className="hero-title">Sube tu Inventario Inicial</h1><p className="hero-subtitle">Sube tu banner promocional y agrega tus 3 primeros productos.</p></div>
          <div className="premium-form-card" style={{ padding: '32px 24px' }}>
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Portada de la tienda</h3>
              <label className="upload-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', border: '2px dashed #ddd', borderRadius: '16px', cursor: 'pointer', overflow: 'hidden', position: 'relative', background: '#fafafa', padding: storeBannerPreviews.length > 0 ? '8px' : '0' }}>
                {storeBannerPreviews.length > 0 ? (
                  <div style={{ display: 'flex', gap: '8px', width: '100%', height: '100%' }}>{storeBannerPreviews.map((preview, i) => <img key={i} src={preview} style={{ flex: 1, minWidth: 0, objectFit: 'cover', borderRadius: '8px' }} alt="Preview" />)}</div>
                ) : (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Upload size={32} color="#999" style={{ marginBottom: '8px' }} /><span style={{ color: '#666', fontSize: '14px', fontWeight: 500 }}>Sube hasta 3 imágenes de Portada</span></div>)}
                <input type="file" multiple accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Mis Primeros Productos</h3>
              {initialProducts.map((prod, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', background: '#fff', border: '1px solid #eee', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ width: '80px', height: '80px', borderRadius: '8px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
                      {prod.previews.length > 0 ? (<><img src={prod.previews[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Producto" />{prod.previews.length > 1 && <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '4px' }}>+{prod.previews.length - 1}</span>}</>) : (<Upload size={24} color="#aaa" />)}
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
              <div className="success-state" style={{ padding: '20px', textAlign: 'center' }}><CheckCircle2 size={48} className="success-check" style={{ margin: '0 auto 16px' }} /><h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Magia realizada</h2><p>Tu tienda digital está lista.</p></div>
            ) : (
              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="premium-btn-ghost" onClick={() => setStep(1)} disabled={isCreating} style={{ flex: 1 }}>Volver Atrás</button>
                <button className={`premium-btn-main ${isCreating ? 'disabled' : ''}`} onClick={handleCreateStore} disabled={isCreating} style={{ flex: 2 }}>{isCreating ? <Loader2 className="animate-spin" size={20} /> : 'Crear mi Catálogo'}</button>
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
