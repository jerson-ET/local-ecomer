'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  Send, 
  User, 
  Store, 
  MoreVertical, 
  CheckCheck, 
  Clock,
  Package,
  ArrowLeft,
  Smile,
  Paperclip
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ChatRoom {
  id: string
  last_message?: string
  last_message_at?: string
  participant_name?: string
  participant_avatar?: string
  unread_count: number
}

interface Message {
  id: string
  room_id: string
  sender_id: string
  content: string
  type: 'text' | 'image' | 'product'
  created_at: string
}

export default function ChatCenter() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll al final al recibir mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      // Cargar salas (simplificado para MVP)
      const { data: chatRooms } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          created_at,
          last_message_at,
          chat_participants (user_id)
        `)
        .order('last_message_at', { ascending: false })

      // Aquí normalmente mapearíamos para traer nombres de perfiles
      // Por ahora simulamos datos para la UI premium
      setRooms(chatRooms?.map(r => ({
        id: r.id,
        participant_name: 'Cliente Nuevo',
        unread_count: 0,
        last_message: 'Hola, me interesa el producto...',
        last_message_at: r.last_message_at || r.created_at
      })) || [])
      
      setLoading(false)
    }

    initChat()
  }, [])

  // Suscripción Realtime para mensajes
  useEffect(() => {
    if (!selectedRoom) return

    // Cargar mensajes iniciales
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', selectedRoom.id)
        .order('created_at', { ascending: true })
      setMessages(data || [])
    }
    loadMessages()

    const channel = supabase
      .channel(`room:${selectedRoom.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `room_id=eq.${selectedRoom.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedRoom])

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newMessage.trim() || !selectedRoom || !currentUserId) return

    const messageContent = newMessage
    setNewMessage('')

    const { error } = await supabase.from('messages').insert([{
      room_id: selectedRoom.id,
      sender_id: currentUserId,
      content: messageContent,
      type: 'text'
    }])

    if (error) {
      console.error('Error enviando mensaje:', error)
      setNewMessage(messageContent) // Revertir si hay error
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
      {/* Sidebar de Chats */}
      <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-xl font-black text-slate-900 mb-4">Mensajes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar conversación..."
              className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <button 
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-slate-50 border-l-4 ${selectedRoom?.id === room.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-transparent'}`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                  {room.participant_name?.charAt(0)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900 truncate">{room.participant_name}</span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {format(new Date(room.last_message_at!), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{room.last_message}</p>
                </div>
                {room.unread_count > 0 && (
                  <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                    {room.unread_count}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-slate-400" size={24} />
              </div>
              <p className="text-sm text-slate-500 font-medium">No hay mensajes aún</p>
            </div>
          )}
        </div>
      </div>

      {/* Área de Chat */}
      <div className={`flex-1 flex flex-col bg-slate-50/50 ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            {/* Header del Chat */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {selectedRoom.participant_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-none">{selectedRoom.participant_name}</h3>
                  <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">En línea</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                  <Package size={20} />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === currentUserId
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm relative group ${
                      isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}>
                      {msg.type === 'product' ? (
                        <div className="space-y-2">
                          <div className="bg-slate-100 rounded-xl overflow-hidden">
                            <img src="/placeholder-product.jpg" alt="Producto" className="w-full aspect-square object-cover" />
                          </div>
                          <p className="font-bold text-sm">Nombre del Producto</p>
                          <p className="text-xs opacity-80">$ 50.000 COP</p>
                        </div>
                      ) : (
                        <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                      )}
                      <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
                        <span className="text-[9px] font-bold uppercase">
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </span>
                        {isMe && <CheckCheck size={12} />}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensaje */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form 
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-indigo-400 transition-all"
              >
                <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                  <Smile size={20} />
                </button>
                <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                  <Paperclip size={20} />
                </button>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-slate-800"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={`p-3 rounded-xl transition-all ${
                    newMessage.trim() ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-100' : 'bg-slate-200 text-slate-400 scale-95'
                  }`}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <Store className="text-indigo-200" size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Tu Centro de Atención</h3>
            <p className="text-slate-500 max-w-xs text-sm">
              Selecciona una conversación para empezar a vender de forma segura y directa.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
