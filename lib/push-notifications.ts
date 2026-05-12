import { createClient } from './supabase/client'

// Función para convertir la llave VAPID de Base64 a Uint8Array (requerido por el navegador)
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function subscribeUserToPush() {
  const supabase = createClient()
  
  // 1. Verificar si el navegador soporta Service Workers y Push
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Tu navegador no soporta notificaciones push.')
  }

  // 2. Obtener el registro del Service Worker
  const registration = await navigator.serviceWorker.ready

  // 3. Pedir permiso al usuario
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Permiso de notificaciones denegado.')
  }

  // 4. Suscribirse al servidor de Push
  // IMPORTANTE: El usuario debe actualizar esta llave con una generada real
  const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || 'BEl62vp95W7N_D9f3C-placeholder-key' 
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
  })

  // 5. Guardar la suscripción en Supabase
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('push_subscriptions').upsert([{
      user_id: user.id,
      subscription: subscription.toJSON(),
      device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    }], { onConflict: 'user_id,subscription' })
  }

  return true
}
