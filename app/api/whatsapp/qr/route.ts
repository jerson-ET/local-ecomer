import { NextResponse } from 'next/server'

const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3015'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const response = await fetch(`${WORKER_URL}/api/qr`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { connected: false, qr: null, error: 'Worker no disponible' },
        { status: 502 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { connected: false, qr: null, error: 'No se pudo conectar al servidor de WhatsApp. Asegúrate de que el worker esté corriendo.' },
      { status: 503 }
    )
  }
}
