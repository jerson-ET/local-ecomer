import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { generatePayment } from '@/lib/efipay'

const getSupabaseAdmin = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

/**
 * POST /api/efipay/subscription
 * Genera un pago de suscripción mensual vía Efipay para el usuario logueado.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, email, amount = 49900 } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })
    }

    // Usar una versión corta del userId para no exceder los límites de longitud de Efipay en orderId
    const shortUserId = userId.split('-')[0] || userId.substring(0, 8);
    const orderId = `SUB-${shortUserId}-${Date.now()}`
    const description = `Membresia LocalEcomer`

    const efipayResponse = await generatePayment({
      description,
      amount: Number(amount),
      currency: 'COP',
      orderId, // reference 1
      extraReferences: [userId], // reference 2 will be the exact UUID!
      storeSlug: 'suscripcion', // storeSlug dummy
    })

    if (!efipayResponse.url) {
      throw new Error('Efipay no retornó URL')
    }

    // Optional: Log intent en una tabla si existiera. Por ahora solo retornamos la URL

    return NextResponse.json({
      success: true,
      checkoutUrl: efipayResponse.url,
      paymentId: efipayResponse.payment_id,
    })
  } catch (error: any) {
    console.error('[EFIPAY/SUBSCRIPTION] Server error:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al generar pago' },
      { status: 500 }
    )
  }
}
