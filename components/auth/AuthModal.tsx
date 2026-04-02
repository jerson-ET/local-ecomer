'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Lock, Eye, EyeOff, CheckCircle, Mail, MessageCircle } from 'lucide-react'
import './auth-modal.css'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*     MODAL DE AUTENTICACIÓN — SOLO LOGIN                                     */
/*                                                                              */
/*   El registro se maneja manualmente por el SuperAdmin.                      */
/*   Los usuarios reciben sus credenciales por WhatsApp.                       */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface AuthModalProps {
  onClose: () => void
  onSuccess: (user: unknown) => void
  defaultView?: 'login'
  defaultRole?: 'buyer' | 'seller' | 'reseller'
  hideRoleSelector?: boolean
}

export default function AuthModal({
  onClose,
  onSuccess,
}: AuthModalProps) {
  const supabase = createClient()

  /* ── Estado General ── */
  const [view, setView] = useState<'login' | 'need-account'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  /* ── Datos del Formulario ── */
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  /* ── UI State ── */
  const [showPassword, setShowPassword] = useState(false)

  /* ─────────────────────────────────────────────────────────────────────── */
  /*                              ACCIONES                                    */
  /* ─────────────────────────────────────────────────────────────────────── */

  /* LOGIN CON EMAIL + PASSWORD (directo con Supabase) */
  const handleLogin = async () => {
    setError('')
    if (!email) return setError('Ingresa tu correo electrónico')
    if (!password) return setError('Ingresa tu contraseña')

    setLoading(true)
    try {
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

        {view === 'need-account' && (
          <button className="auth-modal__back" onClick={() => setView('login')}>
            <Mail size={20} />
          </button>
        )}

        {/* FORMULARIO */}
        <div className="auth-form">
          {view === 'login' && (
            <>
              {/* Título */}
              <div className="auth-step-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>Iniciar Sesión</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                  Ingresa las credenciales que te fueron asignadas
                </p>
              </div>

              {/* EMAIL */}
              <div className="auth-field">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>

              {/* PASSWORD */}
              <div className="auth-field">
                <Lock size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  className="auth-field__toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </>
          )}

          {view === 'need-account' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <MessageCircle size={56} style={{ color: '#25D366', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px', color: '#0f172a' }}>
                ¿Necesitas una cuenta?
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                Las cuentas son creadas personalmente por el administrador.
                Escríbenos por <strong>WhatsApp</strong> y te daremos acceso:
              </p>
              <a
                href="https://wa.me/573001234567?text=Hola%2C%20quiero%20registrarme%20en%20LocalEcomer"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#25D366',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '16px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(37,211,102,0.3)',
                  transition: 'transform 0.2s',
                }}
              >
                <MessageCircle size={20} />
                Escribir por WhatsApp
              </a>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '16px' }}>
                También puedes contactarnos por nuestras redes sociales
              </p>
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
          {view === 'login' && (
            <button
              className="auth-submit"
              disabled={loading}
              onClick={handleLogin}
            >
              {loading ? 'Procesando...' : 'Iniciar Sesión'}
            </button>
          )}

          {/* LINKS */}
          {view === 'login' && (
            <p className="auth-switch">
              ¿No tienes cuenta?{' '}
              <button onClick={() => setView('need-account')}>Solicitar Acceso</button>
            </p>
          )}

          {view === 'need-account' && (
            <p className="auth-switch">
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => setView('login')}>Iniciar Sesión</button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
