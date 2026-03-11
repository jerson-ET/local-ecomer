'use client'
import { useState, useEffect, useCallback } from 'react'
import { Smartphone, RefreshCw, Layers, CalendarClock, Wand2, Trash2, CheckCircle2, XCircle, Plus, Image as ImageIcon, Send, Phone, X } from 'lucide-react'
import QRCode from 'react-qr-code'
import { createClient } from '@/lib/supabase/client'

interface ScheduledStatus {
  id: string;
  productId: string;
  productName: string;
  image: string;
  scheduledTime: string;
  isActive: boolean;
}

export default function WhatsappCatalogDashboard({ storeSlug }: { storeSlug: string }) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishingNow, setIsPublishingNow] = useState(false)
  const [scheduledItems, setScheduledItems] = useState<ScheduledStatus[]>([])
  const [availableProducts, setAvailableProducts] = useState<{id: string, name: string, image: string}[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  // QR State
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(true)
  const [qrError, setQrError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Pairing Code State
  const [usePairingCode, setUsePairingCode] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [isRequestingCode, setIsRequestingCode] = useState(false)

  const requestPairingCode = async () => {
    if (!phoneNumber.trim()) return
    setIsRequestingCode(true)
    setQrError(null)
    setPairingCode(null)
    try {
      const formattedPhone = phoneNumber.replace(/\D/g, '')
      const r = await fetch('/api/whatsapp/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      })
      if (r.ok) {
        const data = await r.json()
        if (data.code) setPairingCode(data.code)
        else setQrError(data.error || 'Error al generar código')
      } else {
        setQrError('Error de conexión con el servidor')
      }
    } catch {
      setQrError('No se pudo conectar al servidor')
    }
    setIsRequestingCode(false)
  }

  // ─── Cargar productos reales de la tienda ───
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: store } = await supabase.from('stores').select('*').eq('user_id', user.id).single()
        if (store) {
          const { data: products } = await supabase.from('products').select('*').eq('store_id', store.id).eq('is_active', true)
          if (products) {
            const mapped = products.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              name: p.name as string,
              image: ((p.images as Array<{full?: string, thumbnail?: string}>)?.[0]?.full || (p.images as Array<{full?: string, thumbnail?: string}>)?.[0]?.thumbnail || '') as string
            })).filter((p: {id: string, name: string, image: string}) => p.image !== '')
            setAvailableProducts(mapped)
          }
        }
      } catch (err) {
        console.error('Error fetching products', err)
      } finally {
        setIsLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [])

  // ─── Fetch QR via server-side API proxy ───
  const fetchQR = useCallback(async () => {
    try {
      const r = await fetch('/api/whatsapp/qr')
      if (r.ok) {
        const data = await r.json()
        if (data.connected) {
          setIsConnected(true)
          setQrData(null)
          setQrError(null)
        } else if (data.qr) {
          setQrData(data.qr)
          setIsConnected(false)
          setQrError(null)
        } else {
          setIsConnected(false)
          setQrData(null)
        }
      } else {
        setQrError('Error al obtener QR')
      }
    } catch {
      setQrError('No se pudo conectar al servidor de WhatsApp')
    } finally {
      setQrLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQR()
    const interval = setInterval(fetchQR, 3000)
    return () => clearInterval(interval)
  }, [fetchQR])

  const reloadQR = () => {
    setIsRefreshing(true)
    setQrLoading(true)
    fetchQR().then(() => setIsRefreshing(false))
  }

  const handleAddProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value
    if (!productId) return
    
    if (scheduledItems.length >= 10) {
      alert('El límite es de 10 productos por día.')
      e.target.value = ''
      return
    }

    const product = availableProducts.find(p => p.id === productId)
    if (product) {
      const now = new Date()
      const timeString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19)

      setScheduledItems(prev => [
        ...prev, 
        {
          id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          productId: product.id,
          productName: product.name,
          image: product.image,
          scheduledTime: timeString,
          isActive: true
        }
      ])
    }
    
    e.target.value = '' // reset select
  }

  const removeScheduledItem = (id: string) => {
    setScheduledItems(prev => prev.filter(item => item.id !== id))
  }

  const toggleStatus = (id: string) => {
    setScheduledItems(prev => prev.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item))
  }

  const updateTime = (id: string, newTime: string) => {
    setScheduledItems(prev => prev.map(item => item.id === id ? { ...item, scheduledTime: newTime } : item))
  }

  const applyIntelligentSchedule = () => {
    if (scheduledItems.length === 0) return

    // Base time: NOW + 2 minutes
    const baseTime = new Date()
    baseTime.setMinutes(baseTime.getMinutes() + 2)

    const updated = scheduledItems.map((item, index) => {
      let delaySeconds = 0
      if (index < 5) {
        delaySeconds = index * 20
      } else {
        const step = index - 5
        delaySeconds = 3600 + (step * 20)
      }

      const itemTime = new Date(baseTime.getTime() + delaySeconds * 1000)
      const timeString = new Date(itemTime.getTime() - (itemTime.getTimezoneOffset() * 60000)).toISOString().slice(0, 19)

      return {
        ...item,
        scheduledTime: timeString,
        isActive: true
      }
    })

    setScheduledItems(updated)
  }

  const handleSave = async (publishNow: boolean = false) => {
    if (scheduledItems.length === 0) return
    const activeItems = scheduledItems.filter(i => i.isActive)
    if (activeItems.length === 0) {
      alert("No hay productos activos para publicar.")
      return
    }

    if (publishNow) {
      setIsPublishingNow(true)
    } else {
      setIsSaving(true)
    }

    try {
      const response = await fetch('/api/whatsapp/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeSlug,
          items: activeItems,
          publishNow
        })
      })

      if (response.ok) {
        alert(publishNow ? '¡Publicación enviada al instante! Los estados irán subiendo en breve.' : '¡Catálogo programado con éxito!')
        if (publishNow) {
           setScheduledItems([])
        }
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || 'Ocurrió un error al procesar tu solicitud.'}`)
      }
    } catch (error) {
       console.error(error)
       alert('Error de conexión al guardar el catálogo.')
    } finally {
       setIsSaving(false)
       setIsPublishingNow(false)
    }
  }

  return (
    <div className="w-full h-full p-6 pb-20 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center">
      <div className="w-full max-w-5xl text-center mb-8">
        <h2 className="text-3xl font-black mb-2 flex items-center justify-center gap-3 text-white">
          <Smartphone className="text-emerald-500" size={32} /> WhatsApp Web Sync
        </h2>
        <p className="text-gray-400 text-lg">
          Conecta el celular oficial de tu tienda y automatiza tus estados como un profesional.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 w-full max-w-6xl">
        {/* Columna Izquierda: QR y Sync */}
        <div className="flex flex-col flex-1 w-full gap-8">
          {/* QR Container - Ahora usa react-qr-code en vez de iframe */}
          <div className="relative w-full bg-[#f0f2f5] rounded-3xl overflow-hidden shadow-2xl p-6">
            <button 
              onClick={reloadQR}
              className="absolute top-4 right-4 z-10 p-3 bg-white/50 hover:bg-white rounded-full text-black backdrop-blur transition-all shadow-md"
              title="Recargar conexión"
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            
            {isConnected ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-[#25D366]/20 flex items-center justify-center mb-4">
                  <CheckCircle2 size={40} className="text-[#25D366]" />
                </div>
                <h2 className="text-2xl font-bold text-[#25D366] mb-2">✅ ¡WhatsApp Conectado!</h2>
                <p className="text-gray-600">Ya puedes programar y enviar tus estados.</p>
              </div>
            ) : qrLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RefreshCw size={40} className="animate-spin text-emerald-500 mb-4" />
                <p className="text-gray-600 font-medium">Conectando con el servidor...</p>
              </div>
            ) : qrError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <X size={32} className="text-red-500" />
                </div>
                <p className="text-gray-700 font-bold mb-1">Sin conexión al servidor</p>
                <p className="text-gray-400 text-sm text-center mb-4 max-w-xs">{qrError}</p>
                <button 
                  onClick={reloadQR}
                  className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-400 flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Reintentar
                </button>
              </div>
            ) : usePairingCode ? (
              <div className="flex flex-col items-center justify-center py-6">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Vincular con número</h3>
                {pairingCode ? (
                  <div className="mt-2 text-center w-full max-w-sm">
                    <p className="text-xs text-gray-500 mb-2">Introduce este código en WhatsApp (Dispositivos vinculados {'>'} Vincular con número):</p>
                    <div className="text-4xl font-black tracking-[0.2em] text-[#00a884] bg-white p-6 shadow-lg rounded-2xl border-2 border-emerald-100 mb-4 select-all">
                      {pairingCode}
                    </div>
                    <p className="text-sm text-gray-400 flex items-center justify-center gap-1">
                      <RefreshCw size={12} className="animate-spin" /> Esperando conexión...
                    </p>
                  </div>
                ) : (
                   <div className="w-full max-w-xs mb-4">
                     <p className="text-xs text-gray-500 mb-3 text-left">Ingresa el código país + tu número (ej. 573001234567)</p>
                     <input
                       type="text"
                       value={phoneNumber}
                       onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                       placeholder="Código país + número"
                       className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-md mb-4 outline-none focus:ring-2 focus:ring-emerald-500"
                     />
                     <button
                       onClick={requestPairingCode}
                       disabled={isRequestingCode || !phoneNumber}
                       className="w-full py-3 bg-emerald-500 text-white text-md font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors flex justify-center items-center gap-2 shadow-lg"
                     >
                       {isRequestingCode ? <RefreshCw size={18} className="animate-spin" /> : null}
                       {isRequestingCode ? 'Solicitando...' : 'Generar Código'}
                     </button>
                   </div>
                )}
              </div>
            ) : qrData ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 rounded-full bg-[#00a884]/10 flex items-center justify-center mb-4">
                  <Phone size={28} className="text-[#00a884]" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Escanea este QR</h3>
                <p className="text-gray-500 text-sm mb-5">Abre WhatsApp → Dispositivos vinculados</p>
                <div className="bg-white p-4 rounded-2xl shadow-lg">
                  <QRCode
                    value={qrData}
                    size={256}
                    level="M"
                    style={{ width: '100%', height: 'auto', maxWidth: '256px' }}
                  />
                </div>
                <p className="text-gray-400 text-xs mt-4 flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" /> Esperando escaneo...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <RefreshCw size={40} className="animate-spin text-emerald-500 mb-4" />
                <p className="text-gray-600 font-medium">Generando código...</p>
              </div>
            )}
            
            {!isConnected && (
              <div className="text-center mt-4">
                <button
                  onClick={() => { setUsePairingCode(!usePairingCode); setPairingCode(null) }}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold transition-colors underline"
                >
                  {usePairingCode ? "¿Prefieres vincular escaneando un código QR?" : "¿Tu cámara no funciona? Vincular con número"}
                </button>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="bg-[#1a1a2e]/80 p-6 rounded-3xl border border-gray-800/80 w-full backdrop-blur-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <Layers size={20} className="text-emerald-400" /> Estrategia Inteligente
            </h3>
            <ul className="text-gray-300 space-y-3 list-disc pl-5 text-sm">
              <li>
                <strong>Multitenant V2:</strong> Sesión segura y cifrada para <span className="text-emerald-400 font-mono bg-black/30 px-2 py-0.5 rounded">localecomer/{storeSlug}</span>.
              </li>
              <li>
                <strong>Botón Inteligente Anti-Baneo:</strong> El botón mágico programa tus 10 estados con el formato exacto de la industria: 5 inmediatos y 5 en una hora, siempre con pausas de 20s.
              </li>
              <li>
                <strong>Control Total:</strong> Enciende (verde) o apaga (rojo) publicaciones en un clic sin eliminarlas de tu calendario.
              </li>
            </ul>
          </div>
        </div>

        {/* Columna Derecha: Programador de Publicaciones */}
        <div className="flex-1 w-full min-h-[600px] bg-[#11111a] border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-800">
            <div>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <CalendarClock className="text-indigo-400" />
                Programar Publicación
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Límite de {scheduledItems.length}/10 productos por día
              </p>
            </div>
            
            <button 
              onClick={applyIntelligentSchedule}
              className={`mt-4 sm:mt-0 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]
                 ${scheduledItems.length > 0 ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
              `}
              disabled={scheduledItems.length === 0}
            >
              <Wand2 size={18} className={scheduledItems.length > 0 ? 'animate-pulse' : ''} />
              Botón Inteligente
            </button>
          </div>

          {/* Buscador / Selector de Productos */}
          <div className="mb-6 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
            <label className="block text-sm font-medium text-gray-400 mb-2">Agregar producto de tu inventario:</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Plus size={18} className="text-gray-500" />
              </div>
              {isLoadingProducts ? (
                <div className="flex items-center justify-center p-3 text-emerald-400">
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  <span className="text-sm">Cargando productos...</span>
                </div>
              ) : (
                <select 
                  className="w-full pl-10 pr-4 py-3 bg-black border border-gray-700 rounded-lg text-white appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  onChange={handleAddProduct}
                  defaultValue=""
                  disabled={availableProducts.length === 0}
                >
                  <option value="" disabled>{availableProducts.length === 0 ? 'No tienes productos activos' : 'Selecciona un producto para agregarlo al estado...'}</option>
                  {availableProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Lista de Productos Programados */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <h4 className="text-lg font-bold text-white mb-4">Productos Programados</h4>
            
            {scheduledItems.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center px-4 border-2 border-dashed border-gray-800 rounded-2xl">
                <ImageIcon size={48} className="text-gray-700 mb-3" />
                <p className="text-gray-400 font-medium">No hay publicaciones programadas para hoy.</p>
                <p className="text-gray-600 text-sm mt-1">Selecciona productos del menú arriba para empezar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all
                      ${item.isActive ? 'bg-gray-900/80 border-gray-700' : 'bg-gray-900/40 border-gray-800 opacity-60'}
                    `}
                  >
                    {/* Index & Toggle */}
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                       <button 
                         onClick={() => toggleStatus(item.id)}
                         className="focus:outline-none transition-transform hover:scale-110"
                         title={item.isActive ? "Desactivar esta publicación" : "Reactivar esta publicación"}
                       >
                         {item.isActive ? (
                           <CheckCircle2 size={24} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                         ) : (
                           <XCircle size={24} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                         )}
                       </button>
                    </div>

                    {/* Image */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black border border-gray-700">
                      <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${item.isActive ? 'text-white' : 'text-gray-500 line-through decoration-red-500/50'}`}>
                        {item.productName}
                      </p>
                      
                      <div className="mt-1.5 max-w-[200px]">
                        <input
                          type="datetime-local"
                          step="1"
                          value={item.scheduledTime}
                          onChange={(e) => updateTime(item.id, e.target.value)}
                          className={`w-full text-xs px-2 py-1 rounded bg-black border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors
                            ${item.isActive ? 'text-emerald-400 border-gray-700' : 'text-gray-600 border-gray-800'}
                          `}
                          disabled={!item.isActive}
                        />
                      </div>
                    </div>

                    {/* Delete */}
                    <button 
                      onClick={() => removeScheduledItem(item.id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                      title="Eliminar de la lista"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Acción Global */}
          {scheduledItems.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-800 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => handleSave(false)}
                disabled={isSaving || isPublishingNow}
                className={`flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg rounded-xl transition-all transform flex items-center justify-center gap-2 ${isSaving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] active:scale-95'}`}
              >
                {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <CalendarClock size={20} />}
                {isSaving ? "Guardando..." : "Guardar Catálogo"}
              </button>
              <button 
                onClick={() => handleSave(true)}
                disabled={isSaving || isPublishingNow}
                className={`flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all transform flex items-center justify-center gap-2 ${isPublishingNow ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] active:scale-95'}`}
              >
                {isPublishingNow ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                {isPublishingNow ? "Publicando..." : "¡Publicar Ya!"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
