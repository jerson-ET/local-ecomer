'use client'

import { useState, useEffect } from 'react'
import { Users, MapPin, ShoppingBag, Calendar, Loader2, Send, Bell, Tag, Receipt, Megaphone, X, CheckCircle, HeartOff, Eye } from 'lucide-react'
import { formatCOP } from '@/lib/store/marketplace'

interface Subscriber {
  id: string
  name: string
  location: string
  joined_at: string
  order_count: number
  total_spent: number
}

interface SubscribersData {
  stats: {
    totalSubscribers: number
    totalProductsBought: number
  }
  subscribers: Subscriber[]
}

type NotificationType = 'promotion' | 'discount' | 'invoice' | 'notification'

export default function SellerSubscribers({ storeId }: { storeId?: string }) {
  const [data, setData] = useState<SubscribersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Send Notification modal state
  const [showSendModal, setShowSendModal] = useState(false)
  const [modalType, setModalType] = useState<NotificationType>('promotion')
  const [targetSubscriber, setTargetSubscriber] = useState<Subscriber | null>(null) // null means send to all
  const [messageText, setMessageText] = useState('')
  const [sendingNotification, setSendingNotification] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const url = storeId ? `/api/seller/subscribers?storeId=${storeId}` : '/api/seller/subscribers'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error al cargar suscriptores')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [storeId])

  const handleOpenSendModal = (type: NotificationType, subscriber: Subscriber | null = null) => {
    setModalType(type)
    setTargetSubscriber(subscriber)
    setMessageText('')
    setSendSuccess(false)
    setShowSendModal(true)
  }

  const handleSendNotification = async () => {
    if (!messageText.trim()) return
    try {
      setSendingNotification(true)
      const res = await fetch('/api/seller/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: modalType,
          message: messageText.trim(),
          subscriberId: targetSubscriber?.id || null,
          storeId: storeId || null
        })
      })
      if (!res.ok) throw new Error('Error al enviar la notificación')
      setSendSuccess(true)
      setTimeout(() => {
        setShowSendModal(false)
        setSendSuccess(false)
      }, 1500)
    } catch (err: any) {
      alert(err.message || 'Error al enviar')
    } finally {
      setSendingNotification(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-bold">Cargando suscriptores...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-rose-500">
        <p className="font-bold">{error}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors">
          Reintentar
        </button>
      </div>
    )
  }

  const subscribers = data?.subscribers || []
  const stats = data?.stats || { totalSubscribers: 0, totalProductsBought: 0 }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Tus Suscriptores</h2>
          <p className="text-sm text-gray-500 mt-1">Clientes que siguen tu tienda y compran regularmente.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{stats.totalSubscribers || 0}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Suscriptores</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{stats.totalProductsBought || 0}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Productos Comprados</div>
          </div>
        </div>
      </div>

      {/* Action Buttons to Broadcast to all subscribers */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Acciones Masivas (A todos los suscriptores)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={() => handleOpenSendModal('promotion')}
            disabled={subscribers.length === 0}
            className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:hover:bg-indigo-50"
          >
            <Megaphone size={16} /> Promoción
          </button>
          <button 
            onClick={() => handleOpenSendModal('discount')}
            disabled={subscribers.length === 0}
            className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-3 rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:hover:bg-emerald-50"
          >
            <Tag size={16} /> Descuento
          </button>
          <button 
            onClick={() => handleOpenSendModal('invoice')}
            disabled={subscribers.length === 0}
            className="flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-3 rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:hover:bg-amber-50"
          >
            <Receipt size={16} /> Factura
          </button>
          <button 
            onClick={() => handleOpenSendModal('notification')}
            disabled={subscribers.length === 0}
            className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3 rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:hover:bg-rose-50"
          >
            <Bell size={16} /> Notificación
          </button>
        </div>
      </div>

      {/* Subscribers List */}
      <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <h3 className="font-black text-gray-900">Lista de Suscriptores</h3>
          <span className="text-xs font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">
            Suscriptores: {subscribers.length}
          </span>
        </div>

        {subscribers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Users size={48} className="text-gray-200 mb-4" />
            <h4 className="font-black text-gray-900 mb-2">Suscriptores: 0</h4>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed">
              Cuando los compradores se suscriban a tu tienda, aparecerán aquí. Podrás enviarles promociones, descuentos, facturas y notificaciones.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {subscribers.map((sub) => (
              <div key={sub.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-black text-sm text-gray-900">{sub.name}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                        <MapPin size={12} className="text-gray-400" /> {sub.location || 'Colombia'}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                        <Calendar size={12} className="text-gray-400" /> Se unió el {new Date(sub.joined_at).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between bg-gray-50/50 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-xl sm:min-w-[120px]">
                    <div className="text-sm font-black text-gray-900">
                      {formatCOP(sub.total_spent)}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase mt-0 sm:mt-1">
                      {sub.order_count} pedido{sub.order_count !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Individual Action buttons */}
                  <div className="flex gap-1.5 border-l border-gray-100 pl-3">
                    <button 
                      onClick={() => handleOpenSendModal('promotion', sub)}
                      title="Enviar Promoción Individual"
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors"
                    >
                      <Megaphone size={14} />
                    </button>
                    <button 
                      onClick={() => handleOpenSendModal('notification', sub)}
                      title="Enviar Notificación Individual"
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                    >
                      <Bell size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sending Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 relative animate-in zoom-in duration-200">
            <button 
              onClick={() => setShowSendModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>

            {sendSuccess ? (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <CheckCircle size={56} className="text-emerald-500 mb-4 animate-bounce" />
                <h3 className="text-lg font-black text-gray-900">¡Mensaje Enviado!</h3>
                <p className="text-sm text-gray-500 mt-1">El mensaje ha sido enviado correctamente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${
                    modalType === 'promotion' ? 'bg-indigo-50 text-indigo-600' :
                    modalType === 'discount' ? 'bg-emerald-50 text-emerald-600' :
                    modalType === 'invoice' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {modalType === 'promotion' && <Megaphone size={24} />}
                    {modalType === 'discount' && <Tag size={24} />}
                    {modalType === 'invoice' && <Receipt size={24} />}
                    {modalType === 'notification' && <Bell size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      Enviar {
                        modalType === 'promotion' ? 'Promoción' :
                        modalType === 'discount' ? 'Descuento' :
                        modalType === 'invoice' ? 'Factura' : 'Notificación'
                      }
                    </h3>
                    <p className="text-xs text-gray-500">
                      {targetSubscriber ? `Destinatario: ${targetSubscriber.name}` : 'Destinatarios: Todos tus suscriptores'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Mensaje</label>
                  <textarea
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={
                      modalType === 'promotion' ? 'Escribe aquí los detalles de la promoción...' :
                      modalType === 'discount' ? 'Código de descuento o porcentaje de oferta...' :
                      modalType === 'invoice' ? 'Detalles de la factura o cobro pendiente...' : 'Mensaje o actualización importante...'
                    }
                    className="w-full border border-gray-200 rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleSendNotification}
                  disabled={sendingNotification || !messageText.trim()}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all flex justify-center items-center gap-2 disabled:opacity-50 ${
                    modalType === 'promotion' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' :
                    modalType === 'discount' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' :
                    modalType === 'invoice' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  } shadow-lg`}
                >
                  {sendingNotification ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Enviar Mensaje
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
