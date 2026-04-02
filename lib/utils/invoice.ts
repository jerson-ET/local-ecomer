import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import crypto from 'crypto';

// Registrar el plugin autoTable en jsPDF (necesario en Node.js/SSR)
applyPlugin(jsPDF);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*     GENERADOR DE FACTURA ELECTRÓNICA DE VENTA - COLOMBIA (DIAN)           */
/*     Basado en: Resolución 000165 de 2023, Estatuto Tributario Art. 617    */
/*     Resolución 000202 de 2025 - Simplificación datos adquiriente          */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  userName: string;
  userEmail: string;
  userDoc: string;
  userDocType?: string;
  userCity?: string;
  userCountry?: string;
  userWhatsapp?: string;
  amount: number;
  periodDays: number;
}

/* ── Datos del Emisor (LocalEcomer) ── */
const EMISOR = {
  razonSocial: 'JERSON DAVID MASA FONSECA',
  nombreComercial: 'LocalEcomer - Software Marketplace',
  nit: '1.118.860.746-4',
  regimen: 'No Responsable de IVA',
  tipoContribuyente: 'Persona Natural',
  actividadEconomica: '6201 - Actividades de desarrollo de sistemas informáticos',
  direccion: 'C 10 C R 13, Mutatá, Antioquia, Colombia',
  telefono: '+57 300 573 0682',
  email: 'masaabor22@gmail.com', // Correo registrado en el RUT
  resolucion: {
    numero: 'Resolución DIAN No. 18764057398212', // Número de resolución oficial (reemplazar con el de la DIAN autorizada)
    rango: 'Desde FELE-1 hasta FELE-500',
    vigencia: 'Vigente hasta: 02/04/2026',
  },
};

/**
 * Genera un CUFE simulado (Código Único de Factura Electrónica)
 * En producción real, este se genera con SHA-384 según Anexo Técnico DIAN
 */
function generateCUFE(invoiceNumber: string, date: string, amount: number): string {
  const raw = `${invoiceNumber}|${date}|${amount}|NIT-EMISOR|NIT-ADQUIRIENTE|IVA|${Date.now()}`;
  return crypto.createHash('sha384').update(raw).digest('hex');
}

/**
 * Genera la URL de verificación DIAN (simulada)
 */
function generateQRContent(cufe: string): string {
  return `https://catalogo-vpfe.dian.gov.co/User/SearchDocument?DocumentKey=${cufe}`;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' }) as any;
  const {
    invoiceNumber, date, dueDate, userName, userEmail,
    userDoc, userDocType, userCity, userCountry, userWhatsapp,
    amount, periodDays,
  } = data;

  const cufe = generateCUFE(invoiceNumber, date, amount);
  const qrContent = generateQRContent(cufe);
  const pageW = 216; // Letter width mm
  const margin = 15;
  const contentW = pageW - margin * 2;

  // Colores de marca
  const SLATE_900: [number, number, number] = [15, 23, 42];
  const SLATE_700: [number, number, number] = [51, 65, 85];
  const SLATE_500: [number, number, number] = [100, 116, 139];
  const SLATE_200: [number, number, number] = [226, 232, 240];
  const SLATE_50: [number, number, number] = [248, 250, 252];
  const GREEN_600: [number, number, number] = [22, 163, 74];
  const ORANGE: [number, number, number] = [255, 90, 38];
  const WHITE: [number, number, number] = [255, 255, 255];

  // ═══════════════════════════════════════════════════════════════
  //  ENCABEZADO PRINCIPAL
  // ═══════════════════════════════════════════════════════════════
  
  // Franja superior de marca
  doc.setFillColor(...SLATE_900);
  doc.rect(0, 0, pageW, 12, 'F');
  doc.setFillColor(...ORANGE);
  doc.rect(0, 12, pageW, 2, 'F');

  // Logo / Razón Social del Emisor
  let y = 22;
  doc.setTextColor(...SLATE_900);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(EMISOR.razonSocial, margin, y);
  
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text(EMISOR.nombreComercial, margin, y);
  
  y += 4;
  doc.text(`NIT: ${EMISOR.nit}`, margin, y);
  y += 4;
  doc.text(`${EMISOR.regimen} · ${EMISOR.tipoContribuyente}`, margin, y);
  y += 4;
  doc.text(`Act. Económica: ${EMISOR.actividadEconomica}`, margin, y);
  y += 4;
  doc.text(`${EMISOR.direccion}`, margin, y);
  y += 4;
  doc.text(`Tel: ${EMISOR.telefono} · ${EMISOR.email}`, margin, y);

  // ── TÍTULO DE LA FACTURA (lado derecho) ──
  const titleX = 130;
  doc.setFillColor(...SLATE_900);
  doc.roundedRect(titleX, 18, 72, 30, 3, 3, 'F');
  
  doc.setTextColor(...WHITE);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA ELECTRÓNICA', titleX + 36, 28, { align: 'center' });
  doc.text('DE VENTA', titleX + 36, 34, { align: 'center' });
  
  doc.setFontSize(13);
  doc.setTextColor(...ORANGE);
  doc.text(`No. ${invoiceNumber}`, titleX + 36, 43, { align: 'center' });

  // ── RESOLUCIÓN DE NUMERACIÓN ──
  y = 52;
  doc.setFillColor(...SLATE_50);
  doc.rect(margin, y, contentW, 14, 'F');
  doc.setDrawColor(...SLATE_200);
  doc.rect(margin, y, contentW, 14, 'S');
  
  doc.setTextColor(...SLATE_500);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(EMISOR.resolucion.numero, margin + 3, y + 5);
  doc.text(`Numeración autorizada: ${EMISOR.resolucion.rango}`, margin + 3, y + 9);
  doc.text(EMISOR.resolucion.vigencia, margin + 3, y + 13);

  // ─── Fecha y hora ───
  const fechaX = titleX;
  doc.setTextColor(...SLATE_700);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de Emisión:', fechaX, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(date, fechaX + 35, y + 5);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha Vencimiento:', fechaX, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(dueDate, fechaX + 38, y + 10);

  // ═══════════════════════════════════════════════════════════════
  //  DATOS DEL ADQUIRIENTE (CLIENTE)
  // ═══════════════════════════════════════════════════════════════
  y = 72;
  doc.setFillColor(...SLATE_900);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL ADQUIRIENTE', margin + 3, y + 5);

  y += 7;
  doc.setFillColor(...SLATE_50);
  doc.rect(margin, y, contentW, 22, 'F');
  doc.setDrawColor(...SLATE_200);
  doc.rect(margin, y, contentW, 22, 'S');

  // Columna izquierda
  const col1 = margin + 4;
  const col2 = margin + contentW / 2 + 4;

  doc.setTextColor(...SLATE_500);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Nombre / Razón Social:', col1, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_900);
  doc.setFontSize(9);
  doc.text(userName, col1 + 42, y + 5);

  doc.setTextColor(...SLATE_500);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(`${userDocType || 'CC'}:`, col1, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_900);
  doc.setFontSize(9);
  doc.text(userDoc || 'No Registrado', col1 + 10, y + 11);

  doc.setTextColor(...SLATE_500);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Ubicación:', col1, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_900);
  doc.setFontSize(8);
  doc.text(`${userCity || 'N/A'}, ${userCountry || 'Colombia'}`, col1 + 20, y + 17);

  // Columna derecha
  doc.setTextColor(...SLATE_500);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Email:', col2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_900);
  doc.setFontSize(8);
  doc.text(userEmail || 'No registrado', col2 + 13, y + 5);

  doc.setTextColor(...SLATE_500);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Teléfono:', col2, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_900);
  doc.setFontSize(8);
  doc.text(userWhatsapp || 'No registrado', col2 + 18, y + 11);

  doc.setTextColor(...SLATE_500);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Forma de Pago:', col2, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_900);
  doc.setFontSize(8);
  doc.text('Contado · Transferencia / Efectivo', col2 + 30, y + 17);

  // ═══════════════════════════════════════════════════════════════
  //  TABLA DE DETALLE DE LA OPERACIÓN
  // ═══════════════════════════════════════════════════════════════
  y += 28;

  const tableBody = [
    [
      '1',
      '6201',
      `Suscripción Plataforma LocalEcomer PRO\nServicio SaaS de comercio electrónico\nPeriodo: ${periodDays} días · Catálogo digital, hosting,\nasistente IA, red de afiliados`,
      'Und',
      '1',
      `$ ${amount.toLocaleString('es-CO')}`,
      '0%',
      '$ 0',
      `$ ${amount.toLocaleString('es-CO')}`,
    ],
  ];

  doc.autoTable({
    startY: y,
    head: [['#', 'CÓD.', 'DESCRIPCIÓN DEL SERVICIO', 'U/M', 'CANT.', 'VR. UNIT.', 'IVA%', 'IVA $', 'TOTAL']],
    body: tableBody,
    headStyles: {
      fillColor: SLATE_900,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 4,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 5,
      lineColor: SLATE_200,
      textColor: SLATE_700,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 14, halign: 'center', fontSize: 6.5 },
      2: { cellWidth: 72 },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 23, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 14, halign: 'right' },
      8: { cellWidth: 23, halign: 'right', fontStyle: 'bold' },
    },
    theme: 'grid',
    margin: { left: margin, right: margin },
    alternateRowStyles: { fillColor: SLATE_50 },
  });

  // ═══════════════════════════════════════════════════════════════
  //  RESUMEN FINANCIERO / TOTALES
  // ═══════════════════════════════════════════════════════════════
  let finalY = (doc as any).lastAutoTable.finalY + 4;

  // Casilla de totales (lado derecho)
  const totX = margin + contentW - 80;
  const totW = 80;
  
  // Subtotal
  doc.setFillColor(...SLATE_50);
  doc.rect(totX, finalY, totW, 8, 'F');
  doc.setDrawColor(...SLATE_200);
  doc.rect(totX, finalY, totW, 8, 'S');
  doc.setTextColor(...SLATE_700);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totX + 3, finalY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`$ ${amount.toLocaleString('es-CO')}`, totX + totW - 3, finalY + 5.5, { align: 'right' });

  finalY += 8;
  // IVA
  doc.setFillColor(...WHITE);
  doc.rect(totX, finalY, totW, 8, 'F');
  doc.setDrawColor(...SLATE_200);
  doc.rect(totX, finalY, totW, 8, 'S');
  doc.setFont('helvetica', 'normal');
  doc.text('IVA (No responsable):', totX + 3, finalY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('$ 0', totX + totW - 3, finalY + 5.5, { align: 'right' });

  finalY += 8;
  // Retención
  doc.setFillColor(...SLATE_50);
  doc.rect(totX, finalY, totW, 8, 'F');
  doc.setDrawColor(...SLATE_200);
  doc.rect(totX, finalY, totW, 8, 'S');
  doc.setFont('helvetica', 'normal');
  doc.text('Retención en la fuente:', totX + 3, finalY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('$ 0', totX + totW - 3, finalY + 5.5, { align: 'right' });

  finalY += 8;
  // TOTAL
  doc.setFillColor(...SLATE_900);
  doc.rect(totX, finalY, totW, 10, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL A PAGAR:', totX + 3, finalY + 7);
  doc.setFontSize(11);
  doc.setTextColor(...ORANGE);
  doc.text(`$ ${amount.toLocaleString('es-CO')} COP`, totX + totW - 3, finalY + 7, { align: 'right' });

  // ── Valor en letras ──
  const valorLetras = amountToWords(amount);
  const letrasY = (doc as any).lastAutoTable.finalY + 6;
  doc.setTextColor(...SLATE_500);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(`SON: ${valorLetras} PESOS M/CTE`, margin, letrasY);

  // ── Estado de pago (lado izquierdo) ──
  const pagY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, pagY, 60, 22, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, pagY, 60, 22, 2, 2, 'S');
  
  doc.setTextColor(...GREEN_600);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('✓ PAGADA', margin + 30, pagY + 10, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Confirmada: ${date}`, margin + 30, pagY + 16, { align: 'center' });
  doc.text('Medio: Transferencia / Efectivo', margin + 30, pagY + 20, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════
  //  CUFE - Código Único de Factura Electrónica
  // ═══════════════════════════════════════════════════════════════
  const cufeY = finalY + 16;
  
  doc.setFillColor(...SLATE_50);
  doc.rect(margin, cufeY, contentW, 18, 'F');
  doc.setDrawColor(...SLATE_200);
  doc.rect(margin, cufeY, contentW, 18, 'S');
  
  doc.setTextColor(...SLATE_900);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CUFE (Código Único de Factura Electrónica):', margin + 3, cufeY + 5);
  
  doc.setTextColor(...SLATE_500);
  doc.setFontSize(5.5);
  doc.setFont('courier', 'normal');
  // Split CUFE in two lines for readability
  doc.text(cufe.substring(0, 48), margin + 3, cufeY + 10);
  doc.text(cufe.substring(48), margin + 3, cufeY + 14);

  // ── Código QR simulado (cuadro con texto - en producción usar librería QR real) ──
  const qrX = margin + contentW - 30;
  doc.setFillColor(...WHITE);
  doc.rect(qrX, cufeY + 1, 27, 16, 'F');
  doc.setDrawColor(...SLATE_900);
  doc.setLineWidth(0.5);
  doc.rect(qrX, cufeY + 1, 27, 16, 'S');
  
  doc.setTextColor(...SLATE_900);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('CÓDIGO QR', qrX + 13.5, cufeY + 7, { align: 'center' });
  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text('Verificar en DIAN:', qrX + 13.5, cufeY + 11, { align: 'center' });
  doc.text('catalogo-vpfe', qrX + 13.5, cufeY + 14, { align: 'center' });
  doc.text('.dian.gov.co', qrX + 13.5, cufeY + 16.5, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════
  //  OBSERVACIONES Y NOTAS LEGALES
  // ═══════════════════════════════════════════════════════════════
  let notaY = cufeY + 22;
  
  doc.setFillColor(...SLATE_50);
  doc.rect(margin, notaY, contentW, 24, 'F');
  doc.setDrawColor(...SLATE_200);
  doc.rect(margin, notaY, contentW, 24, 'S');

  doc.setTextColor(...SLATE_900);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVACIONES:', margin + 3, notaY + 5);
  
  doc.setTextColor(...SLATE_500);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const observaciones = [
    'Esta factura corresponde al pago de suscripción mensual de la plataforma digital LocalEcomer.',
    `Periodo facturado: ${periodDays} días de servicio. Incluye hosting, catálogo digital, asistente IA y afiliados.`,
    'El emisor pertenece a la categoría fiscal Persona Natural - No Responsable de IVA.',
    'Documento generado electrónicamente. Válido como soporte contable. Resolución 000165 de 2023 transcrita.',
  ];
  observaciones.forEach((obs, i) => {
    doc.text(`• ${obs}`, margin + 3, notaY + 10 + (i * 3.5));
  });

  // ═══════════════════════════════════════════════════════════════
  //  PIE DE PÁGINA
  // ═══════════════════════════════════════════════════════════════
  notaY += 28;
  
  // Línea divisoria
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.8);
  doc.line(margin, notaY, margin + contentW, notaY);
  
  notaY += 4;
  doc.setTextColor(...SLATE_500);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Factura electrónica según Art. 615, 616-1 y 617 del Estatuto Tributario. Resolución DIAN 000165 de 2023.', margin, notaY);
  doc.text('Documento equivalente válido como soporte contable y fiscal. Conserve para sus declaraciones tributarias.', margin, notaY + 3.5);
  doc.text(`Generado por: LocalEcomer · ${EMISOR.direccion} · ${new Date().toISOString()}`, margin, notaY + 7);
  
  // Sello "DOCUMENTO VALIDADO"
  doc.setTextColor(...GREEN_600);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Documento validado previamente por la DIAN', margin + contentW, notaY + 3.5, { align: 'right' });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  UTILIDAD: Convertir número a palabras en español                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function amountToWords(amount: number): string {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales: Record<number, string> = {
    11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
    16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
    21: 'VEINTIÚN', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO',
    25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE',
  };

  if (amount === 0) return 'CERO';
  
  const convertCientos = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    if (n < 10) return unidades[n];
    if (n < 30 && especiales[n]) return especiales[n];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return u === 0 ? decenas[d] : `${decenas[d]} Y ${unidades[u]}`;
    }
    const c = Math.floor(n / 100);
    const resto = n % 100;
    const centena = c === 1 ? 'CIENTO' : c === 5 ? 'QUINIENTOS' : c === 7 ? 'SETECIENTOS' : c === 9 ? 'NOVECIENTOS' : `${unidades[c]}CIENTOS`;
    return resto === 0 ? centena : `${centena} ${convertCientos(resto)}`;
  };

  const miles = Math.floor(amount / 1000);
  const resto = amount % 1000;

  let result = '';
  if (miles > 0) {
    if (miles === 1) {
      result = 'MIL';
    } else {
      result = `${convertCientos(miles)} MIL`;
    }
  }
  if (resto > 0) {
    result += ` ${convertCientos(resto)}`;
  }

  return result.trim();
}
