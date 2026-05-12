'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Store, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

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

  useEffect(() => {
    if (isOpen && !roomId) {
      initChat()
    }
  }, [isOpen])

  const initChat = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Si no está logueado, podríamos pedir login o usar un ID temporal (anónimo)
      // Para este MVP asumimos que está logueado para conectar con el perfil real
      return
    }
    setUserId(user.id)

    // Buscar o crear sala
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('store_id', storeId)
      .single()

    let activeRoomId = room?.id

    if (!activeRoomId) {
      const { data: newRoom } = await supabase
        .from('chat_rooms')
        .insert([{ store_id: storeId, type: 'direct' }])
        .select()
        .single()
      activeRoomId = newRoom.id
      
      await supabase.from('chat_participants').insert([
        { room_id: activeRoomId, user_id: user.id }
      ])
    }

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
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-400 font-medium">Inicia la conversación con la tienda</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === userId
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

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
