'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  Download,
  QrCode,
  Loader2,
  CheckCircle2,
  Scissors,
} from 'lucide-react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TYPES                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface QRProduct {
  id: string
  name: string
  price: number
  discountPrice?: number | null
  sku?: string | null
  mainImage?: string
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Generar QR como Data URL (canvas → base64)                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

async function generateQRDataUrl(
  text: string,
  size: number = 200
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Componente de QR individual para un producto (vista detalle)              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function SingleProductQR({
  product,
  size = 140,
}: {
  product: QRProduct
  size?: number
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    const code = product.sku || product.id
    generateQRDataUrl(code, size).then(setQrUrl)
  }, [product.sku, product.id, size])

  if (!qrUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
        }}
      >
        <Loader2
          size={24}
          color="#6366f1"
          style={{ animation: 'spin 1s linear infinite' }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 14,
          padding: 10,
          border: '2px solid #e2e8f0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <img
          src={qrUrl}
          alt={`QR - ${product.name}`}
          style={{
            width: size,
            height: size,
            display: 'block',
          }}
        />
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#475569',
          textAlign: 'center',
          maxWidth: size + 20,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {product.sku || product.id.substring(0, 8)}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Modal de hoja completa de QR — Descarga en PDF                            */
/*  Optimizado para escalabilidad: sin imágenes de producto,                  */
/*  solo QR + nombre + código. Soporta miles de productos.                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function QRSheetModal({
  products,
  storeName,
  onClose,
}: {
  products: QRProduct[]
  storeName?: string
  onClose: () => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [progress, setProgress] = useState(0)

  // Para el preview solo generamos los primeros 12 QR (rendimiento)
  const previewProducts = products.slice(0, 12)
  const [previewQRs, setPreviewQRs] = useState<Record<string, string>>({})

  useEffect(() => {
    const tasks = previewProducts.map(async (p) => {
      const code = p.sku || p.id
      const url = await generateQRDataUrl(code, 200)
      return { id: p.id, url }
    })
    Promise.all(tasks).then((results) => {
      const map: Record<string, string> = {}
      results.forEach((r) => (map[r.id] = r.url))
      setPreviewQRs(map)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length])

  /* ─── Generar PDF con TODOS los QR ─── */
  /* Sin imágenes de producto. Solo: QR + nombre + código ID/SKU              */
  /* Layout compacto de 4 columnas para maximizar productos por página        */
  const handleDownloadPDF = useCallback(async () => {
    setIsDownloading(true)
    setIsGenerating(true)
    setProgress(0)

    try {
      const pdf = new jsPDF('p', 'mm', 'letter')
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()

      // Layout compacto: 4 columnas × N filas
      const cols = 4
      const qrSize = 35 // mm — compacto para caber 4 por fila
      const cellW = (pageW - 16) / cols // margen 8mm a cada lado
      const cellH = 52 // mm (QR + nombre + código)
      const marginX = 8
      const marginY = 16
      const rowsPerPage = Math.floor((pageH - marginY - 8) / cellH)
      const itemsPerPage = cols * rowsPerPage

      const totalPages = Math.ceil(products.length / itemsPerPage)

      // Título de la página
      const drawHeader = (pageNum: number) => {
        pdf.setFillColor(15, 23, 42)
        pdf.rect(0, 0, pageW, 12, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.text(
          `${storeName || 'Mi Tienda'} - Codigos QR`,
          marginX,
          8
        )
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'normal')
        pdf.text(
          `Pag. ${pageNum}/${totalPages}  |  ${products.length} productos  |  Recortar por lineas punteadas`,
          pageW - marginX,
          8,
          { align: 'right' }
        )
      }

      // Generar QR por lotes para no bloquear el hilo
      const BATCH_SIZE = 20
      const allQRUrls: Record<string, string> = {}

      for (let batch = 0; batch < products.length; batch += BATCH_SIZE) {
        const slice = products.slice(batch, batch + BATCH_SIZE)
        const results = await Promise.all(
          slice.map(async (p) => {
            const code = p.sku || p.id
            const url = await generateQRDataUrl(code, 250)
            return { id: p.id, url }
          })
        )
        results.forEach((r) => (allQRUrls[r.id] = r.url))
        setProgress(Math.round(((batch + slice.length) / products.length) * 50))
        // Dar respiro al event loop
        await new Promise((r) => setTimeout(r, 0))
      }

      setIsGenerating(false)
      setProgress(50)

      // Dibujar cada producto en el PDF
      let currentPage = 1
      drawHeader(currentPage)

      for (let i = 0; i < products.length; i++) {
        const p = products[i]!
        const code = p.sku || p.id
        const qrUrl = allQRUrls[p.id]
        if (!qrUrl) continue

        const idxOnPage = i % itemsPerPage
        const col = idxOnPage % cols
        const row = Math.floor(idxOnPage / cols)

        // Salto de página
        if (i > 0 && idxOnPage === 0) {
          pdf.addPage()
          currentPage++
          drawHeader(currentPage)
        }

        const x = marginX + col * cellW
        const y = marginY + row * cellH

        // ─── Líneas de corte punteadas ───
        pdf.setDrawColor(190, 190, 190)
        pdf.setLineDashPattern([1, 1], 0)

        // Línea derecha (excepto última columna)
        if (col < cols - 1) {
          pdf.line(x + cellW, y - 1, x + cellW, y + cellH - 2)
        }
        // Línea inferior
        pdf.line(x, y + cellH - 2, x + cellW, y + cellH - 2)

        pdf.setLineDashPattern([], 0)

        // ─── QR centrado ───
        const qrX = x + (cellW - qrSize) / 2
        const qrY = y + 1

        // Borde sutil del QR
        pdf.setFillColor(255, 255, 255)
        pdf.setDrawColor(220, 220, 220)
        pdf.roundedRect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, 2, 2, 'FD')

        // Imagen QR
        pdf.addImage(qrUrl, 'PNG', qrX, qrY, qrSize, qrSize)

        // ─── Nombre del producto (truncado) ───
        pdf.setTextColor(15, 23, 42)
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        const truncName =
          p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name
        pdf.text(truncName, x + cellW / 2, qrY + qrSize + 5, {
          align: 'center',
        })

        // ─── Código ID/SKU ───
        pdf.setTextColor(100, 116, 139)
        pdf.setFontSize(5)
        pdf.setFont('helvetica', 'normal')
        const codeLabel =
          code.length > 24 ? code.substring(0, 24) + '...' : code
        pdf.text(`ID: ${codeLabel}`, x + cellW / 2, qrY + qrSize + 9, {
          align: 'center',
        })

        // ─── Precio ───
        pdf.setTextColor(16, 130, 90)
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        const displayPrice = p.discountPrice || p.price
        pdf.text(
          `$${displayPrice.toLocaleString('es-CO')}`,
          x + cellW / 2,
          qrY + qrSize + 13,
          { align: 'center' }
        )

        // Actualizar progreso
        if (i % 50 === 0) {
          setProgress(50 + Math.round((i / products.length) * 50))
        }
      }

      // Guardar
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `QR_Productos_${(storeName || 'Tienda').replace(/\s+/g, '_')}_${dateStr}.pdf`
      pdf.save(filename)
      setProgress(100)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (err) {
      console.error('Error generando PDF:', err)
      alert('Error al generar el PDF')
    } finally {
      setIsDownloading(false)
      setIsGenerating(false)
    }
  }, [products, storeName])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .qr-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
        @media (max-width: 480px) { .qr-preview-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }
      `}</style>

      <div
        style={{
          background: 'white',
          borderRadius: 24,
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                borderRadius: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={20} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>
                Códigos QR de Productos
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                {products.length.toLocaleString('es-CO')} productos · PDF listo para imprimir y recortar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: 34,
              height: 34,
              borderRadius: 9,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Banner */}
        <div
          style={{
            margin: '14px 18px 0',
            padding: '11px 14px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            borderRadius: 12,
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <Scissors
            size={16}
            color="#2563eb"
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <div style={{ fontSize: 11, color: '#1e40af', lineHeight: 1.5 }}>
            <strong>Descarga el PDF</strong>, imprímelo y recorta cada QR por las
            líneas punteadas. Pégalos en los productos físicos y escanéalos con la{' '}
            <strong style={{ color: '#059669' }}>cámara del POS</strong> para
            vender al instante. Sin imágenes, solo códigos — rápido incluso con miles de productos.
          </div>
        </div>

        {/* Body — Preview de los primeros QR */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 18px',
          }}
        >
          {/* Contador */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
              Vista previa ({Math.min(12, products.length)} de{' '}
              {products.length.toLocaleString('es-CO')})
            </span>
            {products.length > 12 && (
              <span
                style={{
                  fontSize: 10,
                  color: '#94a3b8',
                  background: '#f1f5f9',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                +{(products.length - 12).toLocaleString('es-CO')} más en el PDF
              </span>
            )}
          </div>

          <div className="qr-preview-grid">
            {previewProducts.map((p) => (
              <div
                key={p.id}
                style={{
                  background: '#f8fafc',
                  borderRadius: 12,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid #e2e8f0',
                }}
              >
                {/* QR */}
                {previewQRs[p.id] ? (
                  <img
                    src={previewQRs[p.id]}
                    alt={`QR ${p.name}`}
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 8,
                      background: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Loader2
                      size={16}
                      color="#94a3b8"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                  </div>
                )}

                {/* Nombre + código (sin imagen de producto) */}
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#0f172a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      color: '#64748b',
                      fontWeight: 600,
                      marginTop: 2,
                      fontFamily: 'monospace',
                    }}
                  >
                    {p.sku || p.id.substring(0, 12) + '...'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar cuando se está generando */}
        {isDownloading && (
          <div style={{ padding: '0 18px 8px' }}>
            <div
              style={{
                background: '#e2e8f0',
                borderRadius: 6,
                height: 6,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: isGenerating
                    ? 'linear-gradient(90deg, #6366f1, #a855f7)'
                    : '#10b981',
                  borderRadius: 6,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#64748b',
                textAlign: 'center',
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              {isGenerating
                ? `Generando QR... ${progress}%`
                : `Armando PDF... ${progress}%`}
            </div>
          </div>
        )}

        {/* Footer — Botones de acción */}
        <div
          style={{
            padding: '14px 18px 18px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            style={{
              flex: 2,
              background: downloadSuccess
                ? '#10b981'
                : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              padding: '14px 20px',
              fontSize: 14,
              fontWeight: 800,
              cursor: isDownloading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isDownloading ? 0.7 : 1,
              transition: 'all 0.3s',
              boxShadow: '0 4px 15px rgba(15,23,42,0.2)',
            }}
          >
            {isDownloading ? (
              <>
                <Loader2
                  size={18}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
                {isGenerating ? 'Generando QR...' : 'Armando PDF...'}
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 size={18} />
                ¡PDF Descargado!
              </>
            ) : (
              <>
                <Download size={18} />
                Descargar PDF ({products.length.toLocaleString('es-CO')} productos)
              </>
            )}
          </button>

          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '14px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
