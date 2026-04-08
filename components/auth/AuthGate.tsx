'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthModal from '@/components/auth/AuthModal'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AuthGate — Botón inteligente de autenticación                            */
/*  Si el usuario está logueado → redirige a fallbackHref                    */
/*  Si no está logueado → abre modal de auth con Email OTP                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface AuthGateProps {
  label: string
  className?: string
  fallbackHref: string
}

export default function AuthGate({ label, className, fallbackHref }: AuthGateProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAuth, setShowAuth] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  // Capturar código de referido de la URL (?ref=CODIGO)
  const refCode = searchParams.get('ref') || ''

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  const handleClick = () => {
    if (isLoggedIn) {
      router.push(fallbackHref)
    } else {
      setShowAuth(true)
    }
  }

  return (
    <>
      <button onClick={handleClick} className={className}>
        {label}
      </button>

      {showAuth && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAuth(false)}
          />
          <div className="w-full sm:max-w-md sm:rounded-2xl rounded-t-[20px] bg-white z-10 overflow-hidden shadow-2xl">
            <AuthModal
              onClose={() => setShowAuth(false)}
              onSuccess={() => {
                setShowAuth(false)
                router.push(fallbackHref)
              }}
              initialRefCode={refCode}
            />
          </div>
        </div>
      )}
    </>
  )
}
