import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> } | { params: { storeId: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Next.js 15+ allows params to be a Promise, but backwards compatible.
    const resolvedParams = await params
    const storeId = resolvedParams.storeId

    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[API] Error deleting store:', error)
      return NextResponse.json(
        { error: 'Error al eliminar el catálogo', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Server error:', error)
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 })
  }
}
