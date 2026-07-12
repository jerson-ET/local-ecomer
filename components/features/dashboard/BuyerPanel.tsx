'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingBag,
  Package,
  User,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  AlertCircle,
  Save,
  Check,
  Info
} from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'

interface WhatsappOrder {
  id: string
  storeName: string
  storeId: string
  products: string
  totalAmount: number
  date: string
  deliveryDate: string
  status: 'pending' | 'delivered' | 'not_delivered'
}

export default function BuyerPanel() {
  const [activeTab, setActiveTab] = useState<'inicio' | 'pedidos' | 'mis-pedidos'>('inicio')
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Profile Form States
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [documentType, setDocumentType] = useState('CC')
  const [documentNumber, setDocumentNumber] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // WhatsApp Order Confirmation Modal States
  const [pendingOrder, setPendingOrder] = useState<any>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  // Local confirmed orders list
  const [localOrders, setLocalOrders] = useState<WhatsappOrder[]>([])
  const [showAllLocalOrders, setShowAllLocalOrders] = useState(false)
  const [showAllHistoryOrders, setShowAllHistoryOrders] = useState(false)

  useEffect(() => {
    fetchDashboard()
    checkPendingPurchase()
    loadLocalOrders()
  }, [])

  const fetchDashboard = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/buyer/dashboard')
      if (!res.ok) throw new Error('Debes iniciar sesión para ver tus compras.')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDashboardData(data)

      // Pre-fill profile form fields
      if (data.profile) {
        setNombre(data.profile.name || '')
        setCorreo(data.profile.email || '')
        setDocumentType(data.profile.document_type || 'CC')
        setDocumentNumber(data.profile.document_number || '')
        setWhatsapp(data.profile.whatsapp || '')
        setCity(data.profile.city || '')
        setAddress(data.profile.address || '')
      }
    } catch (err: any) {
      setLoadError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const checkPendingPurchase = () => {
    if (typeof window !== 'undefined') {
      const pending = localStorage.getItem('pending_whatsapp_purchase')
      if (pending) {
        try {
          const parsed = JSON.parse(pending)
          setPendingOrder(parsed)
          setShowConfirmModal(true)
        } catch (e) {
          console.error('Error parsing pending purchase', e)
        }
      }
    }
  }

  const loadLocalOrders = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('buyer_mis_pedidos')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            let hasChanges = false
            const idsSeen = new Set<string>()
            const repaired = parsed.map((order: any, idx: number) => {
              const isGeneric = !order.id || order.id === 'DIRECTO' || order.id === 'DIRECTO_FALLBACK'
              const isDuplicate = idsSeen.has(order.id)
              if (isGeneric || isDuplicate) {
                hasChanges = true
                const newId = `WA-${Date.now()}-${idx}-${Math.floor(1000 + Math.random() * 9000)}`
                idsSeen.add(newId)
                return { ...order, id: newId }
              }
              idsSeen.add(order.id)
              return order
            })
            if (hasChanges) {
              setLocalOrders(repaired)
              localStorage.setItem('buyer_mis_pedidos', JSON.stringify(repaired))
            } else {
              setLocalOrders(parsed)
            }
          }
        } catch (e) {
          console.error('Error parsing saved orders', e)
        }
      }
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    try {
      const res = await fetch('/api/buyer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nombre,
          document_type: documentType,
          document_number: documentNumber,
          whatsapp,
          city,
          address
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar los datos.')

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmPurchase = (confirmed: boolean) => {
    if (confirmed && pendingOrder) {
      // User confirmed they placed the order
      const isGenericId = !pendingOrder.id || pendingOrder.id === 'DIRECTO' || pendingOrder.id === 'DIRECTO_FALLBACK'
      const newOrder: WhatsappOrder = {
        id: isGenericId ? `WA-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}` : pendingOrder.id,
        storeName: pendingOrder.storeName || 'Tienda',
        storeId: pendingOrder.storeId || '',
        products: pendingOrder.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') || 'Productos',
        totalAmount: pendingOrder.totalAmount || 0,
        date: pendingOrder.date || new Date().toISOString(),
        deliveryDate: pendingOrder.deliveryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      }

      const updated = [newOrder, ...localOrders]
      setLocalOrders(updated)
      localStorage.setItem('buyer_mis_pedidos', JSON.stringify(updated))
      
      // Go to the "Mis Pedidos" section
      setActiveTab('mis-pedidos')
    }

    // Clean up temporary order and hide modal
    localStorage.removeItem('pending_whatsapp_purchase')
    setPendingOrder(null)
    setShowConfirmModal(false)
  }

  const handleUpdateOrderStatus = (orderId: string, newStatus: 'delivered' | 'not_delivered') => {
    const updated = localOrders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    )
    setLocalOrders(updated)
    localStorage.setItem('buyer_mis_pedidos', JSON.stringify(updated))
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipped': return 'bg-blue-100 text-blue-700'
      case 'delivered': return 'bg-emerald-100 text-emerald-700'
      case 'pending': return 'bg-amber-100 text-amber-700'
      case 'cancelled': return 'bg-rose-100 text-rose-700'
      case 'not_delivered': return 'bg-rose-100 text-rose-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'shipped': return <Truck size={14} />
      case 'delivered': return <CheckCircle2 size={14} />
      case 'cancelled': return <XCircle size={14} />
      case 'not_delivered': return <XCircle size={14} />
      default: return <Package size={14} />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'shipped': return 'Enviado'
      case 'delivered': return 'Recibido'
      case 'cancelled': return 'Cancelado'
      case 'not_delivered': return 'No Recibido'
      case 'paid': return 'Pagado'
      case 'processing': return 'Procesando'
      case 'returned': return 'Devuelto'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex items-center justify-center gap-3 text-gray-600 font-bold max-w-4xl mx-auto mt-8 animate-pulse">
        <Loader2 className="animate-spin text-[#8200FF]" size={24} />
        Cargando tu panel...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4 max-w-lg mx-auto mt-8 text-center">
        <AlertCircle className="text-rose-500" size={48} />
        <div>
          <div className="font-black text-gray-900 text-xl">No se pudo cargar tu panel</div>
          <div className="text-sm text-gray-600 mt-2">{loadError}</div>
        </div>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold mt-4"
        >
          Volver al Inicio
        </button>
      </div>
    )
  }

  const { profile, stats, orders } = dashboardData
  const displayName = nombre || profile?.name || profile?.email?.split('@')[0] || 'Usuario'

  // Combinar estadísticas (Base de datos + WhatsApp Local)
  const combinedStats = {
    totalSpent: (stats?.totalSpent || 0) + localOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    orderCount: (stats?.orderCount || 0) + localOrders
      .filter(o => o.status === 'delivered')
      .length,
    storesFollowed: stats?.storesFollowed || 0,
    activeOrders: (stats?.activeOrders || 0) + localOrders
      .filter(o => o.status === 'pending')
      .length
  }

  // Combinar órdenes de la DB y de WhatsApp
  const combinedOrders = [
    ...orders.map((o: any) => ({
      id: o.id,
      storeName: o.stores?.name || 'Tienda',
      status: o.status,
      date: o.created_at,
      totalAmount: o.total_amount,
      productsSummary: o.order_items?.map((item: any) => `${item.quantity}x ${item.product_name_snapshot}`).join(', ') || 'Productos',
      isLocal: false,
      rawOrder: o
    })),
    ...localOrders.map((o: any) => ({
      id: o.id,
      storeName: o.storeName,
      status: o.status,
      date: o.date,
      totalAmount: o.totalAmount,
      productsSummary: o.products,
      isLocal: true,
      rawOrder: o
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="buyer-panel p-4 max-w-4xl mx-auto space-y-6 relative">
      {/* Header Profile Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-gray-900 leading-tight">¡Hola, {displayName}!</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            {combinedStats.activeOrders > 0 ? `${combinedStats.activeOrders} pedido(s) en curso` : 'Sin pedidos en curso'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center bg-white p-1 rounded-2xl border border-gray-100 shadow-sm gap-1.5 overflow-x-auto no-scrollbar max-w-md mx-auto w-full">
        {[
          { id: 'inicio', label: 'Resumen', icon: <User size={14} /> },
          { id: 'pedidos', label: 'Historial', icon: <ShoppingBag size={14} /> },
          { id: 'mis-pedidos', label: 'Mis Pedidos', icon: <Package size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase whitespace-nowrap transition-all relative ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {tab.icon} <span>{tab.label}</span>
            {tab.id === 'mis-pedidos' && (
              <span className="absolute -top-1 right-1.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-md z-10">
                1
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <div className="space-y-4 pb-20">
        
        {/* RESUMEN (INICIO) TAB */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Total Gastado</div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">{formatCOP(combinedStats.totalSpent)}</div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Mis Compras</div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">{combinedStats.orderCount}</div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Suscripciones</div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">{combinedStats.storesFollowed}</div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase mb-2">En curso</div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">{combinedStats.activeOrders}</div>
              </div>
            </div>

            {/* EDIT PROFILE FORM SECTION */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
                <User size={20} className="text-[#8200FF]" />
                <h3 className="font-black text-gray-900 text-lg">Mis Datos de Envío</h3>
              </div>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Nombre Completo</label>
                    <input 
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#8200FF] focus:ring-1 focus:ring-[#8200FF] outline-none transition-all text-sm font-semibold bg-gray-50/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Correo Electrónico (No editable)</label>
                    <input 
                      type="email"
                      disabled
                      value={correo}
                      placeholder="tu@correo.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Tipo de Documento</label>
                    <select 
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#8200FF] focus:ring-1 focus:ring-[#8200FF] outline-none transition-all text-sm font-semibold bg-white"
                    >
                      <option value="CC">Cédula de Ciudadanía (CC)</option>
                      <option value="CE">Cédula de Extranjería (CE)</option>
                      <option value="NIT">NIT</option>
                      <option value="PP">Pasaporte (PP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Número de Documento</label>
                    <input 
                      type="text"
                      required
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="Documento de identidad"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#8200FF] focus:ring-1 focus:ring-[#8200FF] outline-none transition-all text-sm font-semibold bg-gray-50/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Número de WhatsApp</label>
                    <input 
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Ej: 3001234567"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#8200FF] focus:ring-1 focus:ring-[#8200FF] outline-none transition-all text-sm font-semibold bg-gray-50/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Ciudad / Municipio</label>
                    <input 
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ciudad"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#8200FF] focus:ring-1 focus:ring-[#8200FF] outline-none transition-all text-sm font-semibold bg-gray-50/30"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Dirección Exacta de Entrega</label>
                    <input 
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Barrio, calle, carrera, casa/apto, indicaciones..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#8200FF] focus:ring-1 focus:ring-[#8200FF] outline-none transition-all text-sm font-semibold bg-gray-50/30"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                    <Info size={14} className="text-indigo-500 shrink-0" />
                    Tus datos se auto-completarán en tu próxima compra para agilizar el pago.
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-sm shadow-md"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Guardar información
                  </button>
                </div>

                {saveSuccess && (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-4 py-3 rounded-2xl flex items-center gap-2 font-semibold text-sm transition-all animate-in fade-in">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    ¡Tu información de envío ha sido guardada con éxito!
                  </div>
                )}

                {saveError && (
                  <div className="bg-rose-50 text-rose-800 border border-rose-100 px-4 py-3 rounded-2xl flex items-center gap-2 font-semibold text-sm transition-all animate-in fade-in">
                    <AlertCircle size={18} className="text-rose-600" />
                    {saveError}
                  </div>
                )}
              </form>
            </div>

            {/* PEDIDOS RECIENTES */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} className="text-[#8200FF]" /> Pedidos Recientes
              </h3>
              
              {combinedOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold">Aún no tienes pedidos.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {combinedOrders.slice(0, 3).map((order: any) => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-black text-sm text-gray-900">{order.storeName}</div>
                        <div className="text-xs text-gray-500 font-medium">
                          {new Date(order.date).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm text-gray-900">{formatCOP(order.totalAmount)}</div>
                        <div className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg mt-1 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {getStatusLabel(order.status)}
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {combinedOrders.length > 3 && (
                    <button 
                      onClick={() => setActiveTab('pedidos')}
                      className="w-full py-3 text-sm font-black text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors text-center"
                    >
                      Ver todos los pedidos
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORIAL TAB */}
        {activeTab === 'pedidos' && (
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <span className="font-black text-xs text-gray-400 uppercase tracking-widest">Historial Completo</span>
              <span className="text-xs font-black text-gray-900">{combinedOrders.length} compras</span>
            </div>
            
            <div className="divide-y divide-gray-50">
              {combinedOrders.length === 0 && (
                <div className="p-10 text-center text-gray-500">
                  <p className="font-bold">Aún no has realizado compras.</p>
                </div>
              )}
              {(showAllHistoryOrders ? combinedOrders : combinedOrders.slice(0, 4)).map((order: any) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-black text-gray-900 text-sm">{order.storeName}</h5>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-500">
                      {order.productsSummary} • {new Date(order.date).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <div className="font-black text-gray-900 sm:text-right mt-2 sm:mt-0 flex items-center justify-between sm:block">
                    <span className="sm:hidden text-xs text-gray-500">Total:</span>
                    {formatCOP(order.totalAmount)}
                  </div>
                </button>
              ))}
            </div>

            {combinedOrders.length > 4 && (
              <div className="flex justify-center p-4 border-t border-gray-50 bg-gray-50/30">
                <button
                  onClick={() => setShowAllHistoryOrders(!showAllHistoryOrders)}
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                >
                  {showAllHistoryOrders ? 'Ver menos' : `Ver más (${combinedOrders.length - 4} más)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* MIS PEDIDOS (NUEVA SECCIÓN) TAB */}
        {activeTab === 'mis-pedidos' && (
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <Package size={22} className="text-[#8200FF]" />
                <h3 className="font-black text-gray-900 text-lg">Pedidos por WhatsApp</h3>
              </div>
              <span className="text-xs font-black text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{localOrders.length} registrados</span>
            </div>

            {localOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Truck size={48} className="mx-auto mb-4 text-gray-300 animate-bounce" />
                <p className="font-black text-gray-800 text-lg">¡Aún no hay pedidos confirmados!</p>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                  Cuando realices compras dirigidas a WhatsApp, te aparecerá el prompt para agregarlas a esta lista.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(showAllLocalOrders ? localOrders : localOrders.slice(0, 3)).map((order) => (
                  <div key={order.id} className="border border-gray-100 bg-gray-50/50 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-800 bg-[#8200FF]/5 text-[#8200FF] px-2.5 py-0.5 rounded-lg">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="font-bold text-gray-900 text-base">{order.storeName}</span>
                        
                        {/* Status Badge */}
                        {order.status === 'pending' && (
                          <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <Truck size={12} className="animate-pulse" /> Pendiente por entregar
                          </span>
                        )}
                        {order.status === 'delivered' && (
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <CheckCircle2 size={12} /> Recibido
                          </span>
                        )}
                        {order.status === 'not_delivered' && (
                          <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <XCircle size={12} /> No recibido
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-700 font-semibold">
                        <span className="text-gray-400 font-bold block text-xs uppercase tracking-wider mb-0.5">Productos</span>
                        {order.products}
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1 max-w-md">
                        <div>
                          <span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider">Fecha Estimada Entrega</span>
                          <span className="text-xs font-black text-gray-800">
                            {new Date(order.deliveryDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider">Total</span>
                          <span className="text-xs font-black text-[#8200FF]">{formatCOP(order.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Status buttons */}
                    {order.status === 'pending' && (
                      <div className="flex flex-row md:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-emerald-600/10"
                        >
                          <Check size={14} /> Sí lo recibí
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'not_delivered')}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-rose-600/10"
                        >
                          <XCircle size={14} /> No lo recibí
                        </button>
                      </div>
                    )}

                    {order.status !== 'pending' && (
                      <div className="text-xs text-gray-400 font-bold flex items-center gap-1">
                        <Info size={14} /> Estado finalizado el {new Date().toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}

                {localOrders.length > 3 && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setShowAllLocalOrders(!showAllLocalOrders)}
                      className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                    >
                      {showAllLocalOrders ? 'Ver menos' : `Ver más (${localOrders.length - 3} más)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}


      </div>

      {/* Modal Detalle Pedido */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedOrderId(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {(() => {
              const order = combinedOrders.find((o: any) => o.id === selectedOrderId)
              if (!order) return null
              
              return (
                <>
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between sticky top-0 z-10">
                    <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pedido en {order.storeName}</div>
                      <div className="font-black text-gray-900 text-sm">#{order.id.slice(0, 8)}</div>
                    </div>
                    <button className="p-2 bg-white rounded-xl text-gray-500 hover:bg-gray-100" onClick={() => setSelectedOrderId(null)}>
                      <XCircle size={20} />
                    </button>
                  </div>
                  
                  <div className="p-5 overflow-y-auto space-y-6">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black uppercase ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {getStatusLabel(order.status)}
                      </span>
                      <span className="text-xs font-bold text-gray-400">
                        {new Date(order.date).toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Productos</div>
                      <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        {order.isLocal ? (
                          <div className="font-bold text-gray-900 text-sm leading-tight">
                            {order.productsSummary}
                          </div>
                        ) : (
                          order.rawOrder.order_items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-start gap-4">
                              <div>
                                <div className="font-bold text-gray-900 text-sm leading-tight">{item.product_name_snapshot}</div>
                                <div className="text-xs text-gray-500 mt-0.5">Cant: {item.quantity}</div>
                                {item.metadata?.selectedColors && item.metadata.selectedColors.length > 0 && (
                                  <div className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-md inline-block mt-1 text-gray-600 font-medium">
                                    Color: {item.metadata.selectedColors.join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="font-black text-gray-900 text-sm">{formatCOP(item.total_price)}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500 font-bold">Total Pagado</div>
                      <div className="text-2xl font-black text-gray-900">{formatCOP(order.totalAmount)}</div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-6 right-6 z-40 flex justify-center pointer-events-none">
        <button
          className="bg-gray-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all pointer-events-auto shadow-indigo-600/10"
          onClick={() => window.location.href = '/'}
        >
          <ShoppingBag size={18} /> Explorar Tiendas
        </button>
      </div>

      {/* FULL-SCREEN WHATSAPP CONFIRMATION POPUP */}
      {showConfirmModal && pendingOrder && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden p-8 text-center space-y-6 transform animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="w-20 h-20 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.722-1.464L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.793 1.453 5.485.002 9.948-4.469 9.95-9.96.002-2.66-1.026-5.161-2.895-7.03C16.53 1.75 14.032.722 11.986.722 6.5.72 2.036 5.19 2.034 10.682c-.001 1.693.456 3.344 1.32 4.79L2.35 21.03l5.808-1.522c.164.09.324.17.49.246z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900 leading-tight">¿Realizaste tu compra?</h3>
              <p className="text-sm text-gray-500 font-semibold leading-relaxed">
                Confirmas que enviaste los detalles de tu pedido a la tienda <strong className="text-gray-800">{pendingOrder.storeName}</strong> a través de WhatsApp.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left text-xs font-semibold text-gray-600 space-y-1">
              <div className="flex justify-between"><span className="text-gray-400">Tienda:</span> <span className="font-bold text-gray-800">{pendingOrder.storeName}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total:</span> <span className="font-bold text-[#8200FF]">{formatCOP(pendingOrder.totalAmount)}</span></div>
              <div className="text-gray-400 pt-1 border-t border-gray-100 mt-1">Productos:</div>
              <div className="font-bold text-gray-700 line-clamp-2">{pendingOrder.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}</div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => handleConfirmPurchase(true)}
                className="flex-1 bg-[#8200FF] hover:bg-[#6c00d4] text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20 text-sm uppercase tracking-wider"
              >
                Sí, Confirmar
              </button>
              <button 
                onClick={() => handleConfirmPurchase(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black py-3.5 rounded-2xl transition-all active:scale-95 text-sm uppercase tracking-wider"
              >
                No enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
