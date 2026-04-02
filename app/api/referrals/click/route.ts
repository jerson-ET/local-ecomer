import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const referralCode = String(body?.referralCode || '')
    const storeId = String(body?.storeId || '')
    const productIdRaw = body?.productId ? String(body.productId) : null

    if (!referralCode || !storeId) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const ua = request.headers.get('user-agent')
    const service = getServiceClient()

    const { data: link } = await service
      .from('referral_links')
      .select('id, store_id, product_id')
      .eq('code', referralCode)
      .maybeSingle()

    if (!link?.id) {
      return NextResponse.json({ success: true })
    }

    if (String(link.store_id) !== storeId) {
      return NextResponse.json({ success: true })
    }

    const expectedProductId = link.product_id ? String(link.product_id) : null
    const productId = expectedProductId || productIdRaw

    if (expectedProductId && productIdRaw && expectedProductId !== productIdRaw) {
      return NextResponse.json({ success: true })
    }

    await service.from('referral_events').insert({
      referral_code: referralCode,
      store_id: storeId,
      product_id: productId,
      event_type: 'click',
      user_agent: ua,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}

