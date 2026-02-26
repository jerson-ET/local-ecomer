'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Store, ShoppingBag, LogIn, LogOut, User, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthModal from '@/components/auth/AuthModal'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*             NAVEGACIÓN GLOBAL — VISIBLE EN TODAS LAS PÁGINAS                */
/*                                                                              */
/*   4 botones:                                                                */
/*   MarketPlace | Tiendas | Comunidad | Inicia Sesión                         */
/*                                                                              */
/*   Cuando el usuario está logueado:                                          */
/*   MarketPlace | Tiendas | Comunidad | Mi Cuenta ▾                           */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface UserProfile {
  nombre: string
  telefono: string
}

/* ─── Sub-componente aislado que usa useSearchParams() ─── */
/* Debe estar en Suspense para que el build estático funcione                  */
function AuthParamsHandler({ onAuthRequired }: { onAuthRequired: (redirectTo?: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('auth') === 'required') {
      const redirect = searchParams.get('redirect') ?? undefined
      onAuthRequired(redirect)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return null
}

export default function GlobalNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingRedirect, setPendingRedirect] = useState<string | undefined>()
  const [user, setUser] = useState<unknown | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userStoreSlug, setUserStoreSlug] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const supabase = createClient()

  /* ── Callback para cuando el middleware detecta que se necesita auth ── */
  const handleAuthRequired = useCallback((redirectTo?: string) => {
    setPendingRedirect(redirectTo)
    setShowAuthModal(true)
  }, [])

  /* ── Escuchar cambios de autenticación ── */
  useEffect(() => {
    /* Verificar sesión actual */
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user)
        loadProfile(data.session.user.id)
      }
    })

    /* Listener para cambios de auth */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Cargar perfil del usuario ── */
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nombre, telefono')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Error loading profile:', error.message)
      } else if (data) {
        setProfile(data)
      }

      /* ── Cargar tienda del usuario (si tiene) ── */
      const { data: storeData } = await supabase
        .from('stores')
        .select('slug')
        .eq('user_id', userId)
        .maybeSingle()

      if (storeData) {
        setUserStoreSlug(storeData.slug)
      } else {
        setUserStoreSlug(null)
      }
    } catch (e) {
      console.error('Unexpected error loading profile:', e)
    }
  }

  /* ── Cerrar sesión ── */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setUser(null)
      setProfile(null)
      setShowUserMenu(false)
      router.push('/')
      router.refresh()
    }
  }

  /* ── Auth success callback ── */
  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    /* Si vino de una redirección de ruta protegida, llevar al destino */
    if (pendingRedirect && pendingRedirect.startsWith('/')) {
      router.push(pendingRedirect)
      setPendingRedirect(undefined)
    }
  }

  /* ── Determinar pestaña activa ── */
  const getActiveTab = () => {
    if (pathname === '/' || pathname === '') return 'marketplace'
    if (pathname.startsWith('/tiendas')) return 'tiendas'
    if (pathname.startsWith('/tienda/')) return 'mitienda'
    if (pathname.startsWith('/store')) return 'tiendas'
    if (pathname.startsWith('/community')) return 'comunidad'
    if (pathname.startsWith('/dashboard')) return 'administrar'
    return 'marketplace'
  }

  const activeTab = getActiveTab()

  /* ── Nombre corto para mostrar ── */
  const displayName = profile?.nombre ? profile.nombre.split(' ')[0] : 'Mi Cuenta'

  return (
    <>
      {/* Detector de parámetro ?auth=required — envuelto en Suspense */}
      <Suspense fallback={null}>
        <AuthParamsHandler onAuthRequired={handleAuthRequired} />
      </Suspense>

      <nav className="global-nav" id="global-nav">
        <div className="global-nav__inner">
          <div className="global-nav__tabs">
            <Link
              href="/"
              className={`global-nav__tab ${activeTab === 'marketplace' ? 'global-nav__tab--active' : ''}`}
            >
              <Store size={18} />
              <span>MarketPlace</span>
            </Link>
            {/* Condición: Si hay sesión "Mi Tienda", si no "Tiendas" */}
            {user ? (
              <>
                <Link
                  href={userStoreSlug ? `/tienda/${userStoreSlug}` : '/dashboard'}
                  className={`global-nav__tab ${activeTab === 'mitienda' ? 'global-nav__tab--active' : ''}`}
                >
                  <ShoppingBag size={18} />
                  <span>Mi Tienda</span>
                </Link>

                {/* Botón Administrar Explícito */}
                <Link
                  href="/dashboard"
                  className={`global-nav__tab ${activeTab === 'administrar' ? 'global-nav__tab--active' : ''}`}
                >
                  <LayoutDashboard size={18} />
                  <span>Administrar</span>
                </Link>
              </>
            ) : (
              <Link
                href="/tiendas"
                className={`global-nav__tab ${activeTab === 'tiendas' ? 'global-nav__tab--active' : ''}`}
              >
                <ShoppingBag size={18} />
                <span>Tiendas</span>
              </Link>
            )}
            {/* ── Botón de auth ── */}
            {user ? (
              <div className="global-nav__user-wrap">
                <button
                  className="global-nav__tab global-nav__tab--user"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User size={18} />
                  <span>{displayName}</span>
                </button>

                {/* Menú desplegable */}
                {showUserMenu && (
                  <div className="global-nav__dropdown">
                    <button
                      className="global-nav__dropdown-item global-nav__dropdown-item--logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="global-nav__tab global-nav__tab--login"
              >
                <LogIn size={18} />
                <span>Inicia Sesión</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Modal de Auth ── */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
      )}
    </>
  )
}
