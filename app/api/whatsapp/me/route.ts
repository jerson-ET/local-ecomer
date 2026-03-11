import { NextResponse } from 'next/server'

const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3015'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const response = await fetch(`${WORKER_URL}/api/me`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { connected: false, user: null },
        { status: 502 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { connected: false, user: null, error: 'Worker no disponible' },
      { status: 503 }
    )
  }
}
