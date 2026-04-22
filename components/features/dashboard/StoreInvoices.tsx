'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText, Send, Loader2, CheckCircle2, AlertCircle,
  Mail, User, CreditCard, ArrowLeft, ChevronRight,
  Plus, Minus, Trash2, Search, Receipt
} from 'lucide-react'

interface InvoiceProduct {
  name: string
  quantity: number
  unitPrice: number
}

interface SavedInvoice {
  id: string
  invoice_number: string
  buyer_name: string
  buyer_email: string
  buyer_document: string
  products: { name: string; quantity: number; unitPrice: number; total: number }[]
  total: number
  sent_at: string
  status: string
  payment_method: string
}

export function StoreInvoices() {
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [view, setView] = useState<'list' | 'create'>('list')
  const [invoices, setInvoices] = useState<SavedInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerDocument, setBuyerDocument] = useState('')
  const [buyerDocType, setBuyerDocType] = useState('C.C.')
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [products, setProducts] = useState<InvoiceProduct[]>([{ name: '', quantity: 1, unitPrice: 0 }])

  useEffect(() => { loadStore() }, [])

  const loadStore = async () => {
    try {
      const res = await fetch('/api/user/stores')
      if (res.ok) {
        const stores = await res.json()
        if (stores.length > 0) {
          setStoreId(stores[0].id)
          setStoreName(stores[0].name)
          setStoreSlug(stores[0].slug || '')
          loadInvoices(stores[0].id)
        }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const loadInvoices = async (sid: string) => {
    try {
      const res = await fetch(`/api/store-invoices?storeId=${sid}`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } catch { /* ignore */ }
  }

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  const addProduct = () => setProducts(p => [...p, { name: '', quantity: 1, unitPrice: 0 }])
  const removeProduct = (i: number) => setProducts(p => p.filter((_, idx) => idx !== i))
  const updateProduct = (i: number, field: keyof InvoiceProduct, val: string | number) => {
    setProducts(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  const totalAmount = products.reduce((acc, p) => acc + (p.unitPrice * p.quantity), 0)

  const handleSend = async () => {
    if (!buyerName || !buyerEmail || !buyerDocument || products.some(p => !p.name || !p.unitPrice)) {
      showToast('Completa todos los campos: nombre, email, cédula y productos', 'error')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      showToast('El correo electrónico no es válido', 'error')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/store-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId, storeName, storeSlug, buyerName, buyerEmail,
          buyerDocument, buyerDocumentType: buyerDocType,
          products: products.map(p => ({ name: p.name, quantity: p.quantity, unitPrice: p.unitPrice, price: p.unitPrice })),
          paymentMethod,
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(data.emailSent ? `✅ Factura ${data.invoiceNumber} enviada a ${buyerEmail}` : `⚠️ Factura generada. ${data.emailError || 'Email no configurado'}`, data.emailSent ? 'success' : 'error')
        setBuyerName(''); setBuyerEmail(''); setBuyerDocument('')
        setProducts([{ name: '', quantity: 1, unitPrice: 0 }])
        setView('list')
        if (storeId) loadInvoices(storeId)
      } else {
        showToast(data.error || 'Error al generar factura', 'error')
      }
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setSending(false)
    }
  }

  const filteredInvoices = invoices.filter(inv =>
    inv.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.buyer_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16 }}>
        <Loader2 size={48} className="animate-spin" color="#6366f1" />
        <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Cargando facturas...</span>
      </div>
    )
  }

  /* ═══ CREAR FACTURA ═══ */
  if (view === 'create') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px 40px' }}>
        {toast && (
          <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', borderRadius: 14, padding: '12px 24px', fontSize: 14, fontWeight: 700, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', maxWidth: '90vw', textAlign: 'center' }}>
            {toast.msg}
          </div>
        )}

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, padding: '12px 0' }}>
          <button onClick={() => setView('list')} style={{ background: '#1e293b', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={18} /></button>
          <span style={{ color: '#64748b', fontSize: 13 }}>Facturas</span>
          <ChevronRight size={14} color="#64748b" />
          <span style={{ color: '#f8fafc', fontSize: 13, fontWeight: 700 }}>Nueva Factura</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99,102,241,0.3)' }}>
            <Receipt size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc', margin: 0 }}>Nueva Factura Electrónica</h2>
            <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>Se enviará al correo del comprador con PDF adjunto</p>
          </div>
        </div>

        {/* Datos del comprador */}
        <div style={{ background: '#1e293b', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} color="#6366f1" />Datos del Comprador</h3>
          
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Nombre Completo</label>
              <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Ej: Juan Pérez" style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Tipo Doc.</label>
                <select value={buyerDocType} onChange={e => setBuyerDocType(e.target.value)} style={{ width: '100%', padding: '12px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: 'white', fontSize: 13 }}>
                  <option value="C.C.">C.C.</option>
                  <option value="NIT">NIT</option>
                  <option value="C.E.">C.E.</option>
                  <option value="TI">T.I.</option>
                  <option value="PP">Pasaporte</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Número de Documento</label>
                <input type="text" value={buyerDocument} onChange={e => setBuyerDocument(e.target.value)} placeholder="Ej: 1.118.860.746" style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} placeholder="correo@ejemplo.com" style={{ width: '100%', padding: '12px 14px 12px 36px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Método de Pago</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {['Efectivo', 'Transferencia', 'Otro'].map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)} style={{ padding: '10px', borderRadius: 10, border: '1px solid', borderColor: paymentMethod === m ? '#6366f1' : '#334155', background: paymentMethod === m ? 'rgba(99,102,241,0.1)' : 'transparent', color: paymentMethod === m ? '#a5b4fc' : '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{m}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div style={{ background: '#1e293b', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><CreditCard size={16} color="#6366f1" />Productos Comprados</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {products.map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 32px', gap: 8, alignItems: 'end' }}>
                <div>
                  {i === 0 && <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>PRODUCTO</label>}
                  <input type="text" value={p.name} onChange={e => updateProduct(i, 'name', e.target.value)} placeholder="Nombre" style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: 'white', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>CANT.</label>}
                  <input type="number" min={1} value={p.quantity} onChange={e => updateProduct(i, 'quantity', parseInt(e.target.value) || 1)} style={{ width: '100%', padding: '10px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: 'white', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>PRECIO</label>}
                  <input type="number" min={0} value={p.unitPrice || ''} onChange={e => updateProduct(i, 'unitPrice', parseInt(e.target.value) || 0)} placeholder="$0" style={{ width: '100%', padding: '10px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: 'white', fontSize: 13, outline: 'none' }} />
                </div>
                <button onClick={() => removeProduct(i)} disabled={products.length <= 1} style={{ width: 32, height: 38, background: products.length <= 1 ? '#1e293b' : 'rgba(239,68,68,0.1)', border: '1px solid', borderColor: products.length <= 1 ? '#334155' : 'rgba(239,68,68,0.3)', borderRadius: 10, color: products.length <= 1 ? '#475569' : '#ef4444', cursor: products.length <= 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <button onClick={addProduct} style={{ marginTop: 12, width: '100%', padding: '10px', background: 'transparent', border: '2px dashed #334155', borderRadius: 12, color: '#6366f1', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Plus size={16} />Agregar Producto</button>
        </div>

        {/* Total y enviar */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: 20, padding: 24, border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>TOTAL DE LA FACTURA</span>
            <span style={{ fontSize: 28, fontWeight: 950, color: '#10b981' }}>${totalAmount.toLocaleString('es-CO')}</span>
          </div>
          <button onClick={handleSend} disabled={sending} style={{ width: '100%', padding: '16px', background: sending ? '#475569' : 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: sending ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 30px rgba(99,102,241,0.3)' }}>
            {sending ? <><Loader2 size={20} className="animate-spin" /> Generando y Enviando...</> : <><Send size={20} /> Enviar Factura al Correo</>}
          </button>
        </div>
      </div>
    )
  }

  /* ═══ LISTA DE FACTURAS ═══ */
  return (
    <div style={{ padding: '0 16px 40px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', borderRadius: 14, padding: '12px 24px', fontSize: 14, fontWeight: 700, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', maxWidth: '90vw', textAlign: 'center' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99,102,241,0.3)' }}>
            <FileText size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc', margin: 0 }}>Facturas Electrónicas</h2>
            <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>{invoices.length} facturas enviadas</p>
          </div>
        </div>
        <button onClick={() => setView('create')} style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(99,102,241,0.3)' }}>
          <Plus size={18} /> Nueva Factura
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input type="text" placeholder="Buscar por nombre, email o N° factura..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 14px 12px 40px', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: 'white', fontSize: 13, outline: 'none' }} />
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#1e293b', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Receipt size={56} color="#334155" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: '0 0 8px' }}>{searchTerm ? 'Sin resultados' : 'Sin facturas aún'}</h3>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 20px' }}>{searchTerm ? 'Intenta con otro término' : 'Crea tu primera factura electrónica de compra'}</p>
          {!searchTerm && <button onClick={() => setView('create')} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}><Plus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Crear Factura</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredInvoices.map(inv => (
            <div key={inv.id} style={{ background: '#1e293b', borderRadius: 16, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.2s' }}>
              <div style={{ width: 44, height: 44, background: 'rgba(99,102,241,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={20} color="#6366f1" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>{inv.buyer_name}</span>
                  <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 6 }}>Enviada</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>{inv.invoice_number}</span>
                  <span>{inv.buyer_email}</span>
                  <span>{new Date(inv.sent_at).toLocaleDateString('es-CO')}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>${inv.total?.toLocaleString('es-CO')}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{inv.payment_method}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
