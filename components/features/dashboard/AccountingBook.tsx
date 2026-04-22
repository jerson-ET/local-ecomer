'use client'

import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Package,
  TrendingUp,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus, 
  User, 
  Tag, 
  ChevronRight,
  ArrowRight,
  Hash,
  RotateCcw,
  Trash2,
  X,
  Mail,
  Receipt,
  Send,
  FileText
} from 'lucide-react'

interface PendingOrder {
  id: string
  buyer_name: string
  total_amount: number
  status: string
  created_at: string
  estimated_delivery: string | null
  items: {
    product_name_snapshot: string
    quantity: number
    product: { sku: string | null } | null
  }[]
}

interface Product {
  id: string
  name: string
  price: number
  discount_price: number | null
  stock: number
  images: any[]
  sku: string | null
}

interface Stats {
  activeProducts: number
  soldUnits: number
  pendingOrdersCount: number
  totalStock: number
}

export const AccountingBook: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Manual Sale Modal State
  const [showModal, setShowModal] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [manualSale, setManualSale] = useState({
    productId: '',
    quantity: 1,
    buyerName: '',
    buyerPhone: '',
    estimatedDelivery: '',
    notes: ''
  })
  const [isClient, setIsClient] = useState(false)
  
  // Invoice State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceEmail, setInvoiceEmail] = useState('')
  const [invoiceDocument, setInvoiceDocument] = useState('')
  const [invoiceDocType, setInvoiceDocType] = useState('C.C.')
  const [sendingInvoice, setSendingInvoice] = useState(false)
  const [storeInfo, setStoreInfo] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [saleToInvoice, setSaleToInvoice] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    fetchStoreInfo()
  }, [])

  const fetchStoreInfo = async () => {
    try {
      const res = await fetch('/api/user/stores')
      if (res.ok) {
        const stores = await res.json()
        if (stores.length > 0) {
          setStoreInfo({ id: stores[0].id, name: stores[0].name, slug: stores[0].slug || '' })
        }
      }
    } catch (e) { console.error(e) }
  }
  const [submittingSale, setSubmittingSale] = useState(false)
  const [sessionSales, setSessionSales] = useState<any[]>([])
  const [localPendingSales, setLocalPendingSales] = useState<any[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('localPendingSales')
    if (stored) {
      try {
        setLocalPendingSales(JSON.parse(stored))
      } catch (e) {
        console.error('Error parsing localPendingSales', e)
      }
    }
  }, [])
  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyOrders, setHistoryOrders] = useState<PendingOrder[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null)

  // Inventory Modal State
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [inventoryProducts, setInventoryProducts] = useState<Product[]>([])
  const [loadingInventory, setLoadingInventory] = useState(false)

  // Clients Modal State
  const [showClientsModal, setShowClientsModal] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [loadingClients, setLoadingClients] = useState(false)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/accounting/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setPendingOrders(data.pendingOrders)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStoreProducts = async () => {
    setLoadingProducts(true)
    try {
      const storeRes = await fetch('/api/user/stores')
      if (storeRes.ok) {
        const stores = await storeRes.json()
        if (stores.length > 0) {
          const res = await fetch(`/api/products?storeId=${stores[0].id}`)
          if (res.ok) {
            const data = await res.json()
            setProducts(data.products || [])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleOpenModal = () => {
    setShowModal(true)
    fetchStoreProducts()
  }

  const handleManualSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualSale.productId) return alert('Selecciona un producto')

    const product = products.find(p => p.id === manualSale.productId)
    if (!product) return alert('Producto no encontrado')

    const unitPrice = product.discount_price || product.price
    const newSale = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      productId: manualSale.productId,
      quantity: manualSale.quantity,
      buyerName: manualSale.buyerName,
      estimatedDelivery: manualSale.estimatedDelivery,
      productName: product.name,
      sku: product.sku,
      unitPrice,
      totalAmount: unitPrice * manualSale.quantity,
      timestamp: new Date().toISOString(),
    }

    setLocalPendingSales(prev => {
      const updated = [newSale, ...prev]
      localStorage.setItem('localPendingSales', JSON.stringify(updated))
      return updated
    })

    setSessionSales(prev => [newSale, ...prev])

    setManualSale({
      productId: '',
      quantity: 1,
      buyerName: '',
      buyerPhone: '',
      estimatedDelivery: '',
      notes: ''
    })

    setShowModal(false)
  }

  const cancelLocalSale = (id: string) => {
    setLocalPendingSales(prev => {
      const updated = prev.filter(s => s.id !== id)
      localStorage.setItem('localPendingSales', JSON.stringify(updated))
      return updated
    })
  }

  const confirmLocalSale = async (sale: any) => {
    // En vez de procesar directo, abrimos el modal de factura
    setSaleToInvoice(sale)
    setShowInvoiceModal(true)
  }

  const processSaleWithInvoice = async () => {
    if (!saleToInvoice) return
    if (!invoiceEmail || !invoiceDocument) {
      alert('⚠️ Ingresa el correo y documento del comprador')
      return
    }

    setSubmittingSale(true)
    setSendingInvoice(true)
    setUpdatingId(saleToInvoice.id)

    try {
      // 1. Procesar la venta en Supabase
      const res = await fetch('/api/accounting/manual-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: saleToInvoice.productId,
          quantity: saleToInvoice.quantity,
          buyerName: saleToInvoice.buyerName || 'Cliente Manual',
          estimatedDelivery: saleToInvoice.estimatedDelivery || 'Entregado hoy',
          status: 'delivered'
        })
      })

      if (res.ok) {
        // 2. Enviar la factura electrónica
        try {
          await fetch('/api/store-invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storeId: storeInfo?.id,
              storeName: storeInfo?.name || 'Mi Tienda',
              storeSlug: storeInfo?.slug,
              buyerName: saleToInvoice.buyerName || 'Cliente Manual',
              buyerEmail: invoiceEmail,
              buyerDocument: invoiceDocument,
              buyerDocumentType: invoiceDocType,
              products: [{
                name: saleToInvoice.productName,
                quantity: saleToInvoice.quantity,
                unitPrice: saleToInvoice.unitPrice,
                price: saleToInvoice.unitPrice,
              }],
              paymentMethod: 'Efectivo', // Por defecto para ventas manuales
            }),
          })
        } catch (e) {
          console.error('Error sending invoice:', e)
        }

        // 3. Limpiar estado local
        setLocalPendingSales(prev => {
          const updated = prev.filter(s => s.id !== saleToInvoice.id)
          localStorage.setItem('localPendingSales', JSON.stringify(updated))
          return updated
        })
        
        await fetchStats()
        setShowInvoiceModal(false)
        setInvoiceEmail('')
        setInvoiceDocument('')
        setSaleToInvoice(null)
        alert('Venta procesada y factura enviada con éxito.')
      } else {
        const errorData = await res.json()
        alert('Error del servidor: ' + (errorData.error || 'Desconocido'))
      }
    } catch (error: any) {
      console.error('Error confirming local sale:', error)
      alert('Error de red: ' + error.message)
    } finally {
      setSubmittingSale(false)
      setSendingInvoice(false)
      setUpdatingId(null)
    }
  }

  const updateDeliveryDate = async (orderId: string, dateText: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch('/api/accounting/stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, estimatedDelivery: dateText })
      })
      if (res.ok) {
        setPendingOrders(prev => prev.map(o => o.id === orderId ? { ...o, estimated_delivery: dateText } : o))
      }
    } catch (error) {
      console.error('Error updating delivery date:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const markAsDelivered = async (orderId: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch('/api/accounting/stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'delivered' })
      })
      if (res.ok) {
        setPendingOrders(prev => prev.filter(o => o.id !== orderId))
        await fetchStats()
      }
    } catch (error) {
      console.error('Error marking as delivered:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const returnToStock = async (orderId: string) => {
    if (!confirm('¿Devolver estos productos al stock? La venta será cancelada.')) return
    setUpdatingId(orderId)
    try {
      const res = await fetch('/api/accounting/stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'returned' })
      })
      if (res.ok) {
        setPendingOrders(prev => prev.filter(o => o.id !== orderId))
        await fetchStats()
        alert('Stock devuelto y venta cancelada con éxito.');
      } else {
        const errorData = await res.json()
        alert('Error del servidor: ' + (errorData.error || 'Desconocido'))
      }
    } catch (error: any) {
      console.error('Error returning to stock:', error)
      alert('Error de red: ' + error.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/accounting/history')
      if (res.ok) {
        const data = await res.json()
        setHistoryOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleOpenHistory = () => {
    setShowHistoryModal(true)
    fetchHistory()
  }

  const handleOpenInventory = async () => {
    setShowInventoryModal(true)
    setLoadingInventory(true)
    await fetchStoreProducts()
    setLoadingInventory(false)
  }

  const fetchClients = async () => {
    setLoadingClients(true)
    try {
      const res = await fetch('/api/accounting/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoadingClients(false) }
  }

  const handleOpenClients = () => {
    setShowClientsModal(true)
    fetchClients()
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #f1f5f9', borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Cargando cuaderno...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 34, height: 34, background: '#0f172a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)', color: 'white', marginTop: 4 }}>
              <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Cuaderno Contable</h2>
              <p style={{ color: '#64748b', fontSize: 15, fontWeight: 500, margin: '4px 0 0' }}>Gestión inteligente de ventas y entregas</p>
            </div>
          </div>
          <button onClick={handleOpenModal} style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, padding: '3px 8px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', boxShadow: '0 4px 10px rgba(15, 23, 42, 0.15)', marginTop: 4 }}>
            <Plus size={24} /> Nueva Venta
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 48 }}>
          <StatCard icon={<Package size={24} />} title="Productos Activos" value={stats?.activeProducts || 0} subtitle="En catálogo online" color="#10b981" onClick={() => window.location.hash = '#productos'} />
          <StatCard icon={<TrendingUp size={24} />} title="Unidades Vendidas" value={stats?.soldUnits || 0} subtitle="Ventas totales" color="#6366f1" onClick={handleOpenModal} />
          <StatCard icon={<Hash size={24} />} title="Stock Total" value={stats?.totalStock || 0} subtitle="Unidades disponibles" color="#f59e0b" onClick={handleOpenInventory} />
        </div>

        {isClient && localPendingSales.length > 0 && (
          <div style={{ background: 'white', borderRadius: 32, padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.02)', border: '2px solid #e2e8f0', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, background: '#f1f5f9', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={22} color="#0f172a" />
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Productos en Proceso</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 600 }}>Aún no se guardan en Supabase</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {localPendingSales.map(sale => (
                <div key={sale.id} style={{ padding: '20px', background: '#f8fafc', borderRadius: 24, border: '2px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{sale.buyerName || 'Cliente'}</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                        <span style={{ fontWeight: 800, color: 'white', background: '#0f172a', padding: '2px 8px', borderRadius: 6 }}>{sale.quantity}x</span> {sale.productName} {sale.sku ? `[${sale.sku}]` : ''}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981', marginTop: 8 }}>
                        ${sale.totalAmount.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'flex-end' }}>
                      <button
                        onClick={() => confirmLocalSale(sale)}
                        disabled={updatingId === sale.id}
                        style={{ padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        {updatingId === sale.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Ya entregado
                      </button>
                      <button
                        onClick={() => cancelLocalSale(sale.id)}
                        disabled={updatingId === sale.id}
                        style={{ padding: '8px 16px', background: 'transparent', color: '#ef4444', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Trash2 size={14} /> Descartar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div id="entregas" style={{ background: 'white', borderRadius: 32, border: '1px solid #f1f5f9', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, background: '#fef3c7', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={22} color="#f59e0b" /></div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Gestión de Entregas</h3>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', background: '#f8fafc', padding: '6px 16px', borderRadius: 12 }}>{pendingOrders.length} Pendientes</span>
          </div>
          {pendingOrders.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: 24, border: '2px dashed #e2e8f0' }}>
              <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: '#64748b', fontWeight: 600 }}>No tienes entregas pendientes.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {pendingOrders.map((order) => (<OrderCard key={order.id} order={order} updatingId={updatingId} onUpdateDate={updateDeliveryDate} onMarkDelivered={markAsDelivered} onReturnStock={returnToStock} />))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 32, padding: '32px', color: 'white', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <TrendingUp size={22} color="#10b981" />
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Rendimiento Estimado</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800 }}>PENDIENTE</p>
                <div style={{ fontSize: 24, fontWeight: 900 }}>${pendingOrders.reduce((acc, o) => acc + o.total_amount, 0).toLocaleString('es-CO')}</div>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800 }}>TICKET PROM.</p>
                <div style={{ fontSize: 24, fontWeight: 900 }}>${pendingOrders.length > 0 ? Math.round(pendingOrders.reduce((acc, o) => acc + o.total_amount, 0) / pendingOrders.length).toLocaleString('es-CO') : '0'}</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 32, border: '1px solid #f1f5f9', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Acciones Rápidas</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <QuickActionButton icon={<Package size={18} />} label="Ver Inventario" onClick={handleOpenInventory} />
              <QuickActionButton icon={<User size={18} />} label="Clientes" onClick={handleOpenClients} />
              <QuickActionButton icon={<Clock size={18} />} label="Historial" onClick={handleOpenHistory} />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Sale Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 36, width: '100%', maxWidth: 540, padding: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 32, right: 32, border: 'none', background: '#f8fafc', borderRadius: 14, width: 40, height: 40, cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>Registrar Venta</h3>
            <form onSubmit={handleManualSaleSubmit} style={{ display: 'grid', gap: 20 }}>
              <select required value={manualSale.productId} onChange={(e) => setManualSale(prev => ({ ...prev, productId: e.target.value }))} style={{ width: '100%', padding: '16px', borderRadius: 18, border: '2px solid #f1f5f9', background: '#f8fafc', fontWeight: 600 }}>
                <option value="">Seleccionar producto...</option>
                {products.map(p => (<option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.name} — Stock: {p.stock}</option>))}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <input type="number" min="1" required value={manualSale.quantity} onChange={(e) => setManualSale(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} style={{ width: '100%', padding: '16px', borderRadius: 18, border: `2px solid ${manualSale.productId && manualSale.quantity > (products.find(p => p.id === manualSale.productId)?.stock || 0) ? '#ef4444' : '#f1f5f9'}`, background: '#f8fafc', fontWeight: 700, textAlign: 'center' }} />
                <input type="text" placeholder="Entrega (Ej: Hoy)" value={manualSale.estimatedDelivery} onChange={(e) => setManualSale(prev => ({ ...prev, estimatedDelivery: e.target.value }))} style={{ width: '100%', padding: '16px', borderRadius: 18, border: '2px solid #f1f5f9', background: '#f8fafc', fontWeight: 600 }} />
              </div>
              {manualSale.productId && (() => {
                const selectedProduct = products.find(p => p.id === manualSale.productId)
                const stock = selectedProduct?.stock || 0
                const exceedsStock = manualSale.quantity > stock
                const outOfStock = stock === 0
                return (
                  <div style={{ padding: '12px 16px', borderRadius: 14, background: exceedsStock || outOfStock ? '#fef2f2' : '#f0fdf4', border: `1px solid ${exceedsStock || outOfStock ? '#fecaca' : '#dcfce7'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertCircle size={16} color={exceedsStock || outOfStock ? '#ef4444' : '#10b981'} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: exceedsStock || outOfStock ? '#dc2626' : '#059669' }}>
                      {outOfStock ? `⚠️ Producto agotado — Stock: 0` : exceedsStock ? `⚠️ Stock insuficiente — Solo quedan ${stock} unidades` : `✓ Stock disponible: ${stock} unidades`}
                    </span>
                  </div>
                )
              })()}
              <input type="text" placeholder="Nombre del Cliente" value={manualSale.buyerName} onChange={(e) => setManualSale(prev => ({ ...prev, buyerName: e.target.value }))} style={{ width: '100%', padding: '16px', borderRadius: 18, border: '2px solid #f1f5f9', background: '#f8fafc', fontWeight: 600 }} />
              <button type="submit" disabled={submittingSale || !manualSale.productId || manualSale.quantity > (products.find(p => p.id === manualSale.productId)?.stock || 0) || manualSale.quantity <= 0} style={{ background: submittingSale || !manualSale.productId || manualSale.quantity > (products.find(p => p.id === manualSale.productId)?.stock || 0) ? '#94a3b8' : '#10b981', color: 'white', border: 'none', borderRadius: 20, padding: '18px', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
                {submittingSale ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />} Confirmar Venta
              </button>
            </form>
            {manualSale.productId && !submittingSale && (
              <div style={{ marginTop: 20 }}>
                <PreviewCard sale={manualSale} productName={products.find(p => p.id === manualSale.productId)?.name || ''} sku={products.find(p => p.id === manualSale.productId)?.sku} />
              </div>
            )}
            {sessionSales.length > 0 && (
              <div style={{ marginTop: 20, maxHeight: 120, overflowY: 'auto', display: 'grid', gap: 8 }}>
                {sessionSales.map((s, i) => (
                  <div key={i} style={{ padding: '10px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #dcfce7', fontSize: 12, fontWeight: 700, color: '#065f46' }}>
                    {s.quantity}x {s.productName} — {s.buyerName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 36, width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setShowHistoryModal(false)} style={{ position: 'absolute', top: 32, right: 32, border: 'none', background: '#f8fafc', borderRadius: 14, width: 40, height: 40, cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>Historial de Ventas</h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 12 }}>
              {loadingHistory ? <Loader2 className="animate-spin" size={32} style={{ margin: '40px auto' }} color="#6366f1" /> : historyOrders.length === 0 ? <p style={{ textAlign: 'center', color: '#64748b' }}>No hay registros.</p> : historyOrders.map((order) => (
                <div key={order.id} onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)} style={{ padding: '16px', borderRadius: 20, background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{order.buyer_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(order.created_at).toLocaleDateString()} · ${order.total_amount.toLocaleString('es-CO')}</div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: order.status === 'delivered' ? '#059669' : (order.status === 'returned' || order.status === 'cancelled' || order.status === 'refunded') ? '#ef4444' : '#d97706' }}>
                      {order.status === 'delivered' ? 'ENTREGADO' : 
                       order.status === 'returned' ? 'DEVUELTO' : 
                       order.status === 'cancelled' ? 'CANCELADO' : 
                       order.status === 'refunded' ? 'REEMBOLSADO' : 
                       'PENDIENTE'}
                    </div>
                  </div>
                  {selectedOrder?.id === order.id && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                      {order.items?.map((item, i) => (<div key={i} style={{ fontSize: 12, color: '#334155' }}>• {item.quantity}x {item.product_name_snapshot}</div>))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 36, width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setShowInventoryModal(false)} style={{ position: 'absolute', top: 32, right: 32, border: 'none', background: '#f8fafc', borderRadius: 14, width: 40, height: 40, cursor: 'pointer' }}><X size={20} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, background: '#eef2ff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={22} color="#6366f1" /></div>
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }}>Inventario</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{products.length} productos en tu tienda</p>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 12 }}>
              {loadingInventory ? <Loader2 className="animate-spin" size={32} style={{ margin: '40px auto' }} color="#6366f1" /> : products.length === 0 ? <p style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>No hay productos.</p> : products.map((p) => (
                <div key={p.id} style={{ padding: '16px', borderRadius: 20, background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {p.images?.[0]?.thumbnail && (
                    <img src={p.images[0].thumbnail} alt={p.name} style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 12, marginTop: 4 }}>
                      {p.sku && <span style={{ background: '#eef2ff', color: '#6366f1', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{p.sku}</span>}
                      <span>${p.price.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: p.stock > 10 ? '#10b981' : p.stock > 0 ? '#f59e0b' : '#ef4444' }}>{p.stock}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Existencias</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clients Modal */}
      {showClientsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 36, width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setShowClientsModal(false)} style={{ position: 'absolute', top: 32, right: 32, border: 'none', background: '#f8fafc', borderRadius: 14, width: 40, height: 40, cursor: 'pointer' }}><X size={20} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, background: '#f1f5f9', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={22} color="#0f172a" /></div>
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }}>Clientes</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{clients.length} clientes registrados</p>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 12 }}>
              {loadingClients ? <Loader2 className="animate-spin" size={32} style={{ margin: '40px auto' }} color="#a855f7" /> : clients.length === 0 ? <p style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>No hay clientes aún.</p> : clients.map((c, i) => (
                <div key={i} style={{ padding: '16px', borderRadius: 20, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, background: '#0f172a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 900 }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.totalOrders} compra{c.totalOrders > 1 ? 's' : ''} · {c.totalUnits} ud.</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>${c.totalSpent.toLocaleString('es-CO')}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(c.lastPurchase).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {c.products.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.products.map((p: string, j: number) => (
                        <span key={j} style={{ fontSize: 10, background: '#f1f5f9', color: '#0f172a', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ═══ MODAL DE FACTURA ELECTRÓNICA ═══ */}
      {showInvoiceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 440, padding: '32px', boxShadow: '0 40px 100px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setShowInvoiceModal(false)} style={{ position: 'absolute', top: 24, right: 24, border: 'none', background: '#f8fafc', borderRadius: 12, width: 36, height: 36, cursor: 'pointer' }}><X size={18} /></button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Factura Electrónica</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Se enviará al correo del comprador</p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 20, padding: 20, marginBottom: 24, border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Resumen de Venta</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>{saleToInvoice?.productName} <span style={{ color: '#94a3b8' }}>x{saleToInvoice?.quantity}</span></span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>${saleToInvoice?.totalAmount?.toLocaleString('es-CO')}</span>
              </div>
              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>TOTAL</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>${saleToInvoice?.totalAmount?.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
                <input
                  type="email"
                  placeholder="Correo del comprador"
                  value={invoiceEmail}
                  onChange={e => setInvoiceEmail(e.target.value)}
                  style={{ width: '100%', padding: '16px 16px 16px 48px', background: '#f8fafc', border: '2px solid #f1f5f9', borderRadius: 18, color: '#0f172a', fontSize: 15, fontWeight: 600, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}>
                <select
                  value={invoiceDocType}
                  onChange={e => setInvoiceDocType(e.target.value)}
                  style={{ padding: '16px', background: '#f8fafc', border: '2px solid #f1f5f9', borderRadius: 18, color: '#0f172a', fontSize: 14, fontWeight: 700, outline: 'none' }}
                >
                  <option value="C.C.">C.C.</option>
                  <option value="NIT">NIT</option>
                  <option value="C.E.">C.E.</option>
                  <option value="TI">T.I.</option>
                  <option value="PP">Pasaporte</option>
                </select>
                <input
                  type="text"
                  placeholder="Número de documento"
                  value={invoiceDocument}
                  onChange={e => setInvoiceDocument(e.target.value)}
                  style={{ width: '100%', padding: '16px', background: '#f8fafc', border: '2px solid #f1f5f9', borderRadius: 18, color: '#0f172a', fontSize: 15, fontWeight: 600, outline: 'none' }}
                />
              </div>

              <div style={{ marginTop: 8, padding: '14px', background: '#eef2ff', borderRadius: 16, border: '1px solid #e0e7ff', fontSize: 12, color: '#6366f1', lineHeight: 1.5, fontWeight: 600 }}>
                ✍️ Se generará un PDF con el sello oficial de <strong>{storeInfo?.name}</strong> en cursiva y se enviará al cliente.
              </div>

              <button
                onClick={processSaleWithInvoice}
                disabled={sendingInvoice}
                style={{ width: '100%', padding: '18px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)' }}
              >
                {sendingInvoice ? <><Loader2 size={20} className="animate-spin" /> Procesando...</> : <><Send size={20} /> Finalizar y Enviar Factura</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const StatCard = ({ icon, title, value, subtitle, color, onClick }: any) => (
  <div onClick={onClick} style={{ background: 'white', padding: '24px', borderRadius: 28, border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.3s' }}>
    <div style={{ color, marginBottom: 16 }}>{icon}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{title}</div>
    <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{value}</div>
    <div style={{ fontSize: 12, color, fontWeight: 600 }}>{subtitle}</div>
  </div>
)

const QuickActionButton = ({ icon, label, onClick }: any) => (
  <button onClick={onClick} style={{ width: '100%', padding: '14px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
    <div style={{ color: '#0f172a' }}>{icon}</div>
    <span style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>{label}</span>
    <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#cbd5e1' }} />
  </button>
)

const OrderCard = ({ order, updatingId, onUpdateDate, onMarkDelivered, onReturnStock }: any) => {
  const [localDate, setLocalDate] = useState(order.estimated_delivery || '')
  return (
    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: 24, border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{order.buyer_name}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>#{order.id.slice(0, 8)} · ${order.total_amount?.toLocaleString('es-CO') || '0'}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {order.items?.map((item: any, i: number) => (<span key={i} style={{ fontSize: 10, background: '#eef2ff', color: '#6366f1', padding: '2px 6px', borderRadius: 6 }}>{item.quantity}x {item.product_name_snapshot}</span>))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="text" placeholder="Fecha..." value={localDate} onChange={(e) => setLocalDate(e.target.value)} onBlur={() => onUpdateDate(order.id, localDate)} style={{ border: 'none', background: 'white', padding: '8px 12px', borderRadius: 12, fontSize: 13, fontWeight: 700, width: 180 }} />
          {updatingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} color="#cbd5e1" />}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={() => onMarkDelivered(order.id)}
          disabled={updatingId === order.id}
          style={{ flex: 1, padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: 14, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: updatingId === order.id ? 0.5 : 1 }}
        >
          {updatingId === order.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Ya entregado
        </button>
      </div>
    </div>
  )
}

const PreviewCard = ({ sale, productName, sku }: any) => (
  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 20, border: '2px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 800 }}>{sale.buyerName || 'Cliente'}</div>
      <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700 }}>{sale.quantity}x {productName} {sku ? `[${sku}]` : ''}</div>
    </div>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{sale.estimatedDelivery || 'Hoy'}</div>
  </div>
)
