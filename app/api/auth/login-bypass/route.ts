import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: Request) {
  try {
    const { email, storeName } = await request.json()
    const supabase = getAdminClient()

    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) throw userError

    const user = users.users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const slug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profileCheck) {
      await supabase.from('profiles').insert({
        id: user.id,
        nombre: user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario',
        telefono: user.phone || '',
      })
    }

    const { data: store, error: insertError } = await supabase
      .from('stores')
      .insert({
        user_id: user.id,
        name: storeName,
        slug: slug,
        theme_color: '#6366f1',
        banner_url: JSON.stringify({ templateId: 'minimal' }),
        is_active: true,
        plan: 'free',
      })
      .select()
      .single()

    if (insertError) {
      console.error(insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      store,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
