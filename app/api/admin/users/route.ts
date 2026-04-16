/* ═══════════════════════════════════════════════════════════════════════════ */
/*              API ADMIN: Gestión de Usuarios (Solo Super Admin)             */
/*              POST /api/admin/users → Crear un nuevo usuario                */
/*              GET  /api/admin/users → Listar todos los usuarios             */
/*              DELETE /api/admin/users?userId=xxx → Eliminar usuario          */
/*              PATCH  /api/admin/users → Sancionar usuario                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateInvoicePDF } from '@/lib/utils/invoice'

/** Verificar que quien pide es el super admin */
async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) {
    return null
  }
  if (!user) {
    return null
  }
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError) {
    return null
  }
  const profileRole = String((profile as { role?: string } | null)?.role || '');
  const metaRole = String(user.user_metadata?.role || '');
  
  if (profileRole !== 'admin' && profileRole !== 'superadmin' && metaRole !== 'admin' && metaRole !== 'super_admin') {
    return null
  }
  return user
}

/** Cliente con Service Role para operaciones administrativas */
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/* ─── POST: Crear un nuevo usuario (Solo Super Admin) ─── */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await verifyAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, name, role, docType, docNumber, country, city, whatsapp, storeCategory } = body

    /* ── Validaciones ── */
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Correo electrónico inválido' }, { status: 400 })
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    const validRoles = ['buyer', 'seller', 'admin']
    const userRole = validRoles.includes(role) ? role : 'buyer'

    const serviceClient = getServiceClient()

    /* ── 1. Crear usuario en Supabase Auth ── */
    const paidUntil = new Date()
    paidUntil.setDate(paidUntil.getDate() + 30)

    const { data: authData, error: signUpError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre: name.trim(),
        role: userRole,
        password_plain: password,
        paid_until: paidUntil.toISOString(),
        is_active: true,
        document_type: docType || null,
        document_number: docNumber || null,
        country: country || 'Colombia',
        city: city || null,
        telefono: whatsapp || null,
        store_category: storeCategory || null
      },
    })

    if (signUpError) {
      if (
        signUpError.message.includes('already been registered') ||
        signUpError.message.includes('already exists')
      ) {
        return NextResponse.json(
          { error: 'Este correo ya está registrado en el sistema' },
          { status: 409 }
        )
      }
      console.error('[ADMIN] Error creando usuario:', signUpError)
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    /* ── 2. Crear perfil en tabla profiles ── */
    if (authData.user) {
      const { error: profileError } = await serviceClient.from('profiles').upsert({
        id: authData.user.id,
        nombre: name.trim(),
        role: userRole,
        telefono: whatsapp || '',
        phone_verified: true,
      })

      if (profileError) {
        console.error('[ADMIN] Error creando perfil:', profileError)
        /* No fallar, el usuario de auth ya se creó */
      }
    }

    console.log(`[ADMIN] ✅ Usuario creado: ${email} (${userRole}) por admin ${admin.id}`)

    return NextResponse.json({
      success: true,
      message: `Usuario "${name}" creado exitosamente`,
      user: {
        id: authData.user?.id,
        email,
        name: name.trim(),
        role: userRole,
      },
    })
  } catch (error) {
    console.error('[ADMIN] Error creando usuario:', error)
    return NextResponse.json({ error: 'Error interno al crear usuario' }, { status: 500 })
  }
}

/* ─── GET: Listar todos los usuarios con sus datos ─── */
export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await verifyAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const serviceClient = getServiceClient()

    // 1. Obtener TODOS los usuarios de auth (incluye email)
    const { data: authData, error: authListError } = await serviceClient.auth.admin.listUsers()
    if (authListError) {
      console.error('[ADMIN] Error listando auth users:', authListError)
      return NextResponse.json({ error: authListError.message }, { status: 500 })
    }
    const authUsers = authData?.users || []
    console.log('[ADMIN] Auth users encontrados:', authUsers.length)

    const { data: profiles } = await serviceClient
      .from('profiles')
      .select(
        'id, nombre, role, created_at, telefono, phone_verified, country_code'
      )
      .order('created_at', { ascending: false })

    // 3. Obtener todas las tiendas
    const { data: stores } = await serviceClient
      .from('stores')
      .select('id, user_id, name, slug, is_active, created_at')

    // 4. Obtener productos
    const { data: products } = await serviceClient
      .from('products')
      .select('id, store_id, name, price, images, is_active')

    // 5. Verificar sanciones activas
    let sanctions: Record<string, any>[] = []
    const { data: sanctionsData, error: sanctionsError } = await serviceClient
      .from('user_sanctions')
      .select('*')
      .gt('expires_at', new Date().toISOString())
    if (!sanctionsError && sanctionsData) {
      sanctions = sanctionsData
    }

    // 6. Obtener ganancias/comisiones para todos
    const { data: earningsData } = await serviceClient.from('commissions').select('*')

    // 6. Combinar auth users con profiles, stores y products
    const users = authUsers
      .map((authUser) => {
        const profile = (profiles || []).find((p) => p.id === authUser.id)
        const userStores = (stores || []).filter((s) => s.user_id === authUser.id)
        const storeIds = userStores.map((s) => s.id)
        const userProducts = (products || []).filter((p) => storeIds.includes(p.store_id))
        const activeSanction = sanctions.find(
          (s) => (s as Record<string, unknown>).user_id === authUser.id
        ) as Record<string, unknown> | undefined

        const userEarnings = (earningsData || []).filter((e) => e.user_id === authUser.id)

        return {
          id: authUser.id,
          email: authUser.email || 'Sin correo',
          name:
            profile?.nombre ||
            authUser.user_metadata?.nombre ||
            authUser.user_metadata?.name ||
            'Sin nombre',
          role: profile?.role || 'buyer',
          documentType: authUser.user_metadata?.document_type || null,
          documentNumber: authUser.user_metadata?.document_number || null,
          country: authUser.user_metadata?.country || 'Colombia',
          city: authUser.user_metadata?.city || null,
          whatsapp: profile?.telefono || authUser.user_metadata?.telefono || null,
          storeCategory: authUser.user_metadata?.store_category || null,
          createdAt: authUser.created_at,
          lastSeen: null,
          stores: userStores.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            isActive: s.is_active,
          })),
          storeCount: userStores.length,
          products: userProducts.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            storeId: p.store_id,
            image:
              Array.isArray(p.images) && p.images.length > 0
                ? (p.images[0] as { thumbnail?: string; full?: string })?.thumbnail ||
                  (p.images[0] as { full?: string })?.full ||
                  null
                : null,
            isActive: p.is_active,
          })),
          productCount: userProducts.length,
          earnings: userEarnings.map((e) => ({
            id: e.id,
            category: e.category, // referral, product_sale
            amount: e.amount,
            description: e.description,
            createdAt: e.created_at,
          })),
          sanction: activeSanction
            ? {
                reason: activeSanction.reason as string,
                expiresAt: activeSanction.expires_at as string,
                days: activeSanction.days as number,
              }
            : null,
          passwordPlain: authUser.user_metadata?.password_plain || null,
          paidUntil: authUser.user_metadata?.paid_until || null,
          invoices: authUser.user_metadata?.invoices || [],
          isActive: authUser.user_metadata?.is_active !== false,

          nequiNumber: authUser.user_metadata?.nequi_number || null,
          pending_verification: authUser.user_metadata?.pending_verification || false,
          last_receipt_url: authUser.user_metadata?.last_receipt_url || null,
          affiliateProspects: authUser.user_metadata?.affiliate_prospects || [],
          payoutInfo: authUser.user_metadata?.payout_info || null,
        }
      })

    console.log('[ADMIN] Usuarios procesados:', users.length)
    return NextResponse.json({ users, total: users.length })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

/* ─── PUT: Cambiar contraseña / Activar-Desactivar / Extender plan ─── */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await verifyAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, action, newPassword } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'Faltan datos (userId, action)' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    /* Obtener metadata actual del usuario */
    const { data: userData, error: getUserErr } = await serviceClient.auth.admin.getUserById(userId)
    if (getUserErr || !userData.user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    const currentMeta = userData.user.user_metadata || {}

    if (action === 'change_password') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'Mínimo 6 caracteres' }, { status: 400 })
      }
      const { error } = await serviceClient.auth.admin.updateUserById(userId, {
        password: newPassword,
        user_metadata: { ...currentMeta, password_plain: newPassword },
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: 'Contraseña actualizada' })
    }

    if (action === 'toggle_active') {
      const newStatus = currentMeta.is_active === false ? true : false
      const { error } = await serviceClient.auth.admin.updateUserById(userId, {
        user_metadata: { ...currentMeta, is_active: newStatus },
        ban_duration: newStatus ? 'none' : '876000h', /* ~100 años = permanente */
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({
        success: true,
        isActive: newStatus,
        message: newStatus ? 'Cuenta activada' : 'Cuenta desactivada',
      })
    }

    if (action === 'update_info') {
      const { name, docType, docNumber, country, city, whatsapp, storeCategory } = body
      if (!name || name.trim().length < 2) {
        return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
      }

      const { error: profileError } = await serviceClient.from('profiles').update({
        nombre: name.trim(),
        telefono: whatsapp || '',
      }).eq('id', userId)

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      const { error: authError } = await serviceClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentMeta,
          nombre: name.trim(),
          document_type: docType || null,
          document_number: docNumber || null,
          country: country || 'Colombia',
          city: city || null,
          telefono: whatsapp || null,
          store_category: storeCategory || null,
        }
      })
      if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

      return NextResponse.json({ success: true, message: 'Datos guardados correctamente' })
    }

    if (action === 'extend_plan' || action === 'set_plan') {
      const addedDays = Number(body.days) || 30;
      
      const currentPaidUntil = currentMeta.paid_until ? new Date(currentMeta.paid_until) : new Date()
      const baseDate = action === 'set_plan' ? new Date() : (currentPaidUntil > new Date() ? currentPaidUntil : new Date())
      baseDate.setDate(baseDate.getDate() + addedDays)
      
      const invoiceAmount = Math.round((35000 / 30) * addedDays); // Prorrateo básico
      const invoiceNumber = `L-ECO-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
      const fileName = `invoice_${invoiceNumber}.pdf`;
      const filePath = `invoices/${userId}/${fileName}`;

      // 1. Generar PDF
      let invoiceUrl = '';
      try {
        const pdfBuffer = await generateInvoicePDF({
          invoiceNumber,
          date: new Date().toLocaleDateString('es-CO'),
          dueDate: baseDate.toLocaleDateString('es-CO'),
          userName: currentMeta.nombre || 'Comerciante LocalEcomer',
          userEmail: userData.user.email || '',
          userDoc: currentMeta.document_number || 'No Registrado',
          userDocType: currentMeta.document_type || 'CC',
          userCity: currentMeta.city || '',
          userCountry: currentMeta.country || 'Colombia',
          userWhatsapp: currentMeta.telefono || '',
          amount: invoiceAmount,
          periodDays: addedDays
        });

        // 2. Subir a Storage
        const storage = serviceClient.storage.from('platform-invoices');
        const { error: uploadError } = await storage.upload(filePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

        if (!uploadError) {
          const { data: { publicUrl } } = storage.getPublicUrl(filePath);
          invoiceUrl = publicUrl;
        }
      } catch (pdfErr) {
        console.error('[ADMIN] Error generando/subiendo PDF:', pdfErr);
        // Continuamos aunque falle el PDF para no bloquear el plan, pero lo ideal es que funcione
      }

      // 3. Actualizar Metadata con nueva fecha y registro de factura
      const newInvoice = {
        id: crypto.randomUUID(),
        number: invoiceNumber,
        amount: invoiceAmount,
        date: new Date().toISOString(),
        url: invoiceUrl,
        type: 'subscription_extension'
      };

      const existingInvoices = Array.isArray(currentMeta.invoices) ? currentMeta.invoices : [];
      
      const updateData: any = { 
        ...currentMeta, 
        paid_until: baseDate.toISOString(), 
        is_active: true,
        invoices: [newInvoice, ...existingInvoices]
      };

      // Si se está aprobando una verificación, limpiar los flags
      if (body.approve_verification) {
        updateData.pending_verification = false;
      }

      const { error } = await serviceClient.auth.admin.updateUserById(userId, {
        user_metadata: updateData,
        ban_duration: 'none',
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })


      
      return NextResponse.json({
        success: true,
        paidUntil: baseDate.toISOString(),
        invoice: newInvoice,
        message: body.approve_verification 
          ? 'Pago verificado exitosamente. Plan extendido 30 días.' 
          : 'Plan extendido 30 días y factura generada exitosamente',
      })
    }

    if (action === 'reject_verification') {
      const { error } = await serviceClient.auth.admin.updateUserById(userId, {
        user_metadata: { 
          ...currentMeta, 
          pending_verification: false,
          last_receipt_url: null // Borramos para que deba subir uno nuevo bueno
        }
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: 'Verificación rechazada. El usuario deberá subir un nuevo comprobante.' })
    }

    if (action === 'delete_invoice') {
      const { invoiceId } = body;
      if (!invoiceId) {
        return NextResponse.json({ error: 'ID de factura requerido' }, { status: 400 });
      }

      const existingInvoices = Array.isArray(currentMeta.invoices) ? currentMeta.invoices : [];
      const updatedInvoices = existingInvoices.filter((inv: any) => inv.id !== invoiceId);

      const { error } = await serviceClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentMeta,
          invoices: updatedInvoices
        }
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      
      return NextResponse.json({
        success: true,
        message: 'Factura eliminada correctamente.'
      });
    }



    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('[ADMIN] Error PUT:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

/* ─── DELETE: Eliminar usuario completamente ─── */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await verifyAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // 1. Obtener tiendas del usuario
    const { data: userStores } = await serviceClient
      .from('stores')
      .select('id')
      .eq('user_id', userId)

    const storeIds = (userStores || []).map((s) => s.id)

    // Si tiene tiendas, borrar dependencias
    if (storeIds.length > 0) {
      // 1.1 Obtener todos los productos de esas tiendas
      const { data: storeProducts } = await serviceClient
        .from('products')
        .select('id')
        .in('store_id', storeIds)
      const productIds = (storeProducts || []).map((p) => p.id)

      if (productIds.length > 0) {
        // Borrar variantes de los productos
        await serviceClient.from('product_variants').delete().in('product_id', productIds)
        // Borrar items de pedidos que involucran este producto
        await serviceClient.from('order_items').delete().in('product_id', productIds)
        // Borrar los productos
        await serviceClient.from('products').delete().in('store_id', storeIds)
      }

      // 1.2 Obtener pedidos donde la tienda es la vendedora
      const { data: storeOrders } = await serviceClient
        .from('orders')
        .select('id')
        .in('store_id', storeIds)
      const storeOrderIds = (storeOrders || []).map((o) => o.id)

      if (storeOrderIds.length > 0) {
        // Borrar order_items y comisiones de estos pedidos
        await serviceClient.from('order_items').delete().in('order_id', storeOrderIds)
        await serviceClient.from('commissions').delete().in('order_id', storeOrderIds)
        // Borrar pedidos que se le hicieron a esta tienda
        await serviceClient.from('orders').delete().in('store_id', storeIds)
      }

      // 1.3 Borrar salas de chat de la tienda
      const { data: storeChatRooms } = await serviceClient
        .from('chat_rooms')
        .select('id')
        .in('store_id', storeIds)
      const roomIds = (storeChatRooms || []).map((r) => r.id)
      if (roomIds.length > 0) {
        await serviceClient.from('chat_participants').delete().in('room_id', roomIds)
        await serviceClient.from('messages').delete().in('room_id', roomIds)
        await serviceClient.from('chat_rooms').delete().in('store_id', storeIds)
      }

      // 1.4 Borrar comisiones asociadas a la tienda
      await serviceClient.from('commissions').delete().in('store_id', storeIds)

      // 1.5 Finalmente, borrar las tiendas
      const { error: storeErr } = await serviceClient.from('stores').delete().in('id', storeIds)
      if (storeErr) throw new Error('Error al borrar tiendas: ' + storeErr.message)
    }

    // 2. Compras del usuario (Pedidos donde es el comprador)
    const { data: buyerOrders } = await serviceClient
      .from('orders')
      .select('id')
      .eq('buyer_id', userId)
    const buyerOrderIds = (buyerOrders || []).map((o) => o.id)
    if (buyerOrderIds.length > 0) {
      await serviceClient.from('order_items').delete().in('order_id', buyerOrderIds)
      await serviceClient.from('commissions').delete().in('order_id', buyerOrderIds)
      await serviceClient.from('orders').delete().eq('buyer_id', userId)
    }

    // 3. Borrar historial de chat del usuario como comprador o participante
    await serviceClient.from('chat_participants').delete().eq('user_id', userId)
    await serviceClient.from('messages').delete().eq('sender_id', userId)

    // 4. Borrar el usuario y dependencias menores directas
    await serviceClient.from('user_sanctions').delete().eq('user_id', userId)
    // Eliminada la limpieza de comisiones

    // 5. Borrar el perfil en BD pública
    const { error: profileErr } = await serviceClient.from('profiles').delete().eq('id', userId)
    if (profileErr) throw new Error('Error al borrar perfil: ' + profileErr.message)

    // 6. Finalmente borrar del auth de Supabase
    const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(userId)
    if (authDeleteError) {
      console.error('[ADMIN] Error borrando de auth:', authDeleteError)
      throw new Error('Error borrando autenticación: ' + authDeleteError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado completamente sin dejar rastros',
    })
  } catch (error: any) {
    console.error('[ADMIN] Error eliminando:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}

/* ─── PATCH: Sancionar usuario ─── */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await verifyAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, days, reason } = body

    if (!userId || !days) {
      return NextResponse.json({ error: 'Faltan datos (userId, days)' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + Number(days))

    // Insertar sanción
    const { error } = await serviceClient.from('user_sanctions').insert({
      user_id: userId,
      reason: reason || 'Violación de políticas',
      days: Number(days),
      expires_at: expiresAt.toISOString(),
      created_by: admin.id,
    })

    if (error) {
      // Si la tabla no existe aún, la creamos
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json(
          { error: 'La tabla user_sanctions no existe. Créala primero.' },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Desactivar tiendas del usuario durante la sanción
    await serviceClient.from('stores').update({ is_active: false }).eq('user_id', userId)

    return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() })
  } catch (error) {
    console.error('[ADMIN] Error sancionando:', error)
    return NextResponse.json({ error: 'Error al sancionar' }, { status: 500 })
  }
}
