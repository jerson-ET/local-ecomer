import { useState, useEffect } from 'react'
import { Smartphone, RefreshCw, Layers, CalendarClock, Wand2, Trash2, CheckCircle2, XCircle, Plus, Image as ImageIcon, Send } from 'lucide-react'

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
  const [availableProducts, setAvailableProducts] = useState<any[]>([])

  // Simularemos la carga de productos de la tienda para seleccionar
  useEffect(() => {
    // Aquí iría un fetch real a tu API: fetch(`/api/products?storeId=...`)
    // Usaremos productos simulados increíbles para la demostración de la interfaz
    setAvailableProducts([
      { id: '1', name: 'Zapatos Deportivos Neón', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80' },
      { id: '2', name: 'Camiseta de Algodón Oversize', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80' },
      { id: '3', name: 'Gorra Urbana Edición Limitada', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=200&q=80' },
      { id: '4', name: 'Gafas de Sol Vintage', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=200&q=80' },
      { id: '5', name: 'Reloj Inteligente Pro', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&q=80' },
      { id: '6', name: 'Mochila de Viaje Táctica', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&q=80' },
      { id: '7', name: 'Auriculares Inalámbricos', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80' },
      { id: '8', name: 'Pantalón Cargo Negro', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&q=80' },
      { id: '9', name: 'Chaqueta de Cuero', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&q=80' },
      { id: '10', name: 'Botas de Montaña Clásicas', image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=200&q=80' },
    ])
  }, [])

  const reloadIframe = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 500)
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
        delaySeconds = 3600 + (step * 20) // 1 hora después + separación de 20s
      }

      const itemTime = new Date(baseTime.getTime() + delaySeconds * 1000)
      const timeString = new Date(itemTime.getTime() - (itemTime.getTimezoneOffset() * 60000)).toISOString().slice(0, 19)

      return {
        ...item,
        scheduledTime: timeString,
        isActive: true // Garantizar que se reactivan si usamos el botón inteligente
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
           // Optionally clear after immediate publish
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
          {/* iframe container */}
          <div className="relative w-full aspect-square bg-[#f0f2f5] rounded-3xl overflow-hidden shadow-2xl">
            <button 
              onClick={reloadIframe}
              className="absolute top-4 right-4 z-10 p-3 bg-white/50 hover:bg-white rounded-full text-black backdrop-blur transition-all shadow-md"
              title="Recargar conexión"
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            
            {!isRefreshing ? (
               <iframe 
                 src="http://localhost:3015" 
                 className="w-full h-full border-none"
                 title="WhatsApp QR"
               />
            ) : (
               <div className="w-full h-full flex flex-col items-center justify-center bg-[#f0f2f5]">
                 <RefreshCw size={40} className="animate-spin text-emerald-500 mb-4" />
                 <p className="text-gray-600 font-medium">Reconectando con el servidor...</p>
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
              <select 
                className="w-full pl-10 pr-4 py-3 bg-black border border-gray-700 rounded-lg text-white appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                onChange={handleAddProduct}
                defaultValue=""
              >
                <option value="" disabled>Selecciona un producto para agregarlo al estado...</option>
                {availableProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
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
