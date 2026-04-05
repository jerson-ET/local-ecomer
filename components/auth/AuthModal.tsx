'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, CheckCircle, Send, ShieldCheck, Store, UserPlus, Loader2 } from 'lucide-react'
import './auth-modal.css'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*     MODAL DE AUTENTICACIÓN — TELEGRAM OTP                                   */
/*                                                                              */
/*   Flujo:                                                                    */
/*   1. El usuario ingresa su @username de Telegram                            */
/*   2. Recibe un código OTP en su Telegram                                    */
/*   3. Lo ingresa aquí                                                        */
/*   4. Si ya tiene cuenta → entra al dashboard                                */
/*   5. Si es nuevo → se abre formulario de registro                          */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface AuthModalProps {
  onClose: () => void
  onSuccess: (user: unknown) => void
  defaultView?: 'login'
  defaultRole?: 'buyer' | 'seller' | 'reseller'
  hideRoleSelector?: boolean
  initialRefCode?: string
}

type ViewStep = 'telegram' | 'otp' | 'register' | 'success'

export default function AuthModal({
  onClose,
  onSuccess,
  initialRefCode,
}: AuthModalProps) {
  const supabase = createClient()

  /* ── Estado General ── */
  const [step, setStep] = useState<ViewStep>('telegram')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  /* ── Datos del Formulario ── */
  const [telegramUsername, setTelegramUsername] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [_isExistingUser, setIsExistingUser] = useState(false)

  /* ── Registro (solo nuevos) ── */
  const [storeName, setStoreName] = useState('')
  const [email, setEmail] = useState('')
  const [referralCode, setReferralCode] = useState(initialRefCode || '')
  const [registrationToken, setRegistrationToken] = useState('')

  /* ─────────────────────────────────────────────────────────────────────── */
  /*                         PASO 1: ENVIAR OTP                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  const handleSendOTP = async () => {
    setError('')
    const phone = telegramUsername.replace(/[^\d+]/g, '')
    if (!phone) return setError('Ingresa tu número de celular')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/telegram/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.needsBot) {
          setError('Primero abre @Localecomerbot en Telegram y presiona /start. Luego vuelve aquí.')
        } else {
          setError(data.error || 'Error enviando código')
        }
        return
      }

      setIsExistingUser(data.isExistingUser || false)
      setStep('otp')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*                        PASO 2: VERIFICAR OTP                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  const handleVerifyOTP = async () => {
    setError('')
    if (!otpCode || otpCode.length !== 6) return setError('Ingresa el código de 6 dígitos')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/telegram/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: telegramUsername.replace(/[^\d+]/g, ''),
          code: otpCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Código incorrecto')
        return
      }

      /* ── Usuario existente → login directo ── */
      if (!data.isNewUser && data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        setSuccessMessage('¡Bienvenido de vuelta!')
        setStep('success')
        setTimeout(() => onSuccess(data.user), 1200)
        return
      }

      /* ── Usuario nuevo → formulario de registro ── */
      if (data.needsRegistration) {
        setRegistrationToken(data.registrationToken)
        setStoreName(data.telegramData?.first_name || '')
        setStep('register')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*                     PASO 3: COMPLETAR REGISTRO                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  const handleRegister = async () => {
    setError('')
    if (!storeName.trim()) return setError('Nombre de tu tienda es obligatorio')
    if (!email.trim()) return setError('Email es obligatorio para facturas legales')
    if (!email.includes('@')) return setError('Email no válido')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/telegram/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationToken,
          storeName: storeName.trim(),
          email: email.trim(),
          referralCode: referralCode.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error creando la cuenta')
        return
      }

      /* ── Login automático ── */
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
      }

      setSuccessMessage('¡Cuenta creada! Bienvenido a LocalEcomer 🎉')
      setStep('success')
      setTimeout(() => onSuccess(data.user), 1500)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*                              RENDER UI                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="auth-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-form">

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  PASO 1: INGRESAR TELEGRAM USERNAME                       */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 'telegram' && (
            <>
              <div className="auth-step-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📱</div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                  Ingresa con tu Celular
                </h3>
                <p style={{ color: '#475569', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                  Ingresa tu número para recibir un código por Telegram
                </p>
              </div>

              <div className="auth-field">
                <Send size={18} />
                <input
                  type="tel"
                  placeholder="Ej: 3001234567"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  autoFocus
                />
              </div>

              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '13px',
                color: '#0369a1',
                lineHeight: 1.5,
                marginTop: '8px',
              }}>
                💡 <strong>¿Primera vez?</strong> Abre <a href="https://t.me/Localecomerbot" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, textDecoration: 'underline' }}>@Localecomerbot</a> en Telegram, presiona <strong>/start</strong> y haz clic en <strong>"Compartir Mi Número"</strong>.
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  PASO 2: VERIFICAR CÓDIGO OTP                             */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 'otp' && (
            <>
              <div className="auth-step-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔐</div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                  Código de Verificación
                </h3>
                <p style={{ color: '#475569', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                  Revisa tu <strong>Telegram</strong>. Te enviamos un código de 6 dígitos al bot de LocalEcomer.
                </p>
              </div>

              <div className="auth-field">
                <ShieldCheck size={18} />
                <input
                  type="text"
                  placeholder="Código de 6 dígitos"
                  value={otpCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtpCode(v)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  autoFocus
                  style={{ letterSpacing: '8px', fontSize: '24px', fontWeight: 800, textAlign: 'center' }}
                />
              </div>

              <button
                className="auth-submit"
                style={{ background: 'none', color: '#6366f1', boxShadow: 'none', fontSize: '13px', padding: '8px', marginTop: '0' }}
                onClick={() => {
                  setOtpCode('')
                  setStep('telegram')
                  handleSendOTP()
                }}
                disabled={loading}
              >
                ¿No recibiste el código? Reenviar
              </button>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  PASO 3: FORMULARIO DE REGISTRO                           */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 'register' && (
            <>
              <div className="auth-step-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏪</div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                  Crea tu Tienda
                </h3>
                <p style={{ color: '#475569', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                  Solo necesitamos estos datos para activar tu cuenta
                </p>
              </div>

              <div className="auth-field">
                <Store size={18} />
                <input
                  type="text"
                  placeholder="Nombre de tu tienda"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="auth-field">
                <Send size={18} />
                <input
                  type="email"
                  placeholder="Email para facturas legales"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <UserPlus size={18} />
                <input
                  type="text"
                  placeholder="Código de invitación (opcional)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>

              <div style={{
                background: '#fefce8',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#92400e',
                lineHeight: 1.5,
                marginTop: '4px',
              }}>
                🎁 <strong>7 días gratis</strong> para que pruebes la plataforma. Sin tarjeta de crédito.
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  PASO 4: ÉXITO                                            */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle size={64} style={{ color: '#22c55e', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                {successMessage}
              </h3>
              <p style={{ color: '#475569', fontSize: '14px' }}>
                Redirigiendo al panel de control...
              </p>
            </div>
          )}

          {/* ── Mensajes de Error ── */}
          {error && <div className="auth-error">{error}</div>}

          {/* ── Botones de Acción ── */}
          {step === 'telegram' && (
            <button
              className="auth-submit"
              disabled={loading}
              onClick={handleSendOTP}
              style={{
                background: 'linear-gradient(135deg, #0088cc 0%, #229ED9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {loading ? 'Enviando...' : 'Enviar Código por Telegram'}
            </button>
          )}

          {step === 'otp' && (
            <button
              className="auth-submit"
              disabled={loading || otpCode.length !== 6}
              onClick={handleVerifyOTP}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              {loading ? 'Verificando...' : 'Verificar Código'}
            </button>
          )}

          {step === 'register' && (
            <button
              className="auth-submit"
              disabled={loading}
              onClick={handleRegister}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Store size={18} />}
              {loading ? 'Creando tu tienda...' : 'Crear Mi Tienda Gratis'}
            </button>
          )}

          {/* ── Navegación ── */}
          {step === 'otp' && (
            <p className="auth-switch">
              <button onClick={() => { setStep('telegram'); setOtpCode(''); setError('') }}>
                ← Cambiar usuario de Telegram
              </button>
            </p>
          )}
          {step === 'register' && (
            <p className="auth-switch">
              <button onClick={() => { setStep('otp'); setError('') }}>
                ← Volver
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
