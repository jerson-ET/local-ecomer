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
      autoDiscountRules,
      customDomain,
      discountCode,
      discountPercentage,
      discountMaxUses,
      discountUsedCount,
      discountExpirationDate
    } = body

    if (!storeId) {
      return NextResponse.json({ error: 'Falta storeId' }, { status: 400 })
    }

    // Verificar si es administrador o superadmin para soportar la imitación (impersonate)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isAdmin = user.app_metadata?.role === 'superadmin' || 
                    user.user_metadata?.role === 'superadmin' ||
                    profile?.role === 'admin' || 
                    profile?.role === 'superadmin'

    console.log('[DEBUG UPDATE STORE]', {
      authUserId: user.id,
      storeId,
      profileRole: profile?.role,
      isAdmin,
    })

    // Asegurar propiedad de la tienda
    let query = supabase
      .from('stores')
      .select('id, name, slug, description, banner_url, user_id')
      .eq('id', storeId)

    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data: store, error: storeError } = await query.single()

    console.log('[DEBUG UPDATE STORE RESULT]', {
      storeFound: !!store,
      storeOwnerId: store?.user_id,
      storeError,
    })

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
    if (customDomain !== undefined) { 
      config.customDomain = customDomain; 
      hasConfigUpdate = true;
      // toUpdate.custom_domain = customDomain ? customDomain.trim().toLowerCase() : null; // Comentado para desarrollo local donde no existe esta columna
    }
    if (discountCode !== undefined) { config.discountCode = discountCode; hasConfigUpdate = true }
    if (discountPercentage !== undefined) { config.discountPercentage = discountPercentage; hasConfigUpdate = true }
    if (discountMaxUses !== undefined) { config.discountMaxUses = discountMaxUses; hasConfigUpdate = true }
    if (discountUsedCount !== undefined) { config.discountUsedCount = discountUsedCount; hasConfigUpdate = true }
    if (discountExpirationDate !== undefined) { config.discountExpirationDate = discountExpirationDate; hasConfigUpdate = true }

    if (hasConfigUpdate) {
      toUpdate.banner_url = JSON.stringify(config)
    }

    /* ─── Otros campos ─── */
    if (paymentMethods !== undefined) toUpdate.payment_methods = paymentMethods
    if (autoDiscountRules !== undefined) toUpdate.auto_discount_rules = autoDiscountRules

    /* ─── Validar Slug si ha cambiado ─── */
    if (slug !== undefined && slug !== store.slug) {
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .neq('id', storeId) // Ignorar la tienda actual
        .maybeSingle()

      if (existingStore) {
        return NextResponse.json({ error: 'Ya existe otra tienda con este enlace (slug)' }, { status: 400 })
      }
    }

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
