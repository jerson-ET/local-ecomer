'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, CheckCircle, Send, ShieldCheck, Store, UserPlus, Loader2, Smartphone } from 'lucide-react'
import TelegramLoginButton from './TelegramLoginButton'
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

type ViewStep = 'telegram' | 'email' | 'otp' | 'email-otp' | 'register' | 'success'

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

  const handleSendEmailOTP = async () => {
    setError('')
    if (!email || !email.includes('@')) return setError('Ingresa un correo electrónico válido')

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setStep('email-otp')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmailOTP = async () => {
    setError('')
    if (!otpCode || otpCode.length !== 6) return setError('Ingresa el código de 6 dígitos enviado a tu correo')

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: 'email',
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.session) {
        setSuccessMessage('¡Bienvenido de vuelta!')
        setStep('success')
        setTimeout(() => onSuccess(data.user), 1200)
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleTelegramAuth = async (telegramUser: any) => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/telegram/login-widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramUser),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al validar login')
        return
      }

      /* ── Usuario existente → login directo ── */
      if (!data.needsRegistration && data.session) {
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
          setError('Primero ingresa al bot de Telegram y haz clic en "Compartir Mi Número".')
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
                  Inicia Sesión con Telegram 
                </h3>
                <p style={{ color: '#475569', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                  Escribe tu número abajo para una verificación rápida
                </p>
              </div>

              {/* Botón Oficial de Telegram (Widget) */}
              <TelegramLoginButton
                botName="Localecomerbot"
                onAuth={handleTelegramAuth}
                buttonSize="large"
                requestAccess="write"
              />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '16px 0',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#f1f5f9' }}></div>
                <span style={{ margin: '0 10px' }}>O ingresa manualmente</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#f1f5f9' }}></div>
              </div>

              <div className="auth-field">
                <Smartphone size={18} />
                <input
                  type="tel"
                  placeholder="Tu número (con +57...)"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
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
                marginTop: '12px',
              }}>
                💡 <strong>¿Primera vez?</strong> El botón oficial arriba te facilita todo. Si usas el ingreso manual, recuerda vincular tu teléfono en @Localecomerbot primero.
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    margin: '0 auto'
                  }}
                >
                  <Send size={16} />
                  O entrar con mi Correo Electrónico
                </button>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  PASO EXTRA: INGRESAR EMAIL                                */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 'email' && (
            <>
              <div className="auth-step-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✉️</div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                  Ingresa con tu Email
                </h3>
                <p style={{ color: '#475569', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                  Te enviaremos un código a tu correo para entrar directamente.
                </p>
              </div>

              <div className="auth-field">
                <Send size={18} />
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendEmailOTP()}
                  autoFocus
                />
              </div>

              <button
                className="auth-button"
                onClick={handleSendEmailOTP}
                disabled={loading}
              >
                {loading ? <Loader2 className="spinner" /> : 'Enviar código al correo'}
              </button>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('telegram')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#475569',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Volver a Telegram
                </button>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  PASO EXTRA: VERIFICAR EMAIL OTP                           */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 'email-otp' && (
            <>
              <div className="auth-step-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔢</div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                  Verifica tu Email
                </h3>
                <p style={{ color: '#475569', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                  Ingresa el código que enviamos a <b>{email}</b>
                </p>
              </div>

              <div className="auth-field">
                <CheckCircle size={18} />
                <input
                  type="text"
                  placeholder="Código de 6 dígitos"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyEmailOTP()}
                  autoFocus
                />
              </div>

              <button
                className="auth-button"
                onClick={handleVerifyEmailOTP}
                disabled={loading}
              >
                {loading ? <Loader2 className="spinner" /> : 'Verificar e Entrar'}
              </button>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#475569',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Cambiar correo
                </button>
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
