'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, ShoppingBag, Sparkles } from 'lucide-react'
import { RealProduct, RealStore } from '@/components/store-templates/MinimalTemplate'

// Simple Zustand equivalent mapping directly to the active cart state context
// In a full implementation, this should hook into specific store layout context
type Message = { role: 'user' | 'assistant'; content: string }

export default function AIStoreAssistant({
  store,
  products,
  cart,
  onAddToCart,
  onCheckout,
}: {
  store: RealStore
  products: RealProduct[]
  cart: { product: RealProduct; quantity: number }[]
  onAddToCart: (p: RealProduct) => void
  onCheckout: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `¡Hola! Soy de ${store.name}. ¿Qué estás buscando hoy?` },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMsg = input.trim()
    setInput('')

    // Add user message to UI
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const resp = await fetch('/api/ai/store-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          cartProducts: cart.map((c) => ({
            id: c.product.id,
            name: c.product.name,
            q: c.quantity,
          })),
          messages: newMessages,
        }),
      })

      const data = await resp.json()

      if (resp.ok && data.response) {
        const aiText = data.response

        // INTERCEPTION & CART ADDITION ENGINE
        const cmdRegex = /\[CMD_AGREGAR_CARRITO:\s*([\w-]+)\]/g
        let match

        while ((match = cmdRegex.exec(aiText)) !== null) {
          const productId = match[1]
          const productMatch = products.find((p) => p.id === productId)

          if (productMatch) {
            onAddToCart(productMatch)
          }
        }

        // Clean text output for the user
        const cleanText = aiText.replace(/\[CMD_AGREGAR_CARRITO:\s*[\w-]+\]/g, '').trim()

        setMessages((prev) => [...prev, { role: 'assistant', content: cleanText }])
      } else {
        throw new Error(data.error || 'Server rejected response')
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Tuve un fallo leyendo nuestra base de datos, ¿podrías repetir lo último?',
        },
      ])
    }

    setIsLoading(false)
  }

  // Floating trigger button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl z-50 hover:scale-105 transition-transform border border-white/10"
      >
        <Sparkles size={24} />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center font-bold rounded-full">
            {cart.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-[85vh] sm:h-[600px] bg-[#F2F2F7] sm:rounded-[32px] overflow-hidden flex flex-col z-[100] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-t sm:border border-black/5"
      >
        {/* Head Area */}
        <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-black/5 shrink-0 z-10 shadow-sm relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-[16px] text-[#1C1C1E] tracking-tight leading-none mb-1">
                Cajero Interactivo
              </h3>
              <p className="text-[12px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> En
                línea
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#1C1C1E]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-5 pb-8 flex flex-col gap-4 font-sans tracking-tight">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex max-w-[85%] ${m.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              <div
                className={`
                    rounded-[24px] px-5 py-3.5 text-[15px] leading-[1.4] shadow-sm
                    ${
                      m.role === 'user'
                        ? 'bg-[#007AFF] text-white rounded-tr-sm'
                        : 'bg-white text-[#1C1C1E] rounded-tl-sm border border-black/5'
                    }
                  `}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mr-auto justify-start max-w-[80%]">
              <div className="bg-white border border-black/5 rounded-[24px] rounded-tl-sm px-5 py-4 shadow-sm flex gap-1.5">
                <span className="w-2 h-2 bg-black/20 rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-black/20 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></span>
                <span
                  className="w-2 h-2 bg-black/20 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                ></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Cart Summary Bar inside Chat */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white border-t border-black/5 px-5 py-3 flex items-center justify-between shrink-0"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#007AFF]" />
                <span className="font-extrabold text-[14px] text-[#1C1C1E] border border-black/10 px-2 py-0.5 rounded-full">
                  {cart.reduce((a, c) => a + c.quantity, 0)} items
                </span>
              </div>
              <button
                onClick={onCheckout}
                className="bg-[#007AFF] text-white font-extrabold text-[13px] px-4 py-2 rounded-full shadow-[0_4px_12px_rgba(0,122,255,0.3)] hover:scale-105 transition-transform"
              >
                Pagar{' '}
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(
                  cart.reduce(
                    (a, c) => a + (c.product.discount_price || c.product.price) * c.quantity,
                    0
                  )
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Box */}
        <div className="p-4 bg-white shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] relative z-20 pb-safe">
          <div className="flex items-center gap-2 relative">
            <input
              type="text"
              placeholder="Pregunta o pide algo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
              className="w-full bg-[#F2F2F7] text-[#1C1C1E] placeholder:text-[#8E8E93] rounded-full pl-5 pr-12 py-3.5 outline-none font-medium focus:ring-[3px] ring-[#007AFF]/20 transition-shadow disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 w-[38px] h-[38px] bg-[#007AFF] text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-[#8E8E93] transition-colors"
            >
              <Send size={16} className="-ml-0.5 mt-0.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
