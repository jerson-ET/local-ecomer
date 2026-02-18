'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Store, ShoppingBag, Users, LogIn, UserPlus, CreditCard, X } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*             NAVEGACIÓN GLOBAL — VISIBLE EN TODAS LAS PÁGINAS                */
/*                                                                              */
/*   5 botones siempre visibles:                                               */
/*   MarketPlace | Tiendas | Comunidad | Login | Registro                      */
/*   "Planes" está dentro del modal de Registro                                */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function GlobalNav() {
  const pathname = usePathname()
  const [showRegistroModal, setShowRegistroModal] = useState(false)

  // Determinar qué pestaña está activa basado en la ruta
  const getActiveTab = () => {
    if (pathname === '/' || pathname === '') return 'marketplace'
    if (pathname.startsWith('/tiendas')) return 'tiendas'
    if (pathname.startsWith('/store')) return 'tiendas'
    if (pathname.startsWith('/community')) return 'comunidad'
    return 'marketplace'
  }

  const activeTab = getActiveTab()

  return (
    <>
      <nav className="global-nav" id="global-nav">
        <div className="global-nav__inner">
          {/* ── Sección principal: 5 botones ── */}
          <div className="global-nav__tabs">
            <Link
              href="/"
              className={`global-nav__tab ${activeTab === 'marketplace' ? 'global-nav__tab--active' : ''}`}
            >
              <Store size={18} />
              <span>MarketPlace</span>
            </Link>
            <Link
              href="/tiendas"
              className={`global-nav__tab ${activeTab === 'tiendas' ? 'global-nav__tab--active' : ''}`}
            >
              <ShoppingBag size={18} />
              <span>Tiendas</span>
            </Link>
            <Link
              href="/community"
              className={`global-nav__tab ${activeTab === 'comunidad' ? 'global-nav__tab--active' : ''}`}
            >
              <Users size={18} />
              <span>Comunidad</span>
            </Link>
            <Link href="/dashboard" className="global-nav__tab global-nav__tab--login">
              <LogIn size={18} />
              <span>Login</span>
            </Link>
            <button
              onClick={() => setShowRegistroModal(true)}
              className="global-nav__tab global-nav__tab--registro"
            >
              <UserPlus size={18} />
              <span>Registro</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Modal de Registro (incluye Planes) ── */}
      {showRegistroModal && (
        <div className="registro-overlay" onClick={() => setShowRegistroModal(false)}>
          <div className="registro-modal" onClick={(e) => e.stopPropagation()}>
            <button className="registro-modal__close" onClick={() => setShowRegistroModal(false)}>
              <X size={20} />
            </button>

            <div className="registro-modal__header">
              <UserPlus size={28} />
              <h2>Únete a LocalEcomer</h2>
              <p>Crea tu cuenta y empieza a vender o comprar</p>
            </div>

            <div className="registro-modal__actions">
              <Link
                href="/dashboard"
                className="registro-modal__btn registro-modal__btn--primary"
                onClick={() => setShowRegistroModal(false)}
              >
                <UserPlus size={18} />
                Crear Cuenta Gratis
              </Link>

              <Link
                href="/dashboard"
                className="registro-modal__btn registro-modal__btn--secondary"
                onClick={() => setShowRegistroModal(false)}
              >
                <LogIn size={18} />
                Ya tengo cuenta — Iniciar Sesión
              </Link>

              <div className="registro-modal__divider">
                <span>Planes de Vendedor</span>
              </div>

              <Link
                href="/dashboard"
                className="registro-modal__btn registro-modal__btn--plans"
                onClick={() => setShowRegistroModal(false)}
              >
                <CreditCard size={18} />
                <div className="registro-modal__plan-info">
                  <strong>Ver Planes Premium</strong>
                  <span>Desde $15/mes — 30 días gratis</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
