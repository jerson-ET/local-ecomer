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
    const { userId, email, amount = 50000 } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })
    }

    // Usar el userId como orderId (prefijado) para identificarlo en el webhook si quisiéramos automatizarlo después
    const orderId = `SUB-${userId}-${Date.now()}`
    const description = `Membresía Mensual LocalEcomer - ${email || userId}`

    const efipayResponse = await generatePayment({
      description,
      amount: Number(amount),
      currency: 'COP',
      orderId, // reference
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
