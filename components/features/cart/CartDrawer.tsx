'use client'

import { useEffect } from 'react'
import { X, ShoppingBag, Trash2, Package, ArrowRight } from 'lucide-react'
import { RealProduct } from '@/components/store-templates/MinimalTemplate'
import { formatCOP } from '@/lib/store/marketplace'

interface CartItem {
  product: RealProduct
  quantity: number
  selectedColors?: string[]
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  onRemove: (productId: string) => void
  onUpdateQuantity: (productId: string, newQty: number) => void
  onCheckout: () => void
  storeName: string
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onRemove,
  onUpdateQuantity,
  onCheckout,
  storeName,
}: CartDrawerProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const total = cart.reduce((sum, item) => sum + (item.product.discount_price || item.product.price) * item.quantity, 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Drawer Container */}
      <div className="relative w-full max-w-[420px] h-full bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.15)] flex flex-col animate-drawer-slide-in">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingBag size={20} />
             </div>
             <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tu Cesta</div>
                <div className="text-[16px] font-black text-gray-900">{storeName}</div>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Cart Contents */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
               <Package size={64} className="mb-4 text-gray-300" />
               <p className="text-gray-900 font-extrabold text-lg">Tu cesta está vacía</p>
               <p className="text-sm text-gray-500 max-w-[200px] mt-1">¡Añade algo increíble de nuestra colección!</p>
            </div>
          ) : (
            <div className="space-y-6">
               {cart.map((item, idx) => (
                 <div key={idx} className="flex gap-4 group">
                    <div className="w-20 h-24 bg-gray-100 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-black/5">
                       <img 
                         src={typeof item.product.images === 'object' && Array.isArray(item.product.images) ? (item.product.images[0] as any).thumbnail : '/placeholder.png'} 
                         className="w-full h-full object-cover" 
                         alt={item.product.name} 
                       />
                    </div>
                    <div className="flex-1 py-1">
                       <div className="flex justify-between items-start mb-1">
                          <h4 className="font-black text-[15px] text-gray-900 leading-tight uppercase">{item.product.name}</h4>
                          <button onClick={() => onRemove(item.product.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                             <Trash2 size={16} />
                          </button>
                       </div>
                       
                       {item.selectedColors && item.selectedColors.length > 0 && (
                          <div className="flex gap-2 mb-3">
                             {item.selectedColors.map((color, cIdx) => (
                               <span key={cIdx} className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-black text-gray-500 border border-gray-200">
                                  {color}
                               </span>
                             ))}
                          </div>
                       )}

                       <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                             <button 
                               onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                               className="w-7 h-7 flex items-center justify-center font-black text-gray-600 hover:text-black"
                             >-</button>
                             <span className="w-8 text-center font-black text-[13px]">{item.quantity}</span>
                             <button 
                               onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                               className="w-7 h-7 flex items-center justify-center font-black text-gray-600 hover:text-black"
                             >+</button>
                          </div>
                          <span className="font-black text-gray-900">{formatCOP(item.product.discount_price || item.product.price)}</span>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
           <div className="flex justify-between items-end mb-2">
              <div>
                 <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal Estimado</div>
                 <div className="text-[24px] font-black text-gray-1000">{formatCOP(total)}</div>
              </div>
              <div className="text-right">
                 <div className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Envío Gratis
                 </div>
              </div>
           </div>
           
           <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={onCheckout}
                disabled={cart.length === 0}
                className="w-full h-14 bg-black text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                 <span>PEDIR AHORA</span>
                 <ArrowRight size={20} />
              </button>
              <button 
                onClick={onClose}
                className="w-full h-14 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                 Continuar viendo productos
              </button>
           </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes drawer-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-drawer-slide-in {
          animation: drawer-slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
