import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId, oldCategory, newCategory, productId } = await request.json()
    if (!storeId || !newCategory) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }
    
    if (!oldCategory && !productId) {
      return NextResponse.json({ error: 'Faltan parámetros (oldCategory o productId)' }, { status: 400 })
    }

    let query = supabase
      .from('products')
      .update({ category_id: newCategory })
      .eq('store_id', storeId)
      
    if (productId) {
      query = query.eq('id', productId)
    } else {
      query = query.eq('category_id', oldCategory)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error updating categories:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
