'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  X, 
  CheckCircle, 
  LogIn, 
  Loader2, 
  Mail, 
  Lock, 
  ArrowRight, 
  Building2, 
  User, 
  Hash, 
  MapPin, 
  ArrowLeft,
  Briefcase,
  UserPlus
} from 'lucide-react'
import './auth-modal.css'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*     MODAL DE AUTENTICACIÓN — GOOGLE + EMAIL (PREMIUM)                        */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface AuthModalProps {
  onClose: () => void
  onSuccess: (user: any) => void
  initialRefCode?: string
}

type AuthView = 'login' | 'register-email' | 'register-otp' | 'register-profile' | 'success'

export default function AuthModal({ onClose, onSuccess, initialRefCode }: AuthModalProps) {
  const supabase = createClient()

  /* ── Estado General ── */
  const [view, setView] = useState<AuthView>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  /* ── Datos de Login / Registro ── */
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  
  /* ── Perfil de Usuario ── */
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [documentType, setDocumentType] = useState('CC')
  const [documentNumber, setDocumentNumber] = useState('')
  const [businessCity, setBusinessCity] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')


  /* ─────────────────────────────────────────────────────────────────────── */
  /*                         ACCIONES DE AUTH                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Error al conectar con Google')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!email || !password) return setError('Completa email y contraseña')
    setError('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) throw error
      if (data.user) {
        setSuccessMessage('¡Bienvenido de vuelta!')
        setView('success')
        setTimeout(() => onSuccess(data.user), 1200)
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!email) return setError('Ingresa tu correo electrónico')
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
      })
      if (error) throw error
      setView('register-otp')
    } catch (err: any) {
      setError(err.message || 'Error al enviar código')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) return setError('Ingresa el código de 6 dígitos')
    setError('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode,
        type: 'email',
      })
      if (error) throw error
      if (data.user) setView('register-profile')
    } catch (err: any) {
      setError(err.message || 'Código incorrecto')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteRegistration = async () => {
    if (!fullName || !businessName || !password) return setError('Completa los campos obligatorios')
    if (password !== confirmPassword) return setError('Las contraseñas no coinciden')
    
    setError('')
    setLoading(true)
    try {
      const { data: userUpdate, error: userError } = await supabase.auth.updateUser({
        password: password,
        data: {
          full_name: fullName,
          business_name: businessName,
          business_type: businessType,
          document_type: documentType,
          document_number: documentNumber,
          city: businessCity,
          role: 'seller',

        }
      })
      if (userError) throw userError

      /* Crear tienda automática */
      await supabase.from('stores').insert({
        user_id: userUpdate.user?.id,
        name: businessName,
        slug: businessName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        is_active: true,
        plan: 'free'
      })

      setSuccessMessage('¡Cuenta creada!')
      setView('success')
      setTimeout(() => onSuccess(userUpdate.user), 1200)
    } catch (err: any) {
      setError(err.message || 'Error al finalizar registro')
    } finally {
      setLoading(false)
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*                              COMPONENTES UI                              */
  /* ─────────────────────────────────────────────────────────────────────── */

  const renderHeader = () => {
    const content = {
      'login': { emoji: '🔑', title: 'Acceder', sub: 'Ingresa con un clic o con tu correo.' },
      'register-email': { emoji: '🚀', title: 'Crear Cuenta', sub: 'Empieza a vender hoy mismo.' },
      'register-otp': { emoji: '📩', title: 'Confirma tu Correo', sub: `Enviamos un código a ${email}` },
      'register-profile': { emoji: '👤', title: 'Tu Perfil', sub: 'Configura tu marca y tienda.' },
      'success': { emoji: '🎉', title: '¡Éxito!', sub: 'Entrando...' }
    }
    const current = content[view as keyof typeof content] || content.login

    return (
      <div className="auth-step-header">
        <div style={{ fontSize: '42px', marginBottom: '8px' }}>{current.emoji}</div>
        <h3>{current.title}</h3>
        <p>{current.sub}</p>
      </div>
    )
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} 
           style={{ maxWidth: view === 'register-profile' ? '440px' : '380px' }}>
        
        <button className="auth-modal__close" onClick={onClose}><X size={20} /></button>

        {view !== 'login' && view !== 'success' && view !== 'register-profile' && (
          <button className="auth-modal__back" onClick={() => setView('login')}><ArrowLeft size={18} /></button>
        )}

        <div className="auth-form">
          {view !== 'success' && renderHeader()}

          {/* ———— LOGIN / REGISTER SHARED (GOOGLE) ———— */}
          {(view === 'login' || view === 'register-email') && (
            <div className="auth-primary-action">
              <p className="auth-label-promo">✨ Recomendado: Acceso con 1 Clic</p>
              <button className="auth-google-btn" onClick={handleGoogleLogin} disabled={loading}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {view === 'login' ? 'Entrar con Google' : 'Unirse con Google'}
              </button>
              <div className="auth-divider"><span>o con tu correo</span></div>
            </div>
          )}

          {/* ———— LOGIN VIEW ———— */}
          {view === 'login' && (
            <>
              <div className="auth-field">
                <Mail size={18} />
                <input type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="auth-field">
                <Lock size={18} />
                <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button className="auth-submit" onClick={handleLogin} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <LogIn size={18} />} Entrar Ahora
              </button>
              <button className="auth-switch-btn" onClick={() => setView('register-email')} style={{ marginTop: '16px', width: '100%' }}>
                ¿No tienes cuenta? Regístrate <ArrowRight size={14} />
              </button>
            </>
          )}

          {/* ———— REGISTER EMAIL ———— */}
          {view === 'register-email' && (
            <>
              <div className="auth-field">
                <Mail size={18} />
                <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button className="auth-submit" onClick={handleSendOtp} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <Mail size={18} />} Enviar Código de Verificación
              </button>
              <button className="auth-switch-btn" onClick={() => setView('login')} style={{ marginTop: '16px', width: '100%' }}>
                ¿Ya tienes cuenta? Ingresa <ArrowRight size={14} />
              </button>
            </>
          )}

          {/* ———— OTP VERIFICATION ———— */}
          {view === 'register-otp' && (
            <>
              <input type="text" maxLength={6} placeholder="000000" className="auth-otp-input" value={otpCode} onChange={e => setOtpCode(e.target.value)} />
              <button className="auth-submit" onClick={handleVerifyOtp} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />} Verificar
              </button>
            </>
          )}

          {/* ———— PROFILE COMPLETION ———— */}
          {view === 'register-profile' && (
            <div className="auth-profile-scroll">
              <div className="auth-field-row"><User size={16} /><input type="text" placeholder="Tu Nombre Completo" value={fullName} onChange={e => setFullName(e.target.value)} /></div>
              <div className="auth-field-row"><Building2 size={16} /><input type="text" placeholder="Nombre de tu Negocio" value={businessName} onChange={e => setBusinessName(e.target.value)} /></div>
              <div className="auth-field-row"><Briefcase size={16} /><input type="text" placeholder="Tipo de Negocio" value={businessType} onChange={e => setBusinessType(e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="auth-select">
                  <option value="CC">Cédula</option><option value="NIT">NIT</option><option value="CE">Extranjería</option>
                </select>
                <div className="auth-field-row"><Hash size={16} /><input type="text" placeholder="Documento" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} /></div>
              </div>
              <div className="auth-field-row"><MapPin size={16} /><input type="text" placeholder="Ciudad" value={businessCity} onChange={e => setBusinessCity(e.target.value)} /></div>
              <div className="auth-field-row"><Lock size={16} /><input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} /></div>
              <div className="auth-field-row"><Lock size={16} /><input type="password" placeholder="Confirma Contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>

              <button className="auth-submit" onClick={handleCompleteRegistration} disabled={loading} style={{ marginTop: '16px' }}>
                {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={18} />} Crear Cuenta
              </button>
            </div>
          )}

          {/* ———— SUCCESS ———— */}
          {view === 'success' && (
            <div className="auth-success-view">
              <CheckCircle size={48} color="#10b981" />
              <h3>{successMessage}</h3>
            </div>
          )}

          {error && <div className="auth-error">⚠️ {error}</div>}
        </div>
      </div>
    </div>
  )
}
