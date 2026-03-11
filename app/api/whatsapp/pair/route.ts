import { NextResponse } from 'next/server'

const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3015'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { code: null, error: 'Número de teléfono requerido' },
        { status: 400 }
      )
    }

    const response = await fetch(`${WORKER_URL}/api/pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { code: null, error: 'Worker no disponible' },
        { status: 502 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { code: null, error: 'No se pudo conectar al servidor de WhatsApp. Asegúrate de que el worker esté corriendo.' },
      { status: 503 }
    )
  }
}
