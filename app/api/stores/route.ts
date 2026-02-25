/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                    API: CREACIÓN DE TIENDAS                                  */
/*                                                                              */
/*   Ruta   : POST /api/stores                                                  */
/*   Propósito: Crear una tienda nueva en Supabase para el usuario autenticado  */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CreateStoreInput {
  name: string
  slug: string
  templateId: string
  templateUrl: string
  themeColor?: string
  description?: string
  whatsappNumber?: string
}

/* ─── POST — Crear tienda nueva ─── */
export async function POST(request: NextRequest) {
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
    const body: CreateStoreInput = await request.json()

    /* 3. Validaciones */
    if (!body.name?.trim() || body.name.trim().length < 3) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 3 caracteres', code: 'INVALID_NAME' },
        { status: 400 }
      )
    }

    if (!body.slug?.trim()) {
      return NextResponse.json(
        { error: 'El slug es requerido', code: 'INVALID_SLUG' },
        { status: 400 }
      )
    }

    if (!body.templateId) {
      return NextResponse.json(
        { error: 'Debes seleccionar una plantilla', code: 'MISSING_TEMPLATE' },
        { status: 400 }
      )
    }

    /* 4. Verificar que el slug no esté en uso */
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', body.slug)
      .maybeSingle()

    if (existingStore) {
      return NextResponse.json(
        { error: 'Ese nombre de tienda ya está en uso. Elige otro nombre.', code: 'SLUG_TAKEN' },
        { status: 409 }
      )
    }

    /* 5. Verificar que el usuario no tenga ya una tienda activa */
    const { data: userStores } = await supabase
      .from('stores')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_active', true)

    /* Permite hasta 3 tiendas por usuario */
    if (userStores && userStores.length >= 3) {
      return NextResponse.json(
        { error: 'Has alcanzado el límite de 3 tiendas activas', code: 'STORE_LIMIT' },
        { status: 403 }
      )
    }

    /* 5+. Asegurar que el perfil exista en la base de datos (evitar fallo foreign key constraint) */
    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profileCheck) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        nombre:
          user.user_metadata?.nombre ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Usuario',
        telefono: user.phone || '',
      })
      if (profileError) {
        console.error('[STORES] Error creando perfil:', profileError)
        return NextResponse.json(
          {
            error: 'Error al preparar tu perfil. Intenta de nuevo.',
            code: 'PROFILE_ERROR',
            details: profileError.message,
          },
          { status: 500 }
        )
      }
    }

    /* 6. Crear la tienda en Supabase */
    const { data: newStore, error: insertError } = await supabase
      .from('stores')
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        slug: body.slug.trim(),
        description: body.description?.trim() || null,
        theme_color: body.themeColor || '#6366f1',
        banner_url: JSON.stringify({ templateId: body.templateId }),
        is_active: true,
        plan: 'free',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[STORES] Error insertando tienda:', insertError)
      return NextResponse.json(
        { error: 'Error al crear la tienda', code: 'INSERT_ERROR', details: insertError.message },
        { status: 500 }
      )
    }

    /* 7. Perfil ya existe, tienda creada exitosamente */

    /* 8. Retornar la tienda creada */
    return NextResponse.json(
      {
        success: true,
        store: {
          id: newStore.id,
          name: newStore.name,
          slug: newStore.slug,
          storeUrl: `/tienda/${newStore.slug}`,
          createdAt: newStore.created_at,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[STORES] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message, code: 'SERVER_ERROR' }, { status: 500 })
  }
}

/* ─── GET — Obtener tiendas del usuario actual ─── */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, name, slug, theme_color, banner_url, is_active, plan, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ stores })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
