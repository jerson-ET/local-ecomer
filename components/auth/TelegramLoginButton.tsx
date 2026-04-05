'use client'

import { useEffect, useRef } from 'react'

interface Props {
  botName: string
  onAuth: (user: any) => void
  buttonSize?: 'large' | 'medium' | 'small'
  cornerRadius?: number
  requestAccess?: string
}

export default function TelegramLoginButton({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius,
  requestAccess = 'write',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Definir el callback global para el widget
    ;(window as any).onTelegramAuth = (user: any) => {
      onAuth(user)
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', botName)
    script.setAttribute('data-size', buttonSize)
    if (cornerRadius !== undefined) {
      script.setAttribute('data-radius', cornerRadius.toString())
    }
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', requestAccess)

    if (containerRef.current) {
      containerRef.current.innerHTML = '' // Limpiar anterior
      containerRef.current.appendChild(script)
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      delete (window as any).onTelegramAuth
    }
  }, [botName, buttonSize, cornerRadius, requestAccess, onAuth])

  return <div ref={containerRef} className="flex justify-center my-4" />
}
