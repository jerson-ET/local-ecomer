'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Store, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { processLocalSalesQuery } from '@/lib/ai/service'

interface ChatWidgetProps {
  storeId: string
  storeName: string
  themeColor?: string
}

export default function ChatWidget({ storeId, storeName, themeColor = '#6366f1' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>(['Inicio', 'Métodos de pago', 'Envíos'])

  useEffect(() => {
    if (isOpen && !roomId) {
      initChat()
    }
  }, [isOpen, roomId])

  // Registrar trigger global
  useEffect(() => {
    (window as any).triggerChat = async (messageText: string) => {
      setIsOpen(true)
      let activeRoomId = roomId
      let activeUserId = userId

      if (!activeRoomId || !activeUserId) {
        let currentUser = null
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          try {
            const { data } = await supabase.auth.signInAnonymously()
            if (data?.user) currentUser = data.user
          } catch (err) {
            console.error('Anonymous auth failed:', err)
          }
        } else {
          currentUser = user
        }

        if (!currentUser) return
        activeUserId = currentUser.id
        setUserId(currentUser.id)

        // Crear perfil si no existe
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (!profile) {
          await supabase.from('profiles').insert([
            {
              id: currentUser.id,
              email: currentUser.email || `${currentUser.id}@guest.localecomer.com`,
              name: `Visitante Anónimo`,
              role: 'buyer'
            }
          ])
        }

        // Buscar sala
        const { data: room } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('store_id', storeId)
          .maybeSingle()

        activeRoomId = room?.id

        if (!activeRoomId) {
          const { data: newRoom } = await supabase
            .from('chat_rooms')
            .insert([{ store_id: storeId, type: 'direct' }])
            .select()
            .single()
          activeRoomId = newRoom?.id
          
          if (activeRoomId) {
            await supabase.from('chat_participants').insert([
              { room_id: activeRoomId, user_id: currentUser.id }
            ])
          }
        }
        
        if (activeRoomId) {
          setRoomId(activeRoomId)

          // Cargar mensajes
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('room_id', activeRoomId)
            .order('created_at', { ascending: true })
          setMessages(msgs || [])

          // Suscribirse
          supabase
            .channel(`room:${activeRoomId}`)
            .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'messages',
              filter: `room_id=eq.${activeRoomId}`
            }, (payload) => {
              setMessages(prev => [...prev, payload.new])
            })
            .subscribe()
        }
      }

      if (activeRoomId && activeUserId) {
        await supabase.from('messages').insert([{
          room_id: activeRoomId,
          sender_id: activeUserId,
          content: messageText,
          type: 'text'
        }])
      }
    }

    return () => {
      delete (window as any).triggerChat
    }
  }, [roomId, userId, storeId])

  const initChat = async () => {
    let currentUser = null
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      try {
        const { data } = await supabase.auth.signInAnonymously()
        if (data?.user) currentUser = data.user
      } catch (err) {
        console.error('Anonymous auth failed:', err)
      }
    } else {
      currentUser = user
    }

    if (!currentUser) return
    setUserId(currentUser.id)

    // Crear perfil si no existe
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', currentUser.id)
      .maybeSingle()

    if (!profile) {
      await supabase.from('profiles').insert([
        {
          id: currentUser.id,
          email: currentUser.email || `${currentUser.id}@guest.localecomer.com`,
          name: `Visitante Anónimo`,
          role: 'buyer'
        }
      ])
    }

    // Buscar o crear sala
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('store_id', storeId)
      .maybeSingle()

    let activeRoomId = room?.id

    if (!activeRoomId) {
      const { data: newRoom } = await supabase
        .from('chat_rooms')
        .insert([{ store_id: storeId, type: 'direct' }])
        .select()
        .single()
      activeRoomId = newRoom?.id
      
      if (activeRoomId) {
        await supabase.from('chat_participants').insert([
          { room_id: activeRoomId, user_id: currentUser.id }
        ])
      }
    }

    if (!activeRoomId) return
    setRoomId(activeRoomId)

    // Cargar mensajes
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', activeRoomId)
      .order('created_at', { ascending: true })
    setMessages(msgs || [])

    // Suscribirse
    supabase
      .channel(`room:${activeRoomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `room_id=eq.${activeRoomId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()
  }

  const triggerAIAgent = async (buyerMessage: string) => {
    // Retardo para simular escritura y dar naturalidad
    setTimeout(async () => {
      const { data: storeProducts } = await supabase
        .from('products')
        .select('id, name, description, price, stock')
        .eq('store_id', storeId)
        .eq('is_active', true)

      if (!storeProducts || storeProducts.length === 0) return

      // Obtener la tienda para leer la oferta/mensaje especial en vivo configurado por el dueño
      const { data: storeData } = await supabase
        .from('stores')
        .select('banner_url')
        .eq('id', storeId)
        .single()

      let specialOffer = ''
      try {
        if (storeData?.banner_url && typeof storeData.banner_url === 'string' && storeData.banner_url.startsWith('{')) {
          const config = JSON.parse(storeData.banner_url)
          specialOffer = config.specialOffer || config.specialMessage || ''
        }
      } catch {}

      const aiResponse = processLocalSalesQuery(buyerMessage, storeName, storeProducts as any, specialOffer)

      // Guardar mensaje de la IA en la DB
      await supabase.from('messages').insert([{
        room_id: roomId,
        sender_id: null, // null representa al Asistente Virtual IA
        content: aiResponse.message,
        type: 'text'
      }])

      // Actualizar sugeridos
      if (aiResponse.suggested && aiResponse.suggested.length > 0) {
        setSuggestedReplies(aiResponse.suggested)
      } else {
        setSuggestedReplies([])
      }

      // Si la IA activó agregar al carrito
      if (aiResponse.action?.type === 'ADD_TO_CART') {
        const prodId = aiResponse.action.payload
        if (window && (window as any).addToCartFromAI) {
          (window as any).addToCartFromAI(prodId)
        }
      }
    }, 1000)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !roomId || !userId) return

    const content = newMessage
    setNewMessage('')

    await supabase.from('messages').insert([{
      room_id: roomId,
      sender_id: userId,
      content,
      type: 'text'
    }])

    triggerAIAgent(content)
  }

  const handleSendSuggested = async (reply: string) => {
    if (!roomId || !userId) return

    await supabase.from('messages').insert([{
      room_id: roomId,
      sender_id: userId,
      content: reply,
      type: 'text'
    }])

    setSuggestedReplies([])
    triggerAIAgent(reply)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] sm:w-[380px] h-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
          >
            {/* Header */}
            <div 
              className="p-5 flex items-center justify-between text-white"
              style={{ backgroundColor: themeColor }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Store size={20} />
                </div>
                <div>
                  <h4 className="font-black text-sm leading-tight">{storeName}</h4>
                  <div className="flex items-center gap-1.5 opacity-80">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Centro de Ayuda</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Info Banner */}
            <div className="bg-indigo-50 px-4 py-2 flex items-center gap-2 border-b border-indigo-100">
              <ShieldCheck size={14} className="text-indigo-600" />
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-tight">Compra protegida por LocalEcomer</span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/50">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-400 font-medium">Inicia la conversación con la tienda</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === userId
                const isSystemAI = msg.sender_id === null
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm relative ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}>
                      {msg.content}
                      {isSystemAI && (
                        <span className="absolute -bottom-4.5 left-1 text-[8px] font-black text-indigo-500 uppercase tracking-widest block whitespace-nowrap">
                          Asistente Virtual 🤖
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {suggestedReplies.length > 0 && (
              <div className="px-4 py-2 bg-slate-50 flex flex-wrap gap-1.5 border-t border-slate-100 max-h-[100px] overflow-y-auto">
                {suggestedReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendSuggested(reply)}
                    className="text-[9px] font-black tracking-wider uppercase text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/50 rounded-full px-3 py-1.5 transition-all active:scale-95"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-50 disabled:scale-100"
                style={{ backgroundColor: themeColor }}
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white relative group"
        style={{ backgroundColor: themeColor }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
              <MessageCircle size={28} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Tooltip */}
        <span className="absolute right-20 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap uppercase tracking-widest">
          ¿En qué puedo ayudarte?
        </span>
      </motion.button>
    </div>
  )
}
