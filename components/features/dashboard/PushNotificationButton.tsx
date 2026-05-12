'use client'

import React, { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2, CheckCircle2 } from 'lucide-react'
import { subscribeUserToPush } from '@/lib/push-notifications'
import { motion } from 'framer-motion'

export default function PushNotificationButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window
      setIsSupported(supported)
    }
  }, [])

  const handleSubscribe = async () => {
    try {
      setStatus('loading')
      await subscribeUserToPush()
      setStatus('success')
    } catch (err) {
      console.error('Error al suscribirse:', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  if (!isSupported) return null

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleSubscribe}
      disabled={status === 'loading' || status === 'success'}
      className={`
        relative flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all
        ${status === 'success' ? 'bg-green-100 text-green-700 border-2 border-green-200' : 
          status === 'error' ? 'bg-red-50 text-red-600 border-2 border-red-100' :
          'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700'}
      `}
    >
      {status === 'loading' ? (
        <Loader2 className="animate-spin" size={18} />
      ) : status === 'success' ? (
        <CheckCircle2 size={18} />
      ) : status === 'error' ? (
        <BellOff size={18} />
      ) : (
        <Bell size={18} />
      )}

      <span>
        {status === 'loading' ? 'Activando...' : 
         status === 'success' ? 'Notificaciones Activas' : 
         status === 'error' ? 'Error al activar' :
         'Activar Notificaciones'}
      </span>

      {status === 'idle' && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
        </span>
      )}
    </motion.button>
  )
}
