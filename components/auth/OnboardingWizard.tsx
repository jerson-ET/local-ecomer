'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Loader2, 
  Sparkles
} from 'lucide-react'
import './onboarding.css'

interface OnboardingProps {
  userId: string;
  userEmail: string;
  onComplete: (user: any) => void;
}

export default function OnboardingWizard({ userId, onComplete }: OnboardingProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /* Data */
  const [fullName, setFullName] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [city, setCity] = useState('')
  const [businessName, setBusinessName] = useState('')

  const handleFinish = async () => {
    if (!fullName || !documentNumber || !businessName) {
      return setError('Completa los campos obligatorios')
    }

    setLoading(true)
    setError('')
    try {
      console.log("[ONBOARDING] Iniciando guardado definitivo...")

      /* 1. Perfil */
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

      /* 2. Tienda */
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
            banner_url: null
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
            banner_url: null
          })
          .select()
        if (insErr) throw new Error(`Tienda (Insert): ${insErr.message}`)
        store = newStores?.[0]
      }

      /* 2.5. Trial Period Metadata - 21 Days */
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 21)
      
      const { error: metaErr } = await supabase.auth.updateUser({
        data: {
          paid_until: trialEndDate.toISOString(),
          plan: 'free_trial'
        }
      })
      if (metaErr) console.error("[ONBOARDING] Error actualizando metadatos:", metaErr)

      if (!store) throw new Error("No se pudo confirmar el proceso de la tienda.")

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

        <button 
          className="onboarding-btn-primary" 
          onClick={handleFinish}
          disabled={loading}
        >
          {loading ? <Loader2 className="spinner" /> : 'Finalizar Registro'}
        </button>
      </div>
    )
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-content">
          {renderContent()}
          {error && <div className="auth-error mt-4">⚠️ {error}</div>}
        </div>
      </div>
    </div>
  )
}
