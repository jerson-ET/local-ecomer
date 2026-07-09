'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthModal from '@/components/auth/AuthModal'
import { ShoppingBag, Store, ArrowRight } from 'lucide-react'
import './login.css'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*   PÁGINA DE LOGIN — SELECTOR DE ROL + AUTH MODAL                            */
/*                                                                              */
/*   1. Primero muestra selector: ¿Comprador o Vendedor?                       */
/*   2. Según la elección, abre AuthModal con intendedRole adecuado            */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

type SelectedRole = 'buyer' | 'seller' | null

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null)

  const handleSuccess = () => {
    if (selectedRole === 'buyer') {
      router.push('/dashboard?section=panel&role=buyer')
    } else {
      router.push('/dashboard')
    }
  }

  /* ── Si ya eligió rol, mostrar el AuthModal correspondiente ── */
  if (selectedRole) {
    return (
      <div className="login-page">
        <AuthModal
          isStandalone={true}
          intendedRole={selectedRole}
          onSuccess={handleSuccess}
          onClose={() => setSelectedRole(null)}
        />
      </div>
    )
  }

  /* ── Selector de Rol ── */
  return (
    <div className="login-page">
      <div className="role-picker">
        {/* Header */}
        <div className="role-picker__header">
          <div className="role-picker__emoji">👋</div>
          <h2 className="role-picker__title">¡Bienvenido!</h2>
          <p className="role-picker__subtitle">¿Cómo deseas ingresar?</p>
        </div>

        {/* Opciones */}
        <div className="role-picker__options">
          {/* Opción Comprador */}
          <button
            className="role-card role-card--buyer"
            onClick={() => setSelectedRole('buyer')}
          >
            <div className="role-card__icon-wrap role-card__icon-wrap--buyer">
              <ShoppingBag size={28} />
            </div>
            <div className="role-card__text">
              <h3 className="role-card__name">Comprador</h3>
              <p className="role-card__desc">
                Explora productos, guarda favoritos y realiza pedidos
              </p>
            </div>
            <ArrowRight size={18} className="role-card__arrow" />
          </button>

          {/* Opción Vendedor */}
          <button
            className="role-card role-card--seller"
            onClick={() => setSelectedRole('seller')}
          >
            <div className="role-card__icon-wrap role-card__icon-wrap--seller">
              <Store size={28} />
            </div>
            <div className="role-card__text">
              <h3 className="role-card__name">Vendedor</h3>
              <p className="role-card__desc">
                Crea tu tienda, publica productos y gestiona ventas
              </p>
            </div>
            <ArrowRight size={18} className="role-card__arrow" />
          </button>
        </div>

        {/* Footer */}
        <p className="role-picker__footer">
          Podrás cambiar tu rol más adelante desde tu perfil
        </p>
      </div>
    </div>
  )
}
