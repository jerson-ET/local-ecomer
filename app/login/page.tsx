'use client'

import { useRouter } from 'next/navigation'
import AuthModal from '@/components/auth/AuthModal'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-purple-700 flex items-center justify-center p-4">
      <AuthModal 
        isStandalone={true} 
        onSuccess={() => router.push('/dashboard')} 
      />
    </div>
  )
}
