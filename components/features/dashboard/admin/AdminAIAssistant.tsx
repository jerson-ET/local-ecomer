'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Sparkles, TrendingUp } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

export default function AdminAIAssistant({
  storeId,
  userName = 'Vendedor',
  storeName = 'Mi Tienda'
}: {
  storeId?: string | undefined;
  userName?: string | undefined;
  storeName?: string | undefined;
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `¡Hola, ${userName}! 👋 Soy tu Asistente Estratégico de LocalEcomer. ¿En qué puedo ayudarte con "${storeName}" hoy? Puedo redactar descripciones, analizar tus ventas o darte ideas de marketing.` },
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

    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const resp = await fetch('/api/ai/admin-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeId,
          messages: newMessages,
        }),
      })

      const data = await resp.json()
      if (resp.ok && data.response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
      } else {
        throw new Error(data.error || 'Server error')
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Hubo un inconveniente al conectar con mi núcleo: ${err.message}. ¿Podrías intentar de nuevo?`,
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
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(79,70,229,0.4)] z-[200] hover:scale-105 transition-transform border-4 border-white/20"
      >
        <Sparkles size={28} className="animate-pulse" />
        <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-md">
            PROIA
        </span>
      </button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.9 }}
        className="fixed bottom-6 right-6 w-[400px] max-w-[calc(100vw-48px)] h-[650px] max-h-[85vh] bg-[#F8FAFC] rounded-[40px] overflow-hidden flex flex-col z-[300] shadow-[0_32px_80px_rgba(0,0,0,0.2)] border border-white/50 backdrop-blur-md"
      >
        {/* Header Header Area */}
        <div className="bg-white/80 backdrop-blur-md px-6 py-5 flex items-center justify-between border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="font-black text-[17px] text-gray-900 tracking-tight leading-tight">
                Asistente Estratégico
              </h3>
              <p className="text-[11px] text-indigo-600 font-black uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                IA Activada
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 rounded-2xl bg-gray-100/50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-6 pb-24 flex flex-col gap-6 font-sans scroll-smooth">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col max-w-[90%] ${m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="text-[10px] uppercase font-black text-indigo-400 mb-1 ml-1 tracking-widest">
                  IA ECOMER
                </div>
              )}
              <div
                className={`
                    rounded-[28px] px-5 py-4 text-[14px] leading-[1.5] shadow-sm font-medium
                    ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }
                  `}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mr-auto justify-start max-w-[80%]">
              <div className="bg-white border border-gray-100 rounded-[28px] rounded-tl-none px-6 py-5 shadow-sm flex gap-2">
                <span className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></span>
                <span
                  className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                ></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions Panel */}
        <div className="px-6 py-4 flex gap-2 overflow-x-auto bg-gray-50/50 border-t border-gray-100 shrink-0 thin-scroll">
            <button 
                onClick={() => { setInput('Ayúdame a escribir una descripción para un producto nuevo'); }}
                className="whitespace-nowrap bg-white border border-gray-200 rounded-full px-4 py-2 text-[11px] font-bold text-gray-600 shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all"
            >
                ✍️ Crear descripción
            </button>
            <button 
                onClick={() => { setInput('¿Cómo van mis ventas este mes?'); }}
                className="whitespace-nowrap bg-white border border-gray-200 rounded-full px-4 py-2 text-[11px] font-bold text-gray-600 shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all"
            >
                📊 Analizar ventas
            </button>
            <button 
                onClick={() => { setInput('Dame ideas de marketing para mis productos'); }}
                className="whitespace-nowrap bg-white border border-gray-200 rounded-full px-4 py-2 text-[11px] font-bold text-gray-600 shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all"
            >
                🚀 Plan de marketing
            </button>
        </div>

        {/* Input Box Area */}
        <div className="p-6 bg-white shrink-0 relative z-20">
          <div className="flex items-center gap-3 relative">
            <input
              type="text"
              placeholder="Escribe tu consulta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
              className="w-full bg-gray-50 text-gray-900 placeholder:text-gray-400 rounded-[24px] pl-6 pr-14 py-4 outline-none font-bold text-[14px] border border-gray-100 focus:border-indigo-400 focus:ring-4 ring-indigo-500/5 transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 w-[44px] h-[44px] bg-indigo-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-indigo-200"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
