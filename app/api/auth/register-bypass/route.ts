import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: Request) {
  try {
    const { email, password, name, phone } = await request.json()

    const supabase = getAdminClient()

    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre: name,
        telefono: phone,
        country_code: '+57',
      },
    })

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email,
        name,
        role: 'buyer',
        phone_verified: true,
      })
    }

    return NextResponse.json({
      success: true,
      email,
    })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
