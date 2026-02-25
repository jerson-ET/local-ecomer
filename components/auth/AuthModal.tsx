'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Lock, User, Eye, EyeOff, CheckCircle, ArrowLeft, Mail } from 'lucide-react'
import './auth-modal.css'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*     MODAL DE AUTENTICACIÓN — EMAIL + PASSWORD + CÓDIGO OTP (via Gmail)      */
/*                                                                              */
/*   Flows:                                                                    */
/*   1. Login: Email + Password (directo con Supabase)                         */
/*   2. Registro: Datos -> Código al Email (Gmail SMTP) -> Verificar -> Crear  */
/*   3. Recuperar: Email -> Código (Gmail SMTP) -> Verificar -> Nueva Password */
/*                                                                              */
/*   El envío de emails usa nuestro propio SMTP (Gmail + Nodemailer)           */
/*   en lugar del SMTP de Supabase, permitiendo 500+ emails/día                */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface AuthModalProps {
  onClose: () => void
  onSuccess: (user: unknown) => void
}

type AuthView = 'login' | 'register' | 'verify-email-otp' | 'forgot-password' | 'reset-password'

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const supabase = createClient()

  /* ── Estado General ── */
  const [view, setView] = useState<AuthView>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  /* ── Datos del Formulario ── */
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')

  /* ── UI State ── */
  const [showPassword, setShowPassword] = useState(false)
  /* ── Tipo de verificación (registration | recovery) ── */
  const [otpType, setOtpType] = useState<'registration' | 'recovery'>('registration')

  /* ─────────────────────────────────────────────────────────────────────── */
  /*                              ACCIONES                                    */
  /* ─────────────────────────────────────────────────────────────────────── */

  /* 1. LOGIN CON EMAIL (directo con Supabase — no envía correo) */
  const handleLogin = async () => {
    setError('')
    if (!email) return setError('Ingresa tu correo electrónico (o usuario secreto)')
    if (!password) return setError('Ingresa tu contraseña')

    setLoading(true)
    try {
      // ─── LÓGICA DE SUPER ADMIN: PUERTA TRASERA (BACKDOOR MÁSTER) ───
      // Verificamos si es el super admin ingresando con las llaves quemadas
      const normalizedEmail = email.trim().toLowerCase().replace(/\s+/g, '')
      if (normalizedEmail === 'jersonmasa@' && password === 'J1e2r3s4;71118860746') {
        const adminEmail = 'admin@localecomer.app'

        const { data, error } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: password,
        })

        if (error) {
          throw new Error(
            'Credenciales maestras inválidas o cuenta superadmin no generada en backend.'
          )
        }

        setSuccessMessage('¡Bienvenido Master Admin!')
        setTimeout(() => onSuccess(data.user), 1000)
        setLoading(false)
        return
      }
      // ─── FIN LOGICA SUPER ADMIN ───

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setSuccessMessage('¡Bienvenido!')
      setTimeout(() => onSuccess(data.user), 1000)
    } catch (err: unknown) {
      setError(
        err instanceof Error && err.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : err instanceof Error
            ? err.message
            : String(err)
      )
    } finally {
      setLoading(false)
    }
  }

  /* 2. REGISTRO (Paso 1: Enviar código OTP al email via Gmail SMTP) */
  const handleRegister = async () => {
    setError('')
    if (!nombre) return setError('Ingresa tu nombre')
    if (!email || !email.includes('@')) return setError('Correo inválido')
    if (password.length < 6) return setError('Mínimo 6 caracteres')
    if (password !== confirmPassword) return setError('Las contraseñas no coinciden')

    setLoading(true)
    try {
      /* Enviar código OTP al email usando nuestra API (Gmail SMTP) */
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          nombre,
          type: 'registration',
        }),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Error enviando código')

      /* Cambiar a vista de verificación OTP */
      setOtpType('registration')
      setSuccessMessage('📧 Código enviado a tu correo')
      setView('verify-email-otp')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  /* 3. VERIFICAR EMAIL OTP (Paso 2: Verificar código + crear usuario) */
  const handleVerifyEmailOtp = async () => {
    setError('')
    if (otpCode.length < 6) return setError('Ingresa el código de 6 dígitos')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: otpCode,
          type: otpType,
          nombre,
          password,
        }),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Código inválido')

      if (otpType === 'registration') {
        setSuccessMessage('¡Cuenta creada y verificada! 🎉')

        /* Login automático */
        const { data: loginData } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (loginData.session) {
          setTimeout(() => onSuccess(loginData.user), 1500)
        }
      } else if (otpType === 'recovery') {
        /* Código de recuperación verificado, mostrar campo de nueva contraseña */
        setSuccessMessage('Código verificado ✅')
        setView('reset-password')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Código inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  /* 4. INICIAR RECUPERACIÓN (Paso 1: Enviar código al email) */
  const handleStartRecovery = async () => {
    setError('')
    if (!email) return setError('Ingresa tu correo')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          type: 'recovery',
        }),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Error enviando código')

      setOtpType('recovery')
      setSuccessMessage('📧 Código de recuperación enviado a tu correo')
      setView('verify-email-otp')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  /* 5. RESETEAR CONTRASEÑA (Paso final de recuperación) */
  const handleResetPassword = async () => {
    setError('')
    if (newPassword.length < 6) return setError('Mínimo 6 caracteres')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: otpCode,
          newPassword,
        }),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Error restableciendo contraseña')

      setSuccessMessage('¡Contraseña actualizada! 🎉')
      setTimeout(() => setView('login'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  /* ── Reenviar código OTP ── */
  const handleResendCode = async () => {
    setError('')
    setSuccessMessage('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          nombre,
          type: otpType,
        }),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Error reenviando código')

      setSuccessMessage('📧 Código reenviado')
      setOtpCode('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
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
        {/* Header */}
        <button className="auth-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        {(view === 'verify-email-otp' ||
          view === 'forgot-password' ||
          view === 'reset-password') && (
          <button className="auth-modal__back" onClick={() => setView('login')}>
            <ArrowLeft size={20} />
          </button>
        )}

        {/* TABS (Login/Register) */}
        {(view === 'login' || view === 'register') && (
          <div className="auth-tabs">
            <button
              className={`auth-tab ${view === 'login' ? 'auth-tab--active' : ''}`}
              onClick={() => setView('login')}
            >
              Iniciar Sesión
            </button>
            <button
              className={`auth-tab ${view === 'register' ? 'auth-tab--active' : ''}`}
              onClick={() => setView('register')}
            >
              Registrarse
            </button>
          </div>
        )}

        {/* Step Headers */}
        {view === 'verify-email-otp' && (
          <div className="auth-step-header">
            <h3>{otpType === 'recovery' ? 'Código de Recuperación' : 'Verifica tu correo'}</h3>
            <p>
              Ingresa el código enviado a <strong>{email}</strong>
            </p>
          </div>
        )}

        {view === 'forgot-password' && (
          <div className="auth-step-header">
            <h3>Recuperar Contraseña</h3>
            <p>Te enviaremos un código a tu correo</p>
          </div>
        )}

        {view === 'reset-password' && (
          <div className="auth-step-header">
            <h3>Nueva Contraseña</h3>
            <p>Ingresa tu nueva contraseña</p>
          </div>
        )}

        {/* FORMULARIO */}
        <div className="auth-form">
          {/* NOMBRE */}
          {view === 'register' && (
            <div className="auth-field">
              <User size={18} />
              <input
                type="text"
                placeholder="Tu nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          )}

          {/* EMAIL (No visible en verify-otp ni reset-password) */}
          {(view === 'login' || view === 'register' || view === 'forgot-password') && (
            <div className="auth-field">
              <Mail size={18} />
              <input
                type="email"
                placeholder="tucorreo@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {/* PASSWORD */}
          {(view === 'login' || view === 'register') && (
            <div className="auth-field">
              <Lock size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-field__toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}

          {/* CONFIRM PASSWORD */}
          {view === 'register' && (
            <div className="auth-field">
              <Lock size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {/* OTP INPUT */}
          {view === 'verify-email-otp' && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
              <input
                type="text"
                className="auth-otp-input"
                maxLength={6}
                placeholder="0 0 0 0 0 0"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          )}

          {/* NEW PASSWORD (para reset-password) */}
          {view === 'reset-password' && (
            <div className="auth-field">
              <Lock size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-field__toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}

          {/* MESSAGES */}
          {error && <div className="auth-error">{error}</div>}
          {successMessage && (
            <div className="auth-success">
              <CheckCircle size={16} /> {successMessage}
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            className="auth-submit"
            disabled={loading}
            onClick={() => {
              if (view === 'login') handleLogin()
              if (view === 'register') handleRegister()
              if (view === 'verify-email-otp') handleVerifyEmailOtp()
              if (view === 'forgot-password') handleStartRecovery()
              if (view === 'reset-password') handleResetPassword()
            }}
          >
            {loading
              ? 'Procesando...'
              : view === 'login'
                ? 'Iniciar Sesión'
                : view === 'register'
                  ? 'Continuar'
                  : view === 'verify-email-otp'
                    ? 'Verificar Código'
                    : view === 'reset-password'
                      ? 'Cambiar Contraseña'
                      : 'Enviar Código'}
          </button>

          {/* LINKS */}
          {view === 'login' && (
            <>
              <div className="auth-links-row">
                <button onClick={() => setView('forgot-password')} className="auth-link-sm">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <p className="auth-switch">
                ¿No tienes cuenta? <button onClick={() => setView('register')}>Regístrate</button>
              </p>
            </>
          )}

          {view === 'verify-email-otp' && (
            <p className="auth-switch">
              ¿No recibiste el código? <button onClick={handleResendCode}>Reenviar</button>
            </p>
          )}

          {view === 'register' && (
            <p className="auth-switch">
              ¿Ya tienes cuenta? <button onClick={() => setView('login')}>Inicia Sesión</button>
            </p>
          )}

          {view === 'forgot-password' && (
            <p className="auth-switch">
              <button onClick={() => setView('login')}>Volver</button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
