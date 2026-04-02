import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateInvoicePDF } from '@/lib/utils/invoice'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  API: /api/invoice/download                                                */
/*  Genera y descarga el PDF de una factura al instante                       */
/*  Parámetros (query string):                                                */
/*    userId    - ID del usuario dueño de la factura                          */
/*    invoiceId - ID de la factura dentro de user_metadata.invoices           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const invoiceId = searchParams.get('invoiceId')

    if (!userId || !invoiceId) {
      return NextResponse.json({ error: 'userId e invoiceId son requeridos' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Config del servidor faltante' }, { status: 500 })
    }

    const serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Obtener datos del usuario
    const { data: userData, error: userError } = await serviceClient.auth.admin.getUserById(userId)
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const meta = userData.user.user_metadata || {}
    const invoices = Array.isArray(meta.invoices) ? meta.invoices : []
    
    // Buscar la factura específica
    const invoice = invoices.find((inv: any) => inv.id === invoiceId)
    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    // Calcular fecha de vencimiento (30 días después de la emisión)
    const invoiceDate = new Date(invoice.date)
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + 30)

    // Generar el PDF
    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.number,
      date: invoiceDate.toLocaleDateString('es-CO'),
      dueDate: dueDate.toLocaleDateString('es-CO'),
      userName: meta.nombre || 'Comerciante LocalEcomer',
      userEmail: userData.user.email || '',
      userDoc: meta.document_number || 'No Registrado',
      userDocType: meta.document_type || 'CC',
      userCity: meta.city || '',
      userCountry: meta.country || 'Colombia',
      userWhatsapp: meta.telefono || '',
      amount: invoice.amount || 35000,
      periodDays: 30,
    })

    // Devolver el PDF como descarga directa
    const uint8 = new Uint8Array(pdfBuffer)
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Factura_${invoice.number}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err: any) {
    console.error('[INVOICE DOWNLOAD] Error:', err)
    return NextResponse.json({ error: 'Error generando factura: ' + err.message }, { status: 500 })
  }
}
