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
    const { 
      storeId, 
      name, 
      slug, 
      description, 
      footerInfo, 
      socialFacebook, 
      socialInstagram, 
      whatsappNumber, 
      shippingLocation, 
      bannerUrl, 
      bannerUrls,
      paymentMethods, 
      autoDiscountRules 
    } = body

    if (!storeId) {
      return NextResponse.json({ error: 'Falta storeId' }, { status: 400 })
    }

    // Asegurar propiedad de la tienda
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, slug, description, banner_url')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Tienda no encontrada o acceso denegado' }, { status: 403 })
    }

    const toUpdate: Record<string, unknown> = {}
    
    /* ─── Actualizar campos básicos ─── */
    if (name !== undefined) toUpdate.name = name
    if (slug !== undefined) toUpdate.slug = slug
    if (description !== undefined) toUpdate.description = description

    /* ─── Actualizar configuración en banner_url (JSON) ─── */
    let config: any = {}
    try {
      if (store.banner_url && typeof store.banner_url === 'string' && store.banner_url.startsWith('{')) {
        config = JSON.parse(store.banner_url)
      }
    } catch (e) {}

    let hasConfigUpdate = false
    if (whatsappNumber !== undefined) { config.whatsappNumber = whatsappNumber; hasConfigUpdate = true }
    if (shippingLocation !== undefined) { config.shippingLocation = shippingLocation; hasConfigUpdate = true }
    if (footerInfo !== undefined) { config.footerInfo = footerInfo; hasConfigUpdate = true }
    if (socialFacebook !== undefined) { config.socialFacebook = socialFacebook; hasConfigUpdate = true }
    if (socialInstagram !== undefined) { config.socialInstagram = socialInstagram; hasConfigUpdate = true }
    if (bannerUrl !== undefined) { config.customUrl = bannerUrl; hasConfigUpdate = true }
    if (bannerUrls !== undefined) { config.customUrls = bannerUrls; hasConfigUpdate = true }

    if (hasConfigUpdate) {
      toUpdate.banner_url = JSON.stringify(config)
    }

    /* ─── Otros campos ─── */
    if (paymentMethods !== undefined) toUpdate.payment_methods = paymentMethods
    if (autoDiscountRules !== undefined) toUpdate.auto_discount_rules = autoDiscountRules

    const { error: updateError } = await supabase.from('stores').update(toUpdate).eq('id', storeId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      store: { id: storeId } 
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
