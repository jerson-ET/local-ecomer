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
  Paperclip,
  Sparkles,
  ChevronDown,
  Plus,
  Mic,
  Key,
  RefreshCw
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
  
  // Gemini Support Chat States
  const [isLoadingAISupport, setIsLoadingAISupport] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [tempApiKey, setTempApiKey] = useState('')
  const [modelSelection, setModelSelection] = useState<'Pro' | 'Flash'>('Pro')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Cargar API Key guardada de forma local al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('ai_gemini_api_key') || ''
      setGeminiApiKey(savedKey)
      setTempApiKey(savedKey)
    }
  }, [])

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

      // Obtener tiendas del vendedor
      const { data: myStores } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)

      const storeIds = myStores?.map(s => s.id) || []
      if (storeIds.length === 0) {
        setLoading(false)
        return
      }

      // Cargar salas asociadas a las tiendas del vendedor
      const { data: chatRooms } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          created_at,
          last_message_at,
          chat_participants (
            user_id,
            profiles:user_id (
              id,
              name,
              avatar_url,
              email
            )
          )
        `)
        .in('store_id', storeIds)
        .order('last_message_at', { ascending: false })

      // Resolver los nombres y perfiles reales
      const roomsWithDetails = await Promise.all((chatRooms || []).map(async (r) => {
        const otherParticipant = r.chat_participants.find((p: any) => p.user_id !== user.id)
        const buyerProfile = otherParticipant?.profiles as any
        const participant_name = buyerProfile?.name || buyerProfile?.email?.split('@')[0] || 'Cliente Anónimo'
        const participant_avatar = buyerProfile?.avatar_url || ''

        // Traer el último mensaje real
        const { data: lastMsgs } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('room_id', r.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const last_message = lastMsgs?.[0]?.content || 'Sin mensajes aún'
        const last_message_at = lastMsgs?.[0]?.created_at || r.last_message_at || r.created_at

        return {
          id: r.id,
          participant_name,
          participant_avatar,
          unread_count: 0,
          last_message,
          last_message_at
        }
      }))

      setRooms(roomsWithDetails)
      setLoading(false)
    }

    initChat()
  }, [])

  // Suscribirse a nuevos mensajes globalmente para actualizar la barra lateral en tiempo real
  useEffect(() => {
    const globalMsgChannel = supabase
      .channel('global_messages_sidebar')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMsg = payload.new as Message
        setRooms(prev => {
          return prev.map(room => {
            if (room.id === newMsg.room_id) {
              return {
                ...room,
                last_message: newMsg.content,
                last_message_at: newMsg.created_at
              }
            }
            return room
          }).sort((a, b) => new Date(b.last_message_at!).getTime() - new Date(a.last_message_at!).getTime())
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(globalMsgChannel)
    }
  }, [])

  // Suscripción Realtime para mensajes del chat seleccionado
  useEffect(() => {
    if (!selectedRoom) return

    if (selectedRoom.id === 'support-ai') {
      const savedHistory = localStorage.getItem('gemini_support_history')
      if (savedHistory) {
        setMessages(JSON.parse(savedHistory))
      } else {
        setMessages([
          {
            id: 'support-init',
            room_id: 'support-ai',
            sender_id: 'assistant',
            content: '¡Hola! 👋 Soy Gemini, tu Asistente de Soporte oficial para LocalEcomer. Pregúntame sobre el catálogo, el POS de caja, los métodos de pago, el cuaderno de contabilidad o cualquier otra duda sobre la plataforma. ¡Te responderé de manera clara y precisa sin alucinaciones!',
            type: 'text',
            created_at: new Date().toISOString()
          }
        ])
      }
      return
    }

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

    if (selectedRoom.id === 'support-ai') {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        room_id: 'support-ai',
        sender_id: currentUserId,
        content: messageContent,
        type: 'text',
        created_at: new Date().toISOString()
      }

      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      localStorage.setItem('gemini_support_history', JSON.stringify(updatedMessages))

      setIsLoadingAISupport(true)

      try {
        const resp = await fetch('/api/ai/platform-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map(m => ({
              role: m.sender_id === 'assistant' ? 'assistant' : 'user',
              content: m.content
            })),
            apiKey: geminiApiKey,
            model: modelSelection
          })
        })

        const data = await resp.json()
        if (resp.ok && data.response) {
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            room_id: 'support-ai',
            sender_id: 'assistant',
            content: data.response,
            type: 'text',
            created_at: new Date().toISOString()
          }
          const finalMessages = [...updatedMessages, aiMessage]
          setMessages(finalMessages)
          localStorage.setItem('gemini_support_history', JSON.stringify(finalMessages))
        } else {
          let errorText = 'Ocurrió un error al procesar tu solicitud.'
          if (data.error === 'missing_key') {
            errorText = '🔑 Falta configurar tu Gemini API Key. Haz clic en el botón "Configurar API Key" en la parte superior derecha de esta pantalla para configurarla.'
          } else if (data.message) {
            errorText = `Error: ${data.message}`
          }
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            room_id: 'support-ai',
            sender_id: 'assistant',
            content: errorText,
            type: 'text',
            created_at: new Date().toISOString()
          }
          const finalMessages = [...updatedMessages, aiMessage]
          setMessages(finalMessages)
          localStorage.setItem('gemini_support_history', JSON.stringify(finalMessages))
        }
      } catch (err: any) {
        console.error('Gemini Support Error:', err)
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          room_id: 'support-ai',
          sender_id: 'assistant',
          content: '❌ No logré conectar con el servidor de asistencia. Por favor verifica tu conexión.',
          type: 'text',
          created_at: new Date().toISOString()
        }
        setMessages([...updatedMessages, aiMessage])
      } finally {
        setIsLoadingAISupport(false)
      }
      return
    }

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
          {/* Gemini AI support room */}
          <button 
            onClick={() => setSelectedRoom({
              id: 'support-ai',
              participant_name: 'Asistente Gemini (Soporte)',
              unread_count: 0
            })}
            className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-slate-50 border-l-4 ${selectedRoom?.id === 'support-ai' ? 'border-[#a855f7] bg-purple-50/30' : 'border-transparent'}`}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <Sparkles size={20} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-purple-900 truncate">Asistente Gemini (Soporte)</span>
                <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full tracking-wider uppercase">Soporte</span>
              </div>
              <p className="text-xs text-slate-500 truncate">¿Cómo funciona la plataforma?</p>
            </div>
          </button>

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
                  className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl animate-pulse"
                >
                  <ArrowLeft size={20} />
                </button>
                {selectedRoom.id === 'support-ai' ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                    <Sparkles size={18} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {selectedRoom.participant_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 leading-none">{selectedRoom.participant_name}</h3>
                  <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">En línea</span>
                </div>
              </div>
              
              {selectedRoom.id === 'support-ai' ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowKeyModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl text-xs font-bold transition-all border border-purple-200"
                  >
                    <Key size={14} />
                    <span>Configurar API Key</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                    <Package size={20} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                    <MoreVertical size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId
                const isSystemAI = msg.sender_id === 'assistant'
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm relative group ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : isSystemAI
                          ? 'bg-purple-900 text-white rounded-tl-none border border-purple-800'
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
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
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <div className={`flex items-center justify-end gap-1 mt-1 ${isMe || isSystemAI ? 'text-white/70' : 'text-slate-400'}`}>
                        <span className="text-[9px] font-bold uppercase">
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </span>
                        {isMe && <CheckCheck size={12} />}
                      </div>
                      {isSystemAI && (
                        <span className="absolute -bottom-4.5 left-1 text-[8px] font-black text-purple-600 uppercase tracking-widest block whitespace-nowrap">
                          Gemini 🤖
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              {isLoadingAISupport && (
                <div className="mr-auto justify-start max-w-[80%]">
                  <div className="bg-purple-950 border border-purple-800 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm flex gap-2 items-center">
                    <span className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensaje */}
            {selectedRoom.id === 'support-ai' ? (
              <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3">
                <form 
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-3 bg-slate-900 rounded-full px-5 py-2.5 shadow-xl transition-all border border-slate-800"
                >
                  {/* Reset button (plus icon) */}
                  <button 
                    type="button" 
                    onClick={() => {
                      if (window.confirm('¿Quieres limpiar el historial de chat con el asistente?')) {
                        localStorage.removeItem('gemini_support_history')
                        setMessages([
                          {
                            id: 'support-init',
                            room_id: 'support-ai',
                            sender_id: 'assistant',
                            content: '¡Hola! 👋 Soy Gemini, tu Asistente de Soporte oficial para LocalEcomer. Pregúntame sobre el catálogo, el POS de caja, los métodos de pago, el cuaderno de contabilidad o cualquier otra duda sobre la plataforma. ¡Te responderé de manera clara y precisa sin alucinaciones!',
                            type: 'text',
                            created_at: new Date().toISOString()
                          }
                        ])
                      }
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Reiniciar chat"
                  >
                    <Plus size={22} />
                  </button>

                  {/* Text input */}
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Preguntarle a Gemini..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-white placeholder-slate-400 outline-none focus:outline-none"
                    disabled={isLoadingAISupport}
                  />

                  {/* Model selection pill */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setModelSelection(prev => prev === 'Pro' ? 'Flash' : 'Pro')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-full text-[10px] font-bold transition-all border border-slate-700 uppercase"
                    >
                      <span>{modelSelection === 'Pro' ? 'Pro 1.5' : 'Flash 1.5'}</span>
                      <ChevronDown size={12} />
                    </button>
                  </div>

                  {/* Microphone icon */}
                  <button 
                    type="button" 
                    onClick={() => {
                      alert('La búsqueda por voz estará disponible próximamente.')
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Búsqueda por voz"
                  >
                    <Mic size={20} />
                  </button>

                  {/* Send button */}
                  <button 
                    type="submit"
                    disabled={!newMessage.trim() || isLoadingAISupport}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      newMessage.trim() && !isLoadingAISupport 
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            ) : (
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
            )}
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

      {/* Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-purple-150 text-purple-700 flex items-center justify-center mb-4">
              <Key size={26} />
            </div>
            <h3 className="text-lg font-black text-slate-950 mb-2">
              Configurar Gemini API Key
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Para usar el asistente inteligente de soporte de LocalEcomer con tu propia API de Google Gemini, ingresa tu clave API personal de Google AI Studio. Esta clave se guardará de forma segura en tu navegador y nunca se enviará fuera de tus peticiones.
            </p>
            <input 
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none mb-6 font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowKeyModal(false)
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('ai_gemini_api_key', tempApiKey.trim())
                  setGeminiApiKey(tempApiKey.trim())
                  setShowKeyModal(false)
                  alert('¡Gemini API Key guardada con éxito!')
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-2xl text-xs transition-colors shadow-lg shadow-purple-200"
              >
                Guardar Clave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
