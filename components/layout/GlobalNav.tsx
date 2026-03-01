'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Store, ShoppingBag, LogIn, LogOut, User, LayoutDashboard, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthModal from '@/components/auth/AuthModal'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*             NAVEGACIÓN GLOBAL — VISIBLE EN TODAS LAS PÁGINAS                */
/*                                                                              */
/*   MarketPlace | Tiendas | Red | Mi Cuenta / Inicia Sesión                    */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface UserProfile {
  nombre: string
  telefono: string
}

/* ─── Sub-componente aislado que usa useSearchParams() ─── */
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

  const handleAuthRequired = useCallback((redirectTo?: string) => {
    setPendingRedirect(redirectTo)
    setShowAuthModal(true)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user)
        loadProfile(data.session.user.id)
      }
    })

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

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    if (pendingRedirect && pendingRedirect.startsWith('/')) {
      router.push(pendingRedirect)
      setPendingRedirect(undefined)
    }
  }

  const getActiveTab = () => {
    if (pathname === '/' || pathname === '') return 'marketplace'
    if (pathname.startsWith('/tiendas')) return 'tiendas'
    if (pathname.startsWith('/tienda/')) return 'mitienda'
    if (pathname.startsWith('/store')) return 'tiendas'
    if (pathname.startsWith('/community')) return 'red'
    if (pathname.startsWith('/dashboard')) return 'administrar'
    return 'marketplace'
  }

  const activeTab = getActiveTab()
  const displayName = profile?.nombre ? profile.nombre.split(' ')[0] : 'Mi Cuenta'

  return (
    <>
      <Suspense fallback={null}>
        <AuthParamsHandler onAuthRequired={handleAuthRequired} />
      </Suspense>

      <nav className="global-nav" id="global-nav">
        <div className="global-nav__inner">
          <div className="global-nav__tabs">
            {/* Tab 1: Marketplace */}
            <Link
              href="/"
              className={`global-nav__tab ${activeTab === 'marketplace' ? 'global-nav__tab--active' : ''}`}
            >
              <Store size={18} />
              <span>Tiendas</span>
            </Link>

            {/* Tab 2: Mi Tienda / Explorar Tiendas */}
            {user ? (
              <Link
                href={userStoreSlug ? `/tienda/${userStoreSlug}` : '/dashboard'}
                className={`global-nav__tab ${activeTab === 'mitienda' ? 'global-nav__tab--active' : ''}`}
              >
                <ShoppingBag size={18} />
                <span>Mi Tienda</span>
              </Link>
            ) : (
              <Link
                href="/tiendas"
                className={`global-nav__tab ${activeTab === 'tiendas' ? 'global-nav__tab--active' : ''}`}
              >
                <ShoppingBag size={18} />
                <span>Explorar</span>
              </Link>
            )}

            {/* Tab 3: Dropshipping Network */}
            <Link
              href="/community"
              className={`global-nav__tab ${activeTab === 'red' ? 'global-nav__tab--active' : ''}`}
            >
              <Share2 size={18} />
              <span>Red</span>
            </Link>

            {/* Tab 4: Usuario */}
            {user ? (
              <div className="global-nav__user-wrap">
                <button
                  className="global-nav__tab global-nav__tab--user"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User size={18} />
                  <span>{displayName}</span>
                </button>

                {showUserMenu && (
                  <div className="global-nav__dropdown">
                    <Link
                      href="/dashboard"
                      className="global-nav__dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <LayoutDashboard size={16} />
                      Panel de Control
                    </Link>
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
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
      )}
    </>
  )
}
