import { jsPDF } from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'

// Registrar el plugin autoTable en jsPDF (necesario en Node.js/SSR)
applyPlugin(jsPDF)

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GENERADOR DE FACTURA ELECTRÓNICA DE COMPRA — POR TIENDA                  */
/*                                                                            */
/*  Genera un PDF premium con:                                                */
/*    - Datos de la tienda emisora                                            */
/*    - Datos del comprador (nombre, cédula, correo)                          */
/*    - Tabla de productos comprados                                          */
/*    - Totales                                                               */
/*    - Sello automático cursivo con nombre de la tienda                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface InvoiceProduct {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

export interface StoreInvoiceData {
  invoiceNumber: string
  date: string
  /* Datos de la tienda */
  storeName: string
  storeSlug?: string
  /* Datos del comprador */
  buyerName: string
  buyerEmail: string
  buyerDocument: string       // Cédula
  buyerDocumentType?: string  // CC, NIT, etc.
  /* Productos */
  products: InvoiceProduct[]
  /* Totales */
  subtotal: number
  total: number
  /* Método de pago */
  paymentMethod?: string
}

export async function generateStoreInvoicePDF(data: StoreInvoiceData): Promise<Buffer> {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' }) as any
  const {
    invoiceNumber, date, storeName, storeSlug,
    buyerName, buyerEmail, buyerDocument, buyerDocumentType,
    products, subtotal, total, paymentMethod,
  } = data

  const pageW = 216
  const margin = 15
  const contentW = pageW - margin * 2

  /* ── Paleta de colores ── */
  const SLATE_900: [number, number, number] = [15, 23, 42]
  const SLATE_700: [number, number, number] = [51, 65, 85]
  const SLATE_500: [number, number, number] = [100, 116, 139]
  const SLATE_200: [number, number, number] = [226, 232, 240]
  const SLATE_50: [number, number, number] = [248, 250, 252]
  const WHITE: [number, number, number] = [255, 255, 255]
  const INDIGO: [number, number, number] = [99, 102, 241]
  const PURPLE: [number, number, number] = [139, 92, 246]
  const GREEN: [number, number, number] = [16, 185, 129]

  // ═══════════════════════════════════════════════════════════════
  //  ENCABEZADO — Franja de marca
  // ═══════════════════════════════════════════════════════════════
  doc.setFillColor(...SLATE_900)
  doc.rect(0, 0, pageW, 14, 'F')
  // Línea degradado indigo-purple
  doc.setFillColor(...INDIGO)
  doc.rect(0, 14, pageW / 2, 2.5, 'F')
  doc.setFillColor(...PURPLE)
  doc.rect(pageW / 2, 14, pageW / 2, 2.5, 'F')

  // Nombre de la tienda en la franja
  doc.setTextColor(...WHITE)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(storeName.toUpperCase(), margin, 10)

  // URL tienda
  if (storeSlug) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(200, 200, 255)
    doc.text(`localecomer.store/tienda/${storeSlug}`, pageW - margin, 10, { align: 'right' })
  }

  // ═══════════════════════════════════════════════════════════════
  //  TÍTULO DE FACTURA
  // ═══════════════════════════════════════════════════════════════
  let y = 26

  // Caja del título
  doc.setFillColor(...INDIGO)
  doc.roundedRect(margin, y - 4, 75, 22, 3, 3, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURA ELECTRÓNICA', margin + 37.5, y + 4, { align: 'center' })
  doc.text('DE COMPRA', margin + 37.5, y + 11, { align: 'center' })

  // Número y fecha
  const infoX = margin + 85
  doc.setTextColor(...SLATE_900)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`N° ${invoiceNumber}`, infoX, y + 2)

  doc.setTextColor(...SLATE_500)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${date}`, infoX, y + 9)

  if (paymentMethod) {
    doc.text(`Pago: ${paymentMethod}`, infoX, y + 15)
  }

  // ═══════════════════════════════════════════════════════════════
  //  DATOS DEL COMPRADOR
  // ═══════════════════════════════════════════════════════════════
  y = 52

  // Header
  doc.setFillColor(...SLATE_900)
  doc.rect(margin, y, contentW, 7, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL COMPRADOR', margin + 3, y + 5)

  y += 7
  doc.setFillColor(...SLATE_50)
  doc.rect(margin, y, contentW, 18, 'F')
  doc.setDrawColor(...SLATE_200)
  doc.rect(margin, y, contentW, 18, 'S')

  const col1 = margin + 4
  const col2 = margin + contentW / 2 + 4

  // Nombre
  doc.setTextColor(...SLATE_500)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('Cliente:', col1, y + 5)
  doc.setTextColor(...SLATE_900)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(buyerName, col1 + 16, y + 5)

  // Cédula
  doc.setTextColor(...SLATE_500)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text(`${buyerDocumentType || 'C.C.'}:`, col1, y + 11)
  doc.setTextColor(...SLATE_900)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(buyerDocument, col1 + 12, y + 11)

  // Email
  doc.setTextColor(...SLATE_500)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('Email:', col2, y + 5)
  doc.setTextColor(...SLATE_900)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(buyerEmail, col2 + 13, y + 5)

  // Tienda
  doc.setTextColor(...SLATE_500)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('Tienda:', col2, y + 11)
  doc.setTextColor(...INDIGO)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(storeName, col2 + 15, y + 11)

  // ═══════════════════════════════════════════════════════════════
  //  TABLA DE PRODUCTOS
  // ═══════════════════════════════════════════════════════════════
  y += 24

  const tableBody = products.map((p, i) => [
    String(i + 1),
    p.name,
    String(p.quantity),
    `$ ${p.unitPrice.toLocaleString('es-CO')}`,
    `$ ${p.total.toLocaleString('es-CO')}`,
  ])

  doc.autoTable({
    startY: y,
    head: [['#', 'PRODUCTO', 'CANT.', 'PRECIO UNIT.', 'TOTAL']],
    body: tableBody,
    headStyles: {
      fillColor: SLATE_900,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 5,
      halign: 'center' as const,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 5,
      lineColor: SLATE_200,
      textColor: SLATE_700,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' as const },
      1: { cellWidth: 80 },
      2: { cellWidth: 18, halign: 'center' as const },
      3: { cellWidth: 35, halign: 'right' as const },
      4: { cellWidth: 35, halign: 'right' as const, fontStyle: 'bold' },
    },
    theme: 'grid' as const,
    margin: { left: margin, right: margin },
    alternateRowStyles: { fillColor: SLATE_50 },
  })

  // ═══════════════════════════════════════════════════════════════
  //  TOTALES
  // ═══════════════════════════════════════════════════════════════
  let finalY = (doc as any).lastAutoTable.finalY + 6

  const totX = margin + contentW - 80
  const totW = 80

  // Subtotal
  doc.setFillColor(...SLATE_50)
  doc.rect(totX, finalY, totW, 9, 'F')
  doc.setDrawColor(...SLATE_200)
  doc.rect(totX, finalY, totW, 9, 'S')
  doc.setTextColor(...SLATE_700)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal:', totX + 4, finalY + 6)
  doc.setFont('helvetica', 'bold')
  doc.text(`$ ${subtotal.toLocaleString('es-CO')}`, totX + totW - 4, finalY + 6, { align: 'right' })

  finalY += 9
  // TOTAL
  doc.setFillColor(...INDIGO)
  doc.rect(totX, finalY, totW, 12, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', totX + 4, finalY + 8)
  doc.setFontSize(13)
  doc.text(`$ ${total.toLocaleString('es-CO')}`, totX + totW - 4, finalY + 8, { align: 'right' })

  // ═══════════════════════════════════════════════════════════════
  //  SELLO AUTOMÁTICO — Nombre de la tienda en cursiva
  //  Tipo firma bancaria elegante
  // ═══════════════════════════════════════════════════════════════
  const sealY = (doc as any).lastAutoTable.finalY + 8
  const sealX = margin + 10
  const sealW = 70
  const sealH = 40

  // Círculo/Elipse decorativa del sello
  doc.setDrawColor(...INDIGO)
  doc.setLineWidth(1.5)
  doc.ellipse(sealX + sealW / 2, sealY + sealH / 2, sealW / 2, sealH / 2, 'S')

  // Doble borde
  doc.setLineWidth(0.5)
  doc.ellipse(sealX + sealW / 2, sealY + sealH / 2, sealW / 2 - 3, sealH / 2 - 3, 'S')

  // Texto "VENDIDO POR" arriba
  doc.setTextColor(...INDIGO)
  doc.setFontSize(5.5)
  doc.setFont('helvetica', 'bold')
  doc.text('— VENDIDO POR —', sealX + sealW / 2, sealY + 10, { align: 'center' })

  // Nombre de la tienda en CURSIVA GRANDE (simulada con italic)
  doc.setFontSize(14)
  doc.setFont('times', 'bolditalic')
  doc.setTextColor(...SLATE_900)

  // Ajustar tamaño si nombre muy largo
  const nameLen = storeName.length
  if (nameLen > 18) doc.setFontSize(10)
  else if (nameLen > 12) doc.setFontSize(12)

  doc.text(storeName, sealX + sealW / 2, sealY + sealH / 2 + 2, { align: 'center' })

  // Línea decorativa debajo del nombre
  doc.setDrawColor(...PURPLE)
  doc.setLineWidth(0.3)
  const lineW = Math.min(storeName.length * 2.5, sealW - 16)
  doc.line(
    sealX + sealW / 2 - lineW / 2,
    sealY + sealH / 2 + 5,
    sealX + sealW / 2 + lineW / 2,
    sealY + sealH / 2 + 5,
  )

  // Texto "FACTURA VERIFICADA" abajo
  doc.setFontSize(4.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...INDIGO)
  doc.text('FACTURA VERIFICADA ✓', sealX + sealW / 2, sealY + sealH - 8, { align: 'center' })

  // Fecha en el sello
  doc.setFontSize(4)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...SLATE_500)
  doc.text(date, sealX + sealW / 2, sealY + sealH - 4, { align: 'center' })

  // ═══════════════════════════════════════════════════════════════
  //  MARCA DE AGUA — Sello "PAGADO" rotado
  // ═══════════════════════════════════════════════════════════════
  const paidX = margin + contentW - 50
  const paidY = sealY + 10

  doc.saveGraphicsState()
  doc.setGState(new doc.GState({ opacity: 0.12 }))
  doc.setTextColor(...GREEN)
  doc.setFontSize(40)
  doc.setFont('helvetica', 'bold')

  // Texto rotado "PAGADO"
  const centerXPaid = paidX + 20
  const centerYPaid = paidY + 15
  doc.text('PAGADO', centerXPaid, centerYPaid, {
    align: 'center',
    angle: 25,
  })
  doc.restoreGraphicsState()

  // ═══════════════════════════════════════════════════════════════
  //  PIE DE PÁGINA
  // ═══════════════════════════════════════════════════════════════
  const footY = 250

  // Línea decorativa
  doc.setDrawColor(...INDIGO)
  doc.setLineWidth(0.5)
  doc.line(margin, footY, margin + contentW, footY)

  doc.setTextColor(...SLATE_500)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Gracias por tu compra. Esta factura fue generada electrónicamente por la plataforma LocalEcomer.', pageW / 2, footY + 5, { align: 'center' })
  doc.text(`${storeName} · Factura ${invoiceNumber} · ${date}`, pageW / 2, footY + 9, { align: 'center' })

  doc.setTextColor(...INDIGO)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('LocalEcomer.store — Tu comercio digital', pageW / 2, footY + 14, { align: 'center' })

  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}
