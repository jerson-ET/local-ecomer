import { NextResponse } from 'next/server'

const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3015'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const response = await fetch(`${WORKER_URL}/api/reset`, {
      method: 'POST',
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Worker no disponible' },
        { status: 502 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { success: false, error: 'No se pudo conectar al servidor de WhatsApp.' },
      { status: 503 }
    )
  }
}
