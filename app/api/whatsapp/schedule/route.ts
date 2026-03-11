import { NextResponse } from 'next/server'

const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3015'

export async function POST(request: Request) {
  try {
    const { storeSlug, items, publishNow } = await request.json()

    if (!storeSlug || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Datos de programación inválidos' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const processedItems = items.map(item => ({
      ...item,
      image: `${baseUrl}/api/og/product?img=${encodeURIComponent(item.image)}&storeSlug=${encodeURIComponent(storeSlug)}`
    }))

    if (publishNow) {
      // ─── PUBLICAR YA: Llamar directamente al worker de WhatsApp ───
      const response = await fetch(`${WORKER_URL}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeSlug, items: processedItems })
      })

      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json({ error: data.error || 'Error del worker de WhatsApp' }, { status: response.status })
      }

      return NextResponse.json({ success: true, count: data.queued, mode: 'immediate' })
    } else {
      // ─── GUARDAR CATÁLOGO: Por ahora guardamos en memoria del worker ───
      // En producción esto iría a la base de datos con un cron job
      const response = await fetch(`${WORKER_URL}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeSlug, items: processedItems })
      })

      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json({ error: data.error || 'Error del worker de WhatsApp' }, { status: response.status })
      }

      return NextResponse.json({ success: true, count: data.queued, mode: 'scheduled' })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error del servidor'
    console.error('Error en /api/whatsapp/schedule:', message)
    
    if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
      return NextResponse.json({ 
        error: 'El servidor de WhatsApp no está corriendo. Inicia el worker primero.' 
      }, { status: 503 })
    }
    
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
