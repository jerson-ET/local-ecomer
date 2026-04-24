import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { generateStoreInvoicePDF, StoreInvoiceData } from '@/lib/utils/store-invoice'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  API: /api/store-invoices                                                  */
/*                                                                            */
/*  POST — Genera una factura electrónica de compra y la envía por email      */
/*  GET  — Lista todas las facturas de una tienda                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/* ── Configuración del transporter de email ── */
async function getMailTransporter() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || ''
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || ''
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: { user, pass },
    tls: {
      // No fallar si el certificado es autofirmado (común en algunos SMTP)
      rejectUnauthorized: false
    }
  })

  return transporter
}

/* ── HTML bonito del email ── */
function buildInvoiceEmailHTML(data: {
  storeName: string
  buyerName: string
  invoiceNumber: string
  total: number
  date: string
  products: { name: string; quantity: number; total: number }[]
}): string {
  const productRows = data.products.map(p =>
    `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155">${p.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;text-align:center">${p.quantity}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;text-align:right;font-weight:700">$${p.total.toLocaleString('es-CO')}</td>
    </tr>`
  ).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 10px 40px rgba(0,0,0,0.08)">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 30px;text-align:center">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,#6366f1,#a855f7);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
            <span style="font-size:24px">🧾</span>
          </div>
          <h1 style="color:white;font-size:22px;margin:0 0 6px;font-weight:800">${data.storeName}</h1>
          <p style="color:#94a3b8;font-size:13px;margin:0">Factura Electrónica de Compra</p>
        </div>
        
        <!-- Body -->
        <div style="padding:30px">
          <p style="font-size:16px;color:#0f172a;margin:0 0 6px"><strong>Hola ${data.buyerName},</strong></p>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.6">
            Adjuntamos tu factura electrónica de compra realizada en <strong style="color:#6366f1">${data.storeName}</strong>. 
            Puedes descargar el PDF adjunto para tus registros.
          </p>
          
          <!-- Invoice info card -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:24px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px">Factura N°</span>
              <span style="font-size:14px;color:#0f172a;font-weight:800">${data.invoiceNumber}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px">Fecha</span>
              <span style="font-size:14px;color:#0f172a;font-weight:600">${data.date}</span>
            </div>
          </div>
          
          <!-- Products table -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <thead>
              <tr style="background:#0f172a">
                <th style="padding:12px 14px;text-align:left;font-size:11px;color:white;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-radius:10px 0 0 0">Producto</th>
                <th style="padding:12px 14px;text-align:center;font-size:11px;color:white;font-weight:700;text-transform:uppercase;letter-spacing:1px">Cant.</th>
                <th style="padding:12px 14px;text-align:right;font-size:11px;color:white;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-radius:0 10px 0 0">Total</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>
          
          <!-- Total -->
          <div style="background:linear-gradient(135deg,#6366f1,#a855f7);border-radius:14px;padding:20px;text-align:center;margin-bottom:24px">
            <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.7);font-weight:700;text-transform:uppercase;letter-spacing:1px">Total de la Compra</p>
            <p style="margin:0;font-size:28px;color:white;font-weight:900">$${data.total.toLocaleString('es-CO')}</p>
          </div>

          <!-- Seal -->
          <div style="text-align:center;margin:20px 0;padding:16px">
            <p style="font-size:10px;color:#94a3b8;margin:0 0 4px;text-transform:uppercase;letter-spacing:2px">Vendido por</p>
            <p style="font-size:24px;color:#0f172a;font-family:'Georgia',serif;font-style:italic;font-weight:700;margin:0;border-bottom:2px solid #6366f1;display:inline-block;padding-bottom:4px">${data.storeName}</p>
            <p style="font-size:10px;color:#10b981;margin:6px 0 0;font-weight:700">✓ Factura Verificada</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background:#f8fafc;padding:20px 30px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="font-size:11px;color:#94a3b8;margin:0 0 4px">Generado por <strong style="color:#6366f1">LocalEcomer</strong> — Tu comercio digital</p>
          <p style="font-size:10px;color:#cbd5e1;margin:0">Este correo fue enviado desde ${data.storeName} a través de LocalEcomer.store</p>
        </div>
      </div>
    </body>
    </html>
  `
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST — Crear factura, generar PDF, enviar email, guardar en DB            */
/* ═══════════════════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      storeId,
      storeName,
      storeSlug,
      buyerName,
      buyerEmail,
      buyerDocument,
      buyerDocumentType,
      products,
      paymentMethod,
      userId,
    } = body

    if (!storeId || !storeName || !buyerName || !buyerEmail || !buyerDocument || !products?.length) {
      return NextResponse.json({ error: 'Datos incompletos. Se requiere: tienda, comprador, cédula, email y productos.' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Generar número de factura único
    const now = new Date()
    const dateStr = now.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    const invoiceNumber = `FC-${storeName.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

    // Calcular totales
    const invoiceProducts = products.map((p: any) => ({
      name: p.name,
      quantity: p.quantity || 1,
      unitPrice: p.unitPrice || p.price || 0,
      total: (p.unitPrice || p.price || 0) * (p.quantity || 1),
    }))

    const subtotal = invoiceProducts.reduce((acc: number, p: any) => acc + p.total, 0)
    const total = subtotal

    // Generar PDF
    const invoiceData: StoreInvoiceData = {
      invoiceNumber,
      date: `${dateStr} ${timeStr}`,
      storeName,
      storeSlug,
      buyerName,
      buyerEmail,
      buyerDocument,
      buyerDocumentType: buyerDocumentType || 'C.C.',
      products: invoiceProducts,
      subtotal,
      total,
      paymentMethod: paymentMethod || 'Efectivo',
    }

    const pdfBuffer = await generateStoreInvoicePDF(invoiceData)

    // Guardar en Supabase
    const invoiceRecord = {
      store_id: storeId,
      user_id: userId || null,
      invoice_number: invoiceNumber,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_document: buyerDocument,
      buyer_document_type: buyerDocumentType || 'C.C.',
      products: invoiceProducts,
      subtotal,
      total,
      payment_method: paymentMethod || 'Efectivo',
      sent_at: now.toISOString(),
      status: 'sent',
    }

    const { error: dbError } = await supabase
      .from('store_invoices')
      .insert(invoiceRecord)

    if (dbError) {
      console.error('[STORE-INVOICES] DB Error:', dbError)
      // Continuar aun si falla el guardado, al menos enviar email
    }

    // Enviar email con PDF adjunto
    let emailSent = false
    let emailError = ''

    try {
      const transporter = await getMailTransporter()
      
      // Limpiar el nombre de la tienda para evitar errores en el header 'from'
      const cleanStoreName = storeName.replace(/[^\w\s]/gi, '').substring(0, 40)
      const fromEmail = process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@localecomer.store'
      
      console.log(`[STORE-INVOICES] Intentando enviar email a ${buyerEmail} desde ${fromEmail}...`)

      const emailHTML = buildInvoiceEmailHTML({
        storeName,
        buyerName,
        invoiceNumber,
        total,
        date: `${dateStr} ${timeStr}`,
        products: invoiceProducts,
      })

      const mailOptions = {
        from: `"${cleanStoreName} via LocalEcomer" <${fromEmail}>`,
        to: buyerEmail,
        subject: `🧾 Factura de Compra ${invoiceNumber} — ${storeName}`,
        html: emailHTML,
        attachments: [
          {
            filename: `Factura_${invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      }

      const info = await transporter.sendMail(mailOptions)
      console.log(`[STORE-INVOICES] Email enviado con éxito: ${info.messageId}`)
      emailSent = true
    } catch (mailErr: any) {
      console.error('[STORE-INVOICES] Error detallado de Email:', mailErr)
      emailError = mailErr.message || 'Error al enviar email'
    }

    return NextResponse.json({
      success: true,
      invoiceNumber,
      emailSent,
      emailError: emailError || undefined,
      message: emailSent
        ? `Factura ${invoiceNumber} enviada a ${buyerEmail}`
        : `Factura generada pero no se pudo enviar el email: ${emailError}`,
    })

  } catch (err: any) {
    console.error('[STORE-INVOICES] Error:', err)
    return NextResponse.json({ error: 'Error generando factura: ' + err.message }, { status: 500 })
  }
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GET — Listar facturas de una tienda                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requerido' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data: invoices, error } = await supabase
      .from('store_invoices')
      .select('*')
      .eq('store_id', storeId)
      .order('sent_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[STORE-INVOICES] List Error:', error)
      return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 })
    }

    return NextResponse.json({ success: true, invoices: invoices || [] })

  } catch (err: any) {
    console.error('[STORE-INVOICES] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
