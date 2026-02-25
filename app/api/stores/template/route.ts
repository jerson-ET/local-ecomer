import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    /* 1. Verificar autenticación */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    /* 2. Parsear body */
    const body = await request.json()
    const { storeId, templateId } = body

    if (!storeId || !templateId) {
      return NextResponse.json(
        { error: 'storeId y templateId son requeridos', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    /* 3. Verificar propiedad de la tienda */
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, banner_url')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Tienda no encontrada o no autorizada', code: 'STORE_NOT_FOUND' },
        { status: 404 }
      )
    }

    /* 4. Actualizar banner_url */
    let existingBanner = {}
    try {
      if (store.banner_url) {
        existingBanner = JSON.parse(store.banner_url)
      }
    } catch {
      /* ignore */
    }

    const newBannerUrl = JSON.stringify({ ...existingBanner, templateId })

    const { error: updateError } = await supabase
      .from('stores')
      .update({ banner_url: newBannerUrl })
      .eq('id', storeId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Error actualizando plantilla', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, templateId })
  } catch (error) {
    console.error('[STORES TEMPLATE] Error:', error)
    return NextResponse.json({ error: 'Error desconocido', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
