/* ═══════════════════════════════════════════════════════════════════════════ */
/*      API ADMIN: Eliminar producto específico (Solo Super Admin)           */
/*      DELETE /api/admin/products?productId=xxx                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    const role = String((profile as { role?: string } | null)?.role || '')
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Falta productId' }, { status: 400 })
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Eliminar variantes del producto (si existen)
    await serviceClient.from('product_variants').delete().eq('product_id', productId)

    // Eliminar order_items de aquellos pedidos donde este producto aparece
    await serviceClient.from('order_items').delete().eq('product_id', productId)

    // Eliminar el producto
    const { error } = await serviceClient.from('products').delete().eq('id', productId)

    if (error) {
      throw new Error(`Error BD al eliminar producto: ${error.message}`)
    }

    return NextResponse.json({ success: true, message: 'Producto eliminado por el admin' })
  } catch (error: any) {
    console.error('[ADMIN] Error eliminando producto:', error)
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 })
  }
}
