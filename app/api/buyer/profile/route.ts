import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para actualizar tus datos.' }, { status: 401 })
    }

    const body = await request.json()
    const { name, document_type, document_number, whatsapp, city, address } = body

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'El nombre completo es obligatorio.' }, { status: 400 })
    }
    if (!whatsapp || whatsapp.trim().length < 7) {
      return NextResponse.json({ error: 'El número de WhatsApp es obligatorio.' }, { status: 400 })
    }

    // 1. Update Auth metadata
    const { data: updatedUserData, error: authError } = await supabase.auth.updateUser({
      data: {
        nombre: name.trim(),
        document_type: document_type || 'CC',
        document_number: document_number ? document_number.trim() : null,
        whatsapp: whatsapp.trim(),
        telefono: whatsapp.trim(),
        city: city ? city.trim() : null,
        address: address ? address.trim() : null,
      }
    })

    if (authError) {
      throw authError
    }

    // 2. Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nombre: name.trim(),
        telefono: whatsapp.trim()
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Error updating profiles table:', profileError)
      // We don't fail the whole request since auth metadata is updated successfully
    }

    return NextResponse.json({
      success: true,
      message: 'Información actualizada correctamente.',
      user: updatedUserData.user
    })
  } catch (error: any) {
    console.error('Error in POST /api/buyer/profile:', error)
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 })
  }
}
