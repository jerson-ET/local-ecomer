import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2/client'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    // No referral Code Used
    if (!file) return NextResponse.json({ error: 'No hay archivo' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Subir a R2 en carpeta de comprobantes
    const fileName = `receipts/${user.id}/${Date.now()}-${file.name}`
    const publicUrl = await uploadToR2(buffer, fileName, file.type)

    // Actualizar metadatos del usuario con el link del comprobante y estado pendiente
    const currentInvoices = user.user_metadata?.invoices || []
    
    // Si usó un código, su deuda por este recibo es de 25k, de lo contrario 50k
    const amount = 49900;

    const newInvoice = {
      id: `PEND-${Date.now()}`,
      number: 'PENDIENTE',
      amount: amount,
      date: new Date().toISOString(),
      url: publicUrl,
      type: 'RENOVACION',
      status: 'pending_verification',

    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        invoices: [newInvoice, ...currentInvoices],
        last_receipt_url: publicUrl,
        pending_verification: true
      }
    })

    if (updateError) throw updateError

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err: any) {
    console.error('Error uploading receipt:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
