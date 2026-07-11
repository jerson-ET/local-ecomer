'use client'

import { useEffect, useState } from 'react'
import { X, ShoppingBag, Trash2, Package, ArrowRight } from 'lucide-react'
import { RealProduct } from '@/components/store-templates/MinimalTemplate'
import { formatPrice } from '@/lib/store/marketplace'

interface CartItem {
  product: RealProduct
  quantity: number
  selectedColors?: string[]
  ignoreDiscount?: boolean
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  onRemove: (productId: string) => void
  onUpdateQuantity: (productId: string, newQty: number) => void
  onCheckout: () => void
  storeName: string
  couponDiscountPercent: number
  appliedCoupon: string | null
  setAppliedCoupon: (code: string | null) => void
  setCouponDiscountPercent: (percent: number) => void
  storeConfig: any
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onRemove,
  onUpdateQuantity,
  onCheckout,
  storeName,
  couponDiscountPercent,
  appliedCoupon,
  setAppliedCoupon,
  setCouponDiscountPercent,
  storeConfig,
}: CartDrawerProps) {
  
  const [couponCodeInput, setCouponCodeInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null)

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

  const subtotal = cart.reduce((sum, item) => sum + (item.ignoreDiscount ? item.product.price : (item.product.discount_price || item.product.price)) * item.quantity, 0)
  const discountAmount = Math.round((subtotal * couponDiscountPercent) / 100)
  const total = subtotal - discountAmount

  const handleApplyCoupon = () => {
    setCouponError(null)
    setCouponSuccess(null)
    
    if (!couponCodeInput.trim()) return

    const entered = couponCodeInput.trim().toUpperCase()
    const configuredCode = (storeConfig.discountCode || '').trim().toUpperCase()

    if (!configuredCode || entered !== configuredCode) {
      setCouponError('Código de descuento no válido')
      return
    }

    // Verificar vencimiento
    if (storeConfig.discountExpirationDate) {
      const today = new Date().toISOString().split('T')[0]
      if (today > storeConfig.discountExpirationDate) {
        setCouponError('El código de descuento ha expirado')
        return
      }
    }

    // Verificar usos
    if (storeConfig.discountMaxUses !== undefined && storeConfig.discountMaxUses !== null && storeConfig.discountMaxUses !== '') {
      const maxUses = Number(storeConfig.discountMaxUses)
      const currentUses = Number(storeConfig.discountUsedCount || 0)
      if (currentUses >= maxUses) {
        setCouponError('Límite de usos alcanzado para este código')
        return
      }
    }

    // Cupón válido!
    const pct = Number(storeConfig.discountPercentage || 0)
    setAppliedCoupon(entered)
    setCouponDiscountPercent(pct)
    setCouponSuccess(`¡Cupón aplicado! Descuento del ${pct}%`)
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponDiscountPercent(0)
    setCouponCodeInput('')
    setCouponError(null)
    setCouponSuccess(null)
  }

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
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 text-[16px]">Resumen del pedido</span>
            <span className="text-slate-500 font-black text-xs">▲</span>
          </div>
          <div className="text-[16px] font-black text-slate-900">
            {formatPrice(total, cart[0]?.product?.currency)}
          </div>
        </div>

        {/* Cart Contents */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
               <Package size={64} className="mb-4 text-gray-300" />
               <p className="text-gray-900 font-extrabold text-lg">Tu cesta está vacía</p>
               <p className="text-sm text-gray-500 max-w-[200px] mt-1">¡Añade algo increíble de nuestra colección!</p>
            </div>
          ) : (
            <div className="space-y-6">
               {/* Items List */}
               {cart.map((item, idx) => {
                 const mainImg = typeof item.product.images === 'object' && Array.isArray(item.product.images) && item.product.images.length > 0
                   ? (item.product.images[0] as any).thumbnail || (item.product.images[0] as any).full
                   : '/placeholder.png'

                 return (
                   <div key={idx} className="flex gap-4 items-start">
                     {/* Item Image with Quantity Badge */}
                     <div className="relative w-16 h-16 bg-slate-50 rounded-2xl overflow-visible shrink-0 border border-slate-100">
                        <img 
                          src={mainImg} 
                          className="w-full h-full object-cover rounded-2xl" 
                          alt={item.product.name} 
                        />
                        {/* Quantity Badge on the top-right corner */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center font-black text-[11px] shadow-sm border border-white">
                          {item.quantity}
                        </div>
                     </div>

                     {/* Details */}
                     <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[14px] text-slate-800 leading-snug line-clamp-2">{item.product.name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                           {item.selectedColors && item.selectedColors.length > 0 ? item.selectedColors.join(', ') : 'Única'}
                        </p>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                           <button 
                             onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                             className="w-6 h-6 flex items-center justify-center font-bold text-slate-500 hover:text-slate-900 bg-slate-100 rounded-md transition-colors text-xs"
                           >-</button>
                           <span className="w-4 text-center font-bold text-slate-800 text-xs">{item.quantity}</span>
                           <button 
                             onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                             className="w-6 h-6 flex items-center justify-center font-bold text-slate-500 hover:text-slate-900 bg-slate-100 rounded-md transition-colors text-xs"
                           >+</button>
                           <button 
                             onClick={() => onRemove(item.product.id)}
                             className="text-slate-400 hover:text-red-500 font-medium text-[11px] ml-4 transition-colors"
                           >
                             Eliminar
                           </button>
                        </div>
                     </div>

                     {/* Price */}
                     <div className="text-right shrink-0">
                        <span className="font-bold text-[14px] text-slate-900">
                          {formatPrice((item.ignoreDiscount ? item.product.price : (item.product.discount_price || item.product.price)) * item.quantity, item.product.currency)}
                        </span>
                     </div>
                   </div>
                 )
               })}

               <hr className="border-slate-100 my-4" />

               {/* Coupon Area */}
               {appliedCoupon ? (
                 <div className="my-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                   <div>
                     <span className="font-extrabold text-sm text-green-700">{appliedCoupon}</span>
                     <span className="text-xs text-green-600 block">Descuento del {couponDiscountPercent}% aplicado</span>
                   </div>
                   <button 
                     onClick={handleRemoveCoupon}
                     className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded-lg transition-colors border border-red-100"
                   >
                     Remover
                   </button>
                 </div>
               ) : (
                 <div className="space-y-1.5 my-4">
                   <div className="flex gap-2">
                     <input 
                       type="text" 
                       placeholder="Código de descuento" 
                       value={couponCodeInput}
                       onChange={(e) => {
                         setCouponCodeInput(e.target.value.toUpperCase().replace(/\s/g, ''))
                         setCouponError(null)
                       }}
                       className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none bg-slate-50/50 focus:border-purple-300 transition-colors"
                     />
                     <button 
                       onClick={handleApplyCoupon}
                       disabled={!couponCodeInput.trim()}
                       className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                     >
                       Aplicar
                     </button>
                   </div>
                   {couponError && (
                     <p className="text-xs font-semibold text-red-500 px-1">{couponError}</p>
                   )}
                   {couponSuccess && (
                     <p className="text-xs font-semibold text-green-600 px-1">{couponSuccess}</p>
                   )}
                 </div>
               )}

               <hr className="border-slate-100 my-4" />

               {/* Breakdown List */}
               <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                     <span>Subtotal</span>
                     <span className="font-bold text-slate-800">{formatPrice(subtotal, cart[0]?.product?.currency)}</span>
                  </div>
                  {couponDiscountPercent > 0 && (
                     <div className="flex justify-between text-green-600 font-medium">
                        <span>Descuento ({appliedCoupon})</span>
                        <span>-{formatPrice(discountAmount, cart[0]?.product?.currency)} (-{couponDiscountPercent}%)</span>
                     </div>
                  )}
                  <div className="flex justify-between">
                     <span>Envíos</span>
                     <span className="font-black text-slate-900">GRATIS</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="flex items-center gap-1">
                       Impuesto estimado 
                       <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center text-slate-400 font-bold cursor-help" title="IVA incluido">?</span>
                     </span>
                     <span className="font-bold text-slate-800">
                       {formatPrice(0, cart[0]?.product?.currency)}
                     </span>
                  </div>
                  
                  <hr className="border-slate-100 my-4" />
                  
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2">
                     <span className="text-[16px]">Total</span>
                     <span className="text-[18px]">{formatPrice(total, cart[0]?.product?.currency)}</span>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer actions with Purple Button */}
        <div className="p-6 bg-white border-t border-slate-100 space-y-3">
           <button 
             onClick={onCheckout}
             disabled={cart.length === 0}
             className="w-full h-12 bg-[#8200FF] hover:bg-[#6c00d4] text-white rounded-xl font-bold flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
           >
              <span>Pagar ahora</span>
           </button>
           <button 
             onClick={onClose}
             className="w-full h-12 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center justify-center transition-colors text-sm"
           >
              Seguir comprando
           </button>
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
