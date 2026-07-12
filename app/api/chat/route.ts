/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                    API: COMUNICACIÓN Y CHAT                                  */
/*                                                                              */
/*   Ruta   : /api/chat                                                         */
/*   Propósito: Gestionar salas de chat entre asesores y vendedores             */
/*              Bypassea restricciones de RLS al agregar participantes          */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/** Cliente con Service Role para operaciones administrativas (bypassear RLS) */
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/* ─── GET — Obtener salas del usuario y lista de tiendas si es Ventas/Admin ─── */
export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // 2. Obtener rol del perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role || user.user_metadata?.role || 'buyer'
    const isSalesOrAdmin = ['sales', 'admin', 'superadmin'].includes(role)

    let stores: any[] = []

    // 3. Si es asesor o admin, obtener todas las tiendas
    if (isSalesOrAdmin) {
      const { data: activeStores, error: storesError } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          slug,
          logo_url,
          user_id,
          profiles:user_id (
            email,
            nombre
          )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (!storesError && activeStores) {
        stores = activeStores.map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          logoUrl: s.logo_url,
          userId: s.user_id,
          sellerName: s.profiles?.nombre || s.profiles?.email?.split('@')[0] || 'Vendedor',
          sellerEmail: s.profiles?.email || ''
        }))
      }
    }

    // 4. Obtener las salas de chat en las que participa el usuario
    const { data: participants, error: partError } = await supabase
      .from('chat_participants')
      .select('room_id')
      .eq('user_id', user.id)

    if (partError) {
      return NextResponse.json({ error: partError.message }, { status: 500 })
    }

    const roomIds = participants?.map(p => p.room_id) || []
    let rooms: any[] = []

    if (roomIds.length > 0) {
      const { data: chatRooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          type,
          store_id,
          created_at,
          last_message_at,
          chat_participants (
            user_id,
            profiles:user_id (
              id,
              nombre,
              avatar_url,
              email,
              role
            )
          )
        `)
        .in('id', roomIds)
        .order('last_message_at', { ascending: false })

      if (!roomsError && chatRooms) {
        rooms = chatRooms
      }
    }

    return NextResponse.json({
      stores,
      rooms,
      userId: user.id,
      role
    })
  } catch (error) {
    console.error('[CHAT_API] Error GET:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/* ─── POST — Crear o recuperar sala de chat directa bypass RLS ─── */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // 2. Parsear parámetros
    const { otherUserId, storeId } = await request.json()
    if (!otherUserId) {
      return NextResponse.json({ error: 'Falta otherUserId' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // 3. Buscar sala de chat directa existente entre user.id y otherUserId
    const { data: roomsA, error: errA } = await serviceClient
      .from('chat_participants')
      .select('room_id')
      .eq('user_id', user.id)

    if (errA) {
      return NextResponse.json({ error: errA.message }, { status: 500 })
    }

    const roomIdsA = roomsA?.map(r => r.room_id) || []
    let existingRoomId: string | null = null

    if (roomIdsA.length > 0) {
      const { data: roomsB, error: errB } = await serviceClient
        .from('chat_participants')
        .select('room_id, chat_rooms!inner(id, type, store_id)')
        .in('room_id', roomIdsA)
        .eq('user_id', otherUserId)
        .eq('chat_rooms.type', 'direct')

      if (!errB && roomsB) {
        const match = roomsB.find((r: any) => {
          const room = r.chat_rooms
          if (storeId) {
            return room.store_id === storeId
          } else {
            return !room.store_id
          }
        })
        if (match) {
          existingRoomId = match.room_id
        }
      }
    }

    // 4. Si ya existe, retornarla
    if (existingRoomId) {
      return NextResponse.json({ success: true, roomId: existingRoomId, isNew: false })
    }

    // 5. Si no existe, crear la sala y agregar a ambos participantes
    const { data: newRoom, error: roomError } = await serviceClient
      .from('chat_rooms')
      .insert([{ type: 'direct', store_id: storeId || null }])
      .select()
      .single()

    if (roomError || !newRoom) {
      console.error('[CHAT_API] Error creando sala:', roomError)
      return NextResponse.json({ error: 'Error al crear la sala de chat' }, { status: 500 })
    }

    const { error: partError } = await serviceClient
      .from('chat_participants')
      .insert([
        { room_id: newRoom.id, user_id: user.id },
        { room_id: newRoom.id, user_id: otherUserId }
      ])

    if (partError) {
      console.error('[CHAT_API] Error agregando participantes:', partError)
      // Limpiar sala huérfana
      await serviceClient.from('chat_rooms').delete().eq('id', newRoom.id)
      return NextResponse.json({ error: 'Error al asociar participantes al chat' }, { status: 500 })
    }

    return NextResponse.json({ success: true, roomId: newRoom.id, isNew: true })
  } catch (error) {
    console.error('[CHAT_API] Error POST:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
