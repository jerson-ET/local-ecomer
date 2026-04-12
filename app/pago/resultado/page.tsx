'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, Loader2, ArrowLeft, ShoppingBag } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PÁGINA DE RESULTADO DE PAGO                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PaymentResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const urlStatus = searchParams.get('status') || 'pending'
  const orderId = searchParams.get('orderId') || ''
  const storeSlug = searchParams.get('storeSlug') || ''

  const [orderStatus, setOrderStatus] = useState<string>(urlStatus)
  const [efipayStatus, setEfipayStatus] = useState<string | null>(null)
  const [totalAmount, setTotalAmount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [pollCount, setPollCount] = useState(0)

  // Consultar estado real de la orden
  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    let isMounted = true
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/efipay/status?orderId=${orderId}`)
        if (!res.ok) throw new Error('Failed')
        
        const data = await res.json()
        if (!isMounted) return

        setOrderStatus(data.status || urlStatus)
        setEfipayStatus(data.efipayStatus || null)
        setTotalAmount(data.totalAmount || null)
        setLoading(false)

        // Si sigue pendiente, re-consultar en 5s (máximo 12 intentos = 1 min)
        if (data.status === 'pending' && pollCount < 12) {
          setTimeout(() => {
            if (isMounted) setPollCount(prev => prev + 1)
          }, 5000)
        }
      } catch {
        if (isMounted) setLoading(false)
      }
    }

    checkStatus()
    return () => { isMounted = false }
  }, [orderId, pollCount])

  const statusConfig = {
    approved: {
      icon: <CheckCircle2 size={64} />,
      title: '¡Pago Aprobado!',
      subtitle: 'Tu pedido ha sido confirmado exitosamente.',
      color: '#22c55e',
      bgGradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      borderColor: '#bbf7d0',
    },
    confirmed: {
      icon: <CheckCircle2 size={64} />,
      title: '¡Pago Aprobado!',
      subtitle: 'Tu pedido ha sido confirmado exitosamente.',
      color: '#22c55e',
      bgGradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      borderColor: '#bbf7d0',
    },
    rejected: {
      icon: <XCircle size={64} />,
      title: 'Pago Rechazado',
      subtitle: 'No se pudo procesar tu pago. Por favor intenta de nuevo.',
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
      borderColor: '#fca5a5',
    },
    cancelled: {
      icon: <XCircle size={64} />,
      title: 'Pago Rechazado',
      subtitle: 'No se pudo procesar tu pago. Por favor intenta de nuevo.',
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
      borderColor: '#fca5a5',
    },
    pending: {
      icon: <Clock size={64} />,
      title: 'Pago Pendiente',
      subtitle: 'Estamos verificando tu pago. Esto puede tomar unos minutos.',
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      borderColor: '#fde68a',
    },
  }

  const config = statusConfig[orderStatus as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: '#fafafa',
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0px rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .result-card {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>

      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 500 }}>
            Verificando tu pago...
          </p>
        </div>
      ) : (
        <div className="result-card" style={{
          width: '100%',
          maxWidth: '440px',
          background: 'white',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        }}>
          {/* Header con gradiente */}
          <div style={{
            background: config.bgGradient,
            padding: '48px 32px 40px',
            textAlign: 'center',
            borderBottom: `2px solid ${config.borderColor}`,
          }}>
            <div style={{
              color: config.color,
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px',
              animation: orderStatus === 'confirmed' || orderStatus === 'approved' 
                ? 'pulse-glow 2s ease-in-out infinite' : 'none',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'white',
              margin: '0 auto 20px',
              alignItems: 'center',
            }}>
              {config.icon}
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 8px',
            }}>
              {config.title}
            </h1>
            <p style={{
              fontSize: '15px',
              color: '#475569',
              margin: 0,
              lineHeight: 1.5,
            }}>
              {config.subtitle}
            </p>
          </div>

          {/* Detalle */}
          <div style={{ padding: '28px 32px' }}>
            {orderId && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '14px 0',
                borderBottom: '1px solid #f1f5f9',
              }}>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Pedido</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                  #{orderId.slice(0, 8)}
                </span>
              </div>
            )}

            {totalAmount && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '14px 0',
                borderBottom: '1px solid #f1f5f9',
              }}>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Total</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  ${totalAmount.toLocaleString('es-CO')}
                </span>
              </div>
            )}

            {efipayStatus && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '14px 0',
                borderBottom: '1px solid #f1f5f9',
              }}>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Estado Efipay</span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: config.bgGradient,
                  color: config.color,
                }}>
                  {efipayStatus}
                </span>
              </div>
            )}

            {orderStatus === 'pending' && pollCount < 12 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px',
                background: '#fffbeb',
                borderRadius: '14px',
                marginTop: '16px',
              }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
                <span style={{ fontSize: '13px', color: '#92400e' }}>
                  Verificando estado... ({12 - pollCount} intentos restantes)
                </span>
              </div>
            )}
          </div>

          {/* Botones */}
          <div style={{ padding: '0 32px 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {storeSlug && (
              <button
                onClick={() => router.push(`/tienda/${storeSlug}`)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#0f172a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                <ShoppingBag size={18} />
                Volver a la tienda
              </button>
            )}

            <button
              onClick={() => router.push('/')}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <ArrowLeft size={16} />
              Ir al inicio
            </button>
          </div>
        </div>
      )}

      {/* Powered by */}
      <div style={{
        marginTop: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: '#94a3b8',
      }}>
        Pago procesado por
        <span style={{ fontWeight: 700, color: '#64748b' }}>Efipay</span>
        ×
        <span style={{ fontWeight: 700, color: '#64748b' }}>LocalEcomer</span>
      </div>
    </div>
  )
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  )
}
