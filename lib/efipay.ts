/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  EFIPAY API CLIENT
 *  Documentación: https://efipay.co/docs/1.0/overview
 * ═══════════════════════════════════════════════════════════════════════════
 */

import crypto from 'crypto'

/* ─── Configuración lazy (compatible con Vercel build) ─── */
const getConfig = () => ({
  apiUrl: process.env.EFIPAY_API_URL || 'https://sag.efipay.co',
  apiToken: process.env.EFIPAY_API_TOKEN || '',
  webhookToken: process.env.EFIPAY_WEBHOOK_TOKEN || '',
  commerceId: process.env.EFIPAY_COMMERCE_ID || '',
  officeId: parseInt(process.env.EFIPAY_OFFICE_ID || '0', 10),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://localecomer.vercel.app',
})

/* ─── Tipos ─── */
export interface EfipayGeneratePaymentParams {
  description: string
  amount: number
  currency?: 'COP' | 'USD' | 'EUR'
  orderId: string
  storeSlug: string
}

export interface EfipayGenerateResponse {
  saved: boolean
  payment_id: string
  url?: string      // Solo en modo redirect
  token?: string    // Solo en modo API
}

export interface EfipayTransactionStatus {
  transaction_id: number
  amount: number
  currency_type: string
  value_cop: number
  payment_method: string
  payment_method_source: string
  trazability_id: number | null
  authorization_code: string | null
  transaction_details: Record<string, unknown>
  status: 'Aprobada' | 'Rechazada' | 'Pendiente' | 'Fallida' | 'Por pagar' | string
  url_response: string
  approved_at: string | null
  production: boolean
  created_at: string
  customer_payer: Record<string, unknown>
  description?: string
}

export interface EfipayWebhookPayload {
  transaction: EfipayTransactionStatus
  checkout: {
    id: string
    commerce_id: number
    office_id: number
    total_advance: number
    paid_at: string | null
    payment_gateway: {
      advanced_option: {
        result_urls: {
          approved?: string
          rejected?: string
          pending?: string
          webhook?: string
        }
      }
    }
    paid_advance: {
      description: string
      amount_paid: number
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GENERAR PAGO (checkout tipo redirect)                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function generatePayment(params: EfipayGeneratePaymentParams): Promise<EfipayGenerateResponse> {
  const config = getConfig()
  
  const resultUrls = {
    approved: `${config.appUrl}/pago/resultado?status=approved&orderId=${params.orderId}&storeSlug=${params.storeSlug}`,
    rejected: `${config.appUrl}/pago/resultado?status=rejected&orderId=${params.orderId}&storeSlug=${params.storeSlug}`,
    pending: `${config.appUrl}/pago/resultado?status=pending&orderId=${params.orderId}&storeSlug=${params.storeSlug}`,
    webhook: `${config.appUrl}/api/efipay/webhook`,
  }

  // Fecha límite: 3 días desde hoy
  const limitDate = new Date()
  limitDate.setDate(limitDate.getDate() + 3)
  const limitDateStr = limitDate.toISOString().split('T')[0]

  const body = {
    payment: {
      description: params.description,
      amount: params.amount,
      currency_type: params.currency || 'COP',
      checkout_type: 'redirect',
    },
    advanced_options: {
      limit_date: limitDateStr,
      references: [params.orderId],
      result_urls: resultUrls,
      has_comments: false,
    },
    office: config.officeId,
  }

  console.log('[EFIPAY] Generating payment:', JSON.stringify(body, null, 2))

  const response = await fetch(`${config.apiUrl}/api/v1/payment/generate-payment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('[EFIPAY] Generate payment error:', data)
    throw new Error(data?.message || data?.error || `Efipay error ${response.status}`)
  }

  console.log('[EFIPAY] Payment generated:', data)
  return data as EfipayGenerateResponse
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CONSULTAR ESTADO DE TRANSACCIÓN                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function getTransactionStatus(paymentId: string): Promise<EfipayTransactionStatus | null> {
  const config = getConfig()

  try {
    const response = await fetch(`${config.apiUrl}/api/v1/payment/transaction/status/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[EFIPAY] Status check failed:', response.status)
      return null
    }

    const data = await response.json()
    return data?.transaction || data || null
  } catch (error) {
    console.error('[EFIPAY] Status check error:', error)
    return null
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VERIFICAR FIRMA DEL WEBHOOK                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const config = getConfig()

  if (!config.webhookToken || !signature) {
    console.warn('[EFIPAY] Missing webhook token or signature')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.webhookToken)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HELPERS                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Mapea el status de Efipay al status interno de LocalEcomer */
export function mapEfipayStatus(efipayStatus: string): 'pending' | 'confirmed' | 'cancelled' {
  const normalized = efipayStatus.toLowerCase().trim()
  
  if (normalized === 'aprobada' || normalized === 'approved') return 'confirmed'
  if (normalized === 'rechazada' || normalized === 'rejected' || normalized === 'fallida') return 'cancelled'
  // 'pendiente', 'por pagar', etc.
  return 'pending'
}
