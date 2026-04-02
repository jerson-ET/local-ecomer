import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getUserAndStoreOwnership(storeId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { user: null, isOwner: false }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('id', storeId)
    .eq('user_id', user.id)
    .maybeSingle()

  return { user, isOwner: Boolean(store?.id) }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('storeId') || ''
  if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 })

  const { user, isOwner } = await getUserAndStoreOwnership(storeId)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!isOwner) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const service = getServiceClient()
  const { data, error } = await service
    .from('commissions')
    .select('id, order_id, reseller_id, amount, status, referral_code, created_at, paid_at, paid_method, paid_note, paid_by, profiles!commissions_reseller_id_fkey(nombre, name, email)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ commissions: data || [] })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const action = String(body?.action || '')
  const storeId = String(body?.storeId || '')
  if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 })

  const { user, isOwner } = await getUserAndStoreOwnership(storeId)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!isOwner) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const service = getServiceClient()

  if (action === 'mark-paid') {
    const commissionId = String(body?.commissionId || '')
    const paidMethod = body?.paidMethod ? String(body.paidMethod) : null
    const paidNote = body?.paidNote ? String(body.paidNote) : null

    if (!commissionId) return NextResponse.json({ error: 'commissionId requerido' }, { status: 400 })

    const { data: commission, error: readErr } = await service
      .from('commissions')
      .select('id, store_id, status')
      .eq('id', commissionId)
      .single()
    if (readErr || !commission) return NextResponse.json({ error: 'Comisión no encontrada' }, { status: 404 })
    if (commission.store_id !== storeId) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    if (commission.status !== 'pending') {
      return NextResponse.json({ error: 'Solo puedes pagar comisiones pendientes' }, { status: 409 })
    }

    const { error: updErr } = await service
      .from('commissions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by: user.id,
        paid_method: paidMethod,
        paid_note: paidNote,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commissionId)
      .eq('store_id', storeId)

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}

