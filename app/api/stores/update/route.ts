import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { storeId, whatsappNumber, paymentMethods, autoDiscountRules } = body

    if (!storeId) {
      return NextResponse.json({ error: 'Falta storeId' }, { status: 400 })
    }

    // Asegurar propiedad de la tienda
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Tienda no encontrada o acceso denegado' }, { status: 403 })
    }

    const toUpdate: Record<string, unknown> = {}
    if (whatsappNumber !== undefined) toUpdate.whatsapp_number = whatsappNumber
    if (paymentMethods !== undefined) toUpdate.payment_methods = paymentMethods
    if (autoDiscountRules !== undefined) toUpdate.auto_discount_rules = autoDiscountRules

    const { error: updateError } = await supabase.from('stores').update(toUpdate).eq('id', storeId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
