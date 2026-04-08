'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useImageUpload } from '@/lib/hooks/useImageUpload'
import { 
  CheckCircle, 
  Loader2, 
  Store, 
  MapPin, 
  Hash, 
  User, 
  ArrowRight, 
  Image as ImageIcon, 
  Upload, 
  X,
  Sparkles
} from 'lucide-react'
import './onboarding.css'

interface OnboardingProps {
  userId: string;
  userEmail: string;
  onComplete: (user: any) => void;
}

export default function OnboardingWizard({ userId, userEmail, onComplete }: OnboardingProps) {
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { uploadSingleImage, uploading: isImageUploading, progress: uploadProgress } = useImageUpload({
    onSuccess: () => console.log("[ONBOARDING] Imagen subida con éxito"),
    onError: (err) => setError(err)
  })

  /* Step 1: Personal & Store Data */
  const [fullName, setFullName] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [city, setCity] = useState('')
  const [businessName, setBusinessName] = useState('')

  const [bannerUrl, setBannerUrl] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [productName, setProductName] = useState('')

  const handleFileUpload = async (file: File, type: 'banner' | 'product') => {
    setError('')
    try {
      const folder = type === 'banner' ? 'stores' : 'products'
      const result = await uploadSingleImage(file, folder, userId)
      if (result) {
        if (type === 'banner') setBannerUrl(result.fullUrl)
        else setProductUrl(result.fullUrl)
      }
    } catch (err: any) {
      console.error("[UPLOAD_ERROR]", err)
      setError(`Error subiendo ${type}: ${err.message}`)
    }
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!fullName || !documentNumber || !businessName) {
        return setError('Completa los campos obligatorios')
      }
      setError('')
      setStep(2)
    }
  }

  const handleFinish = async (skipCatalog = false) => {
    setLoading(true)
    setError('')
    try {
      console.log("[ONBOARDING] Iniciando guardado definitivo...", { skipCatalog })

      /* 1. Perfil (Solo columnas REALES detectadas: id, nombre, role, document_number, city) */
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          nombre: fullName,
          document_number: documentNumber,
          city: city,
          role: 'seller'
        })
        .select()

      if (profileErr) throw new Error(`Perfil: ${profileErr.message}`)
      const profileInfo = profiles?.[0]

      /* 2. Tienda (Check logic robusto) */
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      let store;
      const initialCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const businessSlug = businessName.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '') || `tienda-${Math.random().toString(36).substring(5)}`
      const slug = `${businessSlug}-${Math.random().toString(36).substring(7)}`

      if (existingStore) {
        const { data: updatedStores, error: updErr } = await supabase
          .from('stores')
          .update({
            name: businessName,
            banner_url: skipCatalog ? null : (bannerUrl || null)
          })
          .eq('id', existingStore.id)
          .select()
        if (updErr) throw new Error(`Tienda (Update): ${updErr.message}`)
        store = updatedStores?.[0]
      } else {
        const { data: newStores, error: insErr } = await supabase
          .from('stores')
          .insert({
            user_id: userId,
            name: businessName,
            slug: slug,
            is_active: true,
            plan: 'free',
            initial_code: initialCode,
            banner_url: skipCatalog ? null : (bannerUrl || null)
          })
          .select()
        if (insErr) throw new Error(`Tienda (Insert): ${insErr.message}`)
        store = newStores?.[0]
      }

      /* 2.5. Trial Period Metadata - 7 Days */
      const sevenDaysLater = new Date()
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
      
      const { error: metaErr } = await supabase.auth.updateUser({
        data: {
          paid_until: sevenDaysLater.toISOString(),
          plan: 'free_trial'
        }
      })
      if (metaErr) console.error("[ONBOARDING] Error actualizando metadatos:", metaErr)

      if (!store) throw new Error("No se pudo confirmar el proceso de la tienda.")

      /* 3. Producto Inicial (Formato JSON para 'images') */
      if (!skipCatalog && productUrl && productName) {
        const { error: prodErr } = await supabase.from('products').insert({
          store_id: store.id,
          name: productName,
          images: [{ fullUrl: productUrl, thumbnailUrl: productUrl }],
          price: 0,
          is_active: true
        })
        if (prodErr) console.error("[ONBOARDING] Error producto estrella (omitido):", prodErr)
      }

      console.log("[ONBOARDING] Éxito. Finalizando.")
      onComplete({ ...profileInfo, store })
    } catch (err: any) {
      console.error("[ONBOARDING] Error crítico:", err.message)
      setError(err.message || 'Error al completar el registro. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="onboarding-loading">
          <Loader2 size={48} className="spinning text-indigo-600 mb-4" />
          <p className="font-bold text-gray-800">Preparando tu Panel Maestro...</p>
        </div>
      )
    }

    if (step === 1) {
      return (
        <div className="onboarding-step">
          <div className="onboarding-header">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-indigo-50 rounded-2xl">
                <Sparkles size={32} className="text-indigo-600" />
              </div>
            </div>
            <h2>Bienvenido a la Élite</h2>
            <p>Configura tu identidad para empezar a vender.</p>
          </div>

          <div className="onboarding-field">
            <label>Nombre Completo</label>
            <input 
              className="onboarding-input" 
              placeholder="Ej: Jerson Triana" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="onboarding-field">
            <label>Cédula / NIT</label>
            <input 
              className="onboarding-input" 
              placeholder="123456789" 
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
            />
          </div>

          <div className="onboarding-field">
            <label>Ciudad</label>
            <input 
              className="onboarding-input" 
              placeholder="Medellín / Bogotá / Cali" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="onboarding-field">
            <label>Nombre de tu Negocio / Tienda</label>
            <input 
              className="onboarding-input" 
              placeholder="Ej: Tienda Pro" 
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <button className="onboarding-btn-primary" onClick={() => handleFinish(true)}>
            Crear Cuenta <ArrowRight size={18} />
          </button>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="onboarding-step">
          <div className="onboarding-header">
            <h2>Crea tu Catálogo</h2>
            <p>Sube una foto de portada y tu producto estrella.</p>
          </div>

            <div className="onboarding-upload-grid">
            <div className="onboarding-field">
              <label>Imagen de Portada (Banner)</label>
              <label className="onboarding-upload-box">
                <input 
                  type="file" 
                  hidden 
                  accept="image/*" 
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'banner')}
                  disabled={isImageUploading}
                />
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner" />
                ) : isImageUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 size={32} className="spinning text-indigo-500" />
                    <span className="text-[10px] mt-2 text-indigo-400 text-center px-2">{uploadProgress.message}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon size={32} color="#94a3b8" />
                    <span className="text-[12px] mt-2 text-gray-500">Cargar Banner</span>
                  </div>
                )}
              </label>
            </div>

            <div className="onboarding-field">
              <label>Tu Primer Producto</label>
              <label className="onboarding-upload-box">
                <input 
                  type="file" 
                  hidden 
                  accept="image/*" 
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'product')}
                  disabled={isImageUploading}
                />
                {productUrl ? (
                   <img src={productUrl} alt="Producto" />
                ) : isImageUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 size={32} className="spinning text-indigo-500" />
                    <span className="text-[10px] mt-2 text-indigo-400 text-center px-2">{uploadProgress.message}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload size={32} color="#94a3b8" />
                    <span className="text-[12px] mt-2 text-gray-400">Foto del Producto</span>
                  </div>
                )}
              </label>
              <input 
                className="onboarding-input mt-4 text-xs h-9" 
                placeholder="Nombre del producto estrella"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
          </div>

          <div className="onboarding-footer">
            <button className="onboarding-btn-skip" onClick={() => handleFinish(true)}>
              Omitir
            </button>
            <button className="onboarding-btn-primary" onClick={() => handleFinish(false)}>
              Guardar y Finalizar
            </button>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-progress">
          <div 
            className="onboarding-progress-bar" 
            style={{ width: `${(step / 2) * 100}%` }} 
          />
        </div>
        <div className="onboarding-content">
          {renderContent()}
          {error && <div className="auth-error mt-4">⚠️ {error}</div>}
        </div>
      </div>
    </div>
  )
}
