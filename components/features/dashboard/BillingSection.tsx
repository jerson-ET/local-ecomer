'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, CreditCard, Calendar, Info, ShieldCheck, RefreshCw } from 'lucide-react'
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
            <CreditCard size={26} color="#FF5A26" /> Suscripción y Facturación
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Gestiona tus pagos y descarga tus comprobantes legales para la DIAN.</p>
        </div>

        {/* Banner de Promoción / Renovación (<= 4 días) */}
        {daysRemaining > 0 && daysRemaining <= 4 && (
          <div style={{
            background: 'linear-gradient(135deg, #FF5A26 0%, #ea580c 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            marginBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(255, 90, 38, 0.4)',
            animation: 'pulse 2s infinite',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
              <CreditCard size={120} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px 0', zIndex: 1 }}>
              ¡Te quedan {daysRemaining} días! ⏱️
            </h2>
            <p style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', maxWidth: '400px', opacity: 0.9, zIndex: 1 }}>
              Renueva tu suscripción ahora y sigue generando ingresos con tu tienda sin interrupciones.
            </p>
            <a 
              href="https://wa.me/573005730682?text=Hola,%20quiero%20renovar%20mi%20suscripción%20Premium%20en%20LocalEcomer" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                background: 'white',
                color: '#FF5A26',
                padding: '12px 24px',
                borderRadius: '50px',
                fontWeight: 900,
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                zIndex: 1,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Contactar Soporte para Renovar
            </a>
          </div>
        )}

        {/* Cards de estado */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>

          {/* Card: Plan actual */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FF5A26', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
              <ShieldCheck size={14} /> Plan Tienda LocalEcomer
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0 }}>
              $35.000 <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>COP /mes</span>
            </h2>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.6 }}>
              Catálogo digital ilimitado, asistente IA, red dropshipping.
            </p>

            <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 16, border: '1px dashed #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Estado:</span>
                <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 20, background: isExpired ? '#fef2f2' : '#f0fdf4', color: isExpired ? '#ef4444' : '#16a34a' }}>
                  {isExpired ? 'EXPIRADA' : 'ACTIVA'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

          {/* Card: Cómo renovar */}
          <div style={{ background: '#1e293b', padding: 24, borderRadius: 24, color: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <RefreshCw size={20} color="#FF5A26" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 8px' }}>¿Cómo renovar?</h3>
              <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 24px' }}>
                Contacta al soporte. Una vez confirmes tu pago, el admin extiende tu acceso y la factura aparece automáticamente aquí.
              </p>
            </div>
            <a
              href="https://wa.me/573000000000?text=Hola,%20acabo%20de%20pagar%20mi%20mensualidad%20de%2035.000%20COP.%20Mi%20correo%20es:"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', position: 'relative', zIndex: 2, width: '100%', background: '#FF5A26', color: '#fff', padding: '14px 0', borderRadius: 16, fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', textDecoration: 'none' }}
            >
              Informar Pago por WhatsApp
            </a>
            <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.04 }}>
              <Calendar size={160} strokeWidth={1} />
            </div>
          </div>
        </div>

        {/* Historial de Facturas */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <FileText size={20} color="#FF5A26" /> Historial de Facturas
            </h3>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, background: '#f1f5f9', padding: '4px 12px', borderRadius: 20 }}>Registro DIAN</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <RefreshCw size={28} color="#FF5A26" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginTop: 14, textTransform: 'uppercase', letterSpacing: 2 }}>Sincronizando...</p>
              </div>
            ) : !invoices || invoices.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Info size={28} color="#cbd5e1" />
                </div>
                <h4 style={{ fontWeight: 900, fontSize: 16, color: '#0f172a', margin: '0 0 6px' }}>No hay facturas aún</h4>
                <p style={{ fontSize: 11, color: '#94a3b8', maxWidth: 260, margin: '0 auto', lineHeight: 1.6 }}>
                  Tus comprobantes de pago de $35.000 COP se generarán aquí automáticamente cada mes.
                </p>
              </div>
            ) : (
              <div>
                {invoices.map((inv, idx) => (
                  <div key={inv.id} style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: idx < invoices.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, background: '#fff7ed', color: '#FF5A26', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 13, color: '#0f172a' }}>{inv.number}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>
                          {new Date(inv.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>$ {inv.amount.toLocaleString('es-CO')}</div>
                        <div style={{ fontSize: 9, color: '#16a34a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>Pagada ✓</div>
                      </div>
                        <a
                          href={`/api/invoice/download?userId=${userId}&invoiceId=${inv.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: 6, 
                            padding: '8px 14px', background: '#FF5A26', color: '#fff', 
                            borderRadius: 10, fontWeight: 800, fontSize: 10, 
                            textTransform: 'uppercase', letterSpacing: 1, textDecoration: 'none',
                            boxShadow: '0 2px 8px rgba(255,90,38,0.2)'
                          }}
                        >
                          <Download size={14} /> Descargar PDF
                        </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nota contable */}
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'flex-start', gap: 14, padding: 18, background: '#eff6ff', borderRadius: 18, border: '1px solid #dbeafe' }}>
            <div style={{ background: '#3b82f6', color: '#fff', padding: 6, borderRadius: 8, flexShrink: 0 }}>
              <Info size={14} />
            </div>
            <p style={{ fontSize: 11, color: '#1e40af', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
              <strong>Nota Contable:</strong> Todas las facturas generadas cumplen con el estándar de cuenta de cobro / factura electrónica.
              Conserva estos documentos para tus declaraciones de Cámara de Comercio y DIAN.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
