'use client'

import { useEffect, useState } from 'react'
import { FileText, CreditCard, ShieldCheck, RefreshCw, Zap, Calendar, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Invoice {
  id: string
  number: string
  amount: number
  date: string
  url: string
  type: string
}

export default function BillingSection() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [paidUntil, setPaidUntil] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const [generatingPayment, setGeneratingPayment] = useState(false)

  useEffect(() => {
    async function loadBilling() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          setInvoices(user.user_metadata?.invoices || [])
          setPaidUntil(user.user_metadata?.paid_until || null)
        }
      } catch (err) {
        console.error('Error cargando facturación:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBilling()
  }, [])

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadStep(1) // Step 1: Reading file

    // Artificial delay for psychology
    setTimeout(() => setUploadStep(2), 2000) // Step 2: Meta scanning
    setTimeout(() => setUploadStep(3), 4500) // Step 3: Server sync

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/billing/upload-receipt', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Error al subir')

      // Complete the steps
      setTimeout(() => {
        setUploadStep(4)
        setUploadSuccess(true)
        
        const waMessage = `Hola, acabo de subir mi comprobante de pago de LocalEcomer de $34.000. Mi ID de usuario es: ${userId}. Por favor validar mi plan Pro.`
        const waUrl = `https://wa.me/573005730682?text=${encodeURIComponent(waMessage)}`
        
        setTimeout(() => {
          window.open(waUrl, '_blank')
          window.location.reload()
        }, 3000)
      }, 7000)

    } catch (err) {
      alert('Error al subir comprobante. Intenta de nuevo.')
      setIsUploading(false)
      setUploadStep(0)
    }
  }

  const handleEfipayPayment = async (amount: number) => {
    try {
      setGeneratingPayment(true)
      const res = await fetch('/api/efipay/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al generar pago')
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (e: any) {
      alert(e.message)
      setGeneratingPayment(false)
    }
  }

  const daysRemaining = paidUntil
    ? Math.ceil((new Date(paidUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isExpired = daysRemaining <= 0

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#f9fafb', padding: '24px 16px 120px', overflowY: 'auto' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Título */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CreditCard size={26} color="#FF5A26" /> Mi Plan
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Gestiona tu suscripción, revisa tus días restantes y activa los beneficios Pro.</p>
        </div>

        {/* Banner de Pago - Siempre visible */}
        <div style={{
          background: isExpired 
            ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' 
            : 'linear-gradient(135deg, #200040 0%, #3a0070 50%, #5a0090 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: isExpired 
            ? '0 10px 25px rgba(220, 38, 38, 0.4)' 
            : '0 10px 25px rgba(32, 0, 64, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.08 }}>
            <Zap size={120} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 8px 0', zIndex: 1 }}>
            {isExpired ? '⚠️ Tu suscripción ha expirado' : `✅ Tu plan está activo · ${daysRemaining} días restantes`}
          </h2>
          <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 16px 0', maxWidth: '400px', opacity: 0.85, zIndex: 1 }}>
            {isExpired 
              ? 'Renueva ahora para recuperar el acceso a tu tienda y herramientas.'
              : 'Puedes renovar en cualquier momento para extender tu suscripción.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => handleEfipayPayment(34000)}
              disabled={generatingPayment}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '16px 36px',
                borderRadius: '50px',
                fontWeight: 900,
                fontSize: '15px',
                textDecoration: 'none',
                boxShadow: '0 8px 25px rgba(15, 23, 42, 0.3)',
                zIndex: 1,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid #334155',
                cursor: generatingPayment ? 'not-allowed' : 'pointer'
              }}
            >
              {generatingPayment ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />} 
              {generatingPayment ? 'Conectando Pasarela...' : `Pagar Plan 30 Días ($34K)`}
            </button>
          </div>
        </div>

        {/* Cards de estado */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>

          {/* Card: Plan actual */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FF5A26', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
              <ShieldCheck size={14} /> Plan Tienda LocalEcomer
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0 }}>
              $34.000 <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>COP /mes</span>
            </h2>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.6 }}>
              Catálogo digital ilimitado, asistente IA, red dropshipping.
            </p>

            <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 16, border: '1px dashed #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'uppercase' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: 1 }}>Estado:</span>
                <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 20, background: isExpired ? '#fef2f2' : '#f0fdf4', color: isExpired ? '#ef4444' : '#16a34a' }}>
                  {isExpired ? 'EXPIRADA' : 'ACTIVA'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Vence:</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>
                  {paidUntil ? new Date(paidUntil).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No definida'}
                </span>
              </div>
              <div style={{ width: '100%', background: '#e2e8f0', height: 6, borderRadius: 20, marginTop: 14, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 20, transition: 'width 1s ease', background: isExpired ? '#ef4444' : '#FF5A26', width: `${Math.max(5, Math.min(100, (daysRemaining / 30) * 100))}%` }} />
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, marginTop: 6, color: isExpired ? '#ef4444' : '#94a3b8' }}>
                {isExpired ? 'Tu plan venció. Renueva para seguir vendiendo.' : `Quedan ${daysRemaining} días de servicio.`}
              </p>
            </div>
          </div>
        </div>

        {/* Modal de Verificación Psicológica */}
        {isUploading && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 32,
              padding: '40px 30px',
              maxWidth: 400,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Scanline Effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 4,
                background: 'linear-gradient(90deg, transparent, #E6007E, transparent)',
                animation: 'scan 2.5s infinite linear',
                zIndex: 10
              }} />

              {uploadSuccess ? (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                  <div style={{ width: 80, height: 80, background: '#f0fdf4', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <ShieldCheck size={48} />
                  </div>
                  <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>¡Validación Exitosa!</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
                    Nuestro sistema ha analizado el comprobante y verificado la legitimidad del pago. 
                    <strong>Ahora te redirigiremos a WhatsApp (3005730682)</strong> para que el administrador valide tu plan Pro.
                  </p>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 2 }}>
                    Cuenta Sincronizada ... Redirigiendo ✓
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ width: 64, height: 64, background: '#f8fafc', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'pulse 2s infinite' }}>
                    <RefreshCw size={32} color="#E6007E" className="spinning" />
                  </div>
                  
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Escaneando Comprobante...</h3>
                  <div style={{ marginBottom: 30 }}>
                    <div style={{ height: 6, width: '100%', background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#E6007E', width: `${uploadStep * 25}%`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, opacity: uploadStep >= 1 ? 1 : 0.4 }}>
                      <Zap size={16} color={uploadStep >= 1 ? '#E6007E' : '#cbd5e1'} />
                      <span style={{ fontSize: 13, fontWeight: uploadStep === 1 ? 800 : 500, color: uploadStep === 1 ? '#0f172a' : '#64748b' }}>
                        Leyendo metadatos de la imagen...
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, opacity: uploadStep >= 2 ? 1 : 0.4 }}>
                      <Calendar size={16} color={uploadStep >= 2 ? '#E6007E' : '#cbd5e1'} />
                      <span style={{ fontSize: 13, fontWeight: uploadStep === 2 ? 800 : 500, color: uploadStep === 2 ? '#0f172a' : '#64748b' }}>
                        Verificando timestamp y geolocalización...
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, opacity: uploadStep >= 3 ? 1 : 0.4 }}>
                      <ShieldCheck size={16} color={uploadStep >= 3 ? '#E6007E' : '#cbd5e1'} />
                      <span style={{ fontSize: 13, fontWeight: uploadStep === 3 ? 800 : 500, color: uploadStep === 3 ? '#0f172a' : '#64748b' }}>
                        Cruzando datos con pasarela Nequi...
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scan { 
          0% { top: -5%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 105%; opacity: 0; }
        }
        @keyframes pulse { 0% { scale: 1; } 50% { scale: 1.05; } 100% { scale: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>

  )
}
