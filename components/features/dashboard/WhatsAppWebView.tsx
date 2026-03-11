'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Phone, Search, Send, ArrowLeft, Circle, Smile, Users, Clock, Wand2, Trash2, CheckCircle2, XCircle, Upload, ShoppingBag, RefreshCw, Camera, Plus, X, Eye } from 'lucide-react'
import QRCode from 'react-qr-code'

import { createClient } from '@/lib/supabase/client'

// ─── URLs: Usamos rutas relativas (API proxy) para que funcione desde cualquier dispositivo ───
const API_BASE = '' // vacío = relativo al dominio actual

interface ChatInfo { jid: string; name: string; lastMessage: string; lastTimestamp: number; unreadCount: number }
interface Message { id: string; from: string; pushName: string; text: string; timestamp: number; isMe: boolean; type: string; mediaPath?: string }
interface StatusMsg { id: string; from: string; pushName: string; text: string; timestamp: number; isMe: boolean; type: string; mediaPath?: string }
interface WAUserInfo { connected: boolean; user: { id: string; name: string } | null; totalChats: number; totalStatuses: number }
interface ScheduledProduct { id: string; productId: string; productName: string; image: string; isActive: boolean }

export default function WhatsAppWebView() {
  const [view, setView] = useState<'chats' | 'statuses' | 'publish'>('chats')
  const [chats, _setChats] = useState<ChatInfo[]>([])
  void _setChats
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [selectedChatName, setSelectedChatName] = useState('')
  const [messages, _setMessages] = useState<Message[]>([])
  void _setMessages
  const [statuses, _setStatuses] = useState<StatusMsg[]>([])
  void _setStatuses
  const [userInfo, setUserInfo] = useState<WAUserInfo | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)

  // QR State
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(true)
  const [qrError, setQrError] = useState<string | null>(null)

  // Status viewer
  const [viewingStatus, setViewingStatus] = useState<StatusMsg | null>(null)
  const [statusProgress, setStatusProgress] = useState(0)

  // Upload status
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadBase64, setUploadBase64] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Publish state
  const [scheduledProducts, setScheduledProducts] = useState<ScheduledProduct[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<string | null>(null)
  
  // Real DB Data
  const [storeSlug, setStoreSlug] = useState('')
  const [availableProducts, setAvailableProducts] = useState<{id: string, name: string, image: string}[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  useEffect(() => {
    const fetchSupabaseData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: store } = await supabase.from('stores').select('*').eq('user_id', user.id).single()
        if (store) {
          setStoreSlug(store.slug)
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
        console.error('Error fetching Supabase auth/store', err)
      } finally {
        setIsLoadingProducts(false)
      }
    }
    fetchSupabaseData()
  }, [])

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }
  void scrollToBottom

  // ─── Fetch QR via server-side API proxy (funciona desde cualquier dispositivo) ───
  const fetchQR = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/whatsapp/qr`)
      if (r.ok) {
        const data = await r.json()
        if (data.connected) {
          setQrData(null)
          setQrError(null)
          // Si se conectó, forzar fetch de userInfo
          fetchUserInfo()
        } else if (data.qr) {
          setQrData(data.qr)
          setQrError(null)
        } else {
          setQrData(null)
          setQrError(null) // No hay QR aún, esperando
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

  const fetchUserInfo = useCallback(async () => { try { const r = await fetch(`${API_BASE}/api/whatsapp/me`); if (r.ok) setUserInfo(await r.json()) } catch {} }, [])
  const fetchChats = useCallback(async () => { /* chats come from worker directly - not available via proxy yet */ }, [])
  void fetchChats
  const fetchMessages = useCallback(async (_jid: string) => { /* Messages require direct worker connection */ }, [])
  const fetchStatuses = useCallback(async () => { /* Statuses require direct worker connection */ }, [])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return
    setIsSending(true)
    try { const r = await fetch(`${API_BASE}/api/whatsapp/schedule`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', jid: selectedChat, message: newMessage }) }); if (r.ok) { setNewMessage(''); setTimeout(() => fetchMessages(selectedChat), 500) } } catch {}
    setIsSending(false)
  }

  useEffect(() => {
    fetchUserInfo()
    fetchQR()
    
    // Poll QR y estado cada 3 segundos
    pollInterval.current = setInterval(() => {
      fetchUserInfo()
      fetchQR()
    }, 3000)
    
    return () => { if (pollInterval.current) clearInterval(pollInterval.current) }
  }, [fetchUserInfo, fetchQR])

  const formatTime = (ts: number) => new Date(ts * 1000).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (ts: number) => { const d = new Date(ts * 1000); const t = new Date(); if (d.toDateString() === t.toDateString()) return 'Hoy'; const y = new Date(t); y.setDate(y.getDate() - 1); if (d.toDateString() === y.toDateString()) return 'Ayer'; return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' }) }

  // ─── Upload status ───
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setUploadPreview(result)
      setUploadBase64(result.split(',')[1] ?? null)
    }
    reader.readAsDataURL(file)
    setShowUploadModal(true)
  }

  const uploadStatus = async () => {
    if (!uploadBase64 || isUploading) return
    setIsUploading(true)
    try {
      const r = await fetch(`${API_BASE}/api/whatsapp/schedule`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload-status', imageBase64: uploadBase64, caption: uploadCaption })
      })
      if (r.ok) {
        setShowUploadModal(false); setUploadPreview(null); setUploadBase64(null); setUploadCaption('')
      }
    } catch {}
    setIsUploading(false)
  }

  // ─── Publish functions ───
  const addProduct = (pid: string) => { if (scheduledProducts.length >= 10) return; const p = availableProducts.find(x => x.id === pid); if (!p) return; setScheduledProducts(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(36).substring(7)}`, productId: p.id, productName: p.name, image: p.image, isActive: true }]) }
  const removeProduct = (id: string) => setScheduledProducts(prev => prev.filter(p => p.id !== id))
  const toggleProduct = (id: string) => setScheduledProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p))
  const smartSchedule = () => { const rem = 10 - scheduledProducts.length; if (rem <= 0) return; const unused = availableProducts.filter(p => !scheduledProducts.some(sp => sp.productId === p.id)); setScheduledProducts(prev => [...prev, ...unused.slice(0, rem).map(p => ({ id: `${Date.now()}-${Math.random().toString(36).substring(7)}`, productId: p.id, productName: p.name, image: p.image, isActive: true }))]) }

  const publishNow = async () => {
    const active = scheduledProducts.filter(p => p.isActive)
    if (active.length === 0) return
    setIsPublishing(true); setPublishResult(null)
    try {
      const r = await fetch('/api/whatsapp/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeSlug: storeSlug || 'mi-tienda', items: active, publishNow: true }) })
      if (r.ok) { setPublishResult(`✅ ¡${active.length} estados enviados!`); setScheduledProducts([]) }
      else { const d = await r.json(); setPublishResult(`❌ ${d.error}`) }
    } catch { setPublishResult('❌ Error de conexión') }
    setIsPublishing(false)
  }

  // ─── Status viewer ───
  const openStatusViewer = (status: StatusMsg) => {
    setViewingStatus(status); setStatusProgress(0)
    const interval = setInterval(() => { setStatusProgress(prev => { if (prev >= 100) { clearInterval(interval); setTimeout(() => setViewingStatus(null), 300); return 100 }; return prev + 2 }) }, 100)
  }

  // Group statuses by contact
  const groupedStatuses = statuses.reduce((acc, s) => {
    const key = s.isMe ? 'me' : s.from
    if (!acc[key]) acc[key] = { name: s.pushName, statuses: [] }
    acc[key].statuses.push(s)
    return acc
  }, {} as Record<string, { name: string; statuses: StatusMsg[] }>)

  const filteredChats = chats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.jid.includes(searchQuery))
  const isConnected = userInfo?.connected || false

  // ─── Status Viewer Modal ───
  if (viewingStatus) {
    return (
      <div className="w-full h-[calc(100vh-80px)] bg-black flex flex-col relative" onClick={() => setViewingStatus(null)}>
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#ffffff30] z-20">
          <div className="h-full bg-white transition-all duration-100" style={{ width: `${statusProgress}%` }} />
        </div>
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center gap-3 z-20">
          <button onClick={() => setViewingStatus(null)} className="text-white"><ArrowLeft size={24} /></button>
          <div className="w-10 h-10 rounded-full bg-[#00a884]/40 flex items-center justify-center text-white font-bold">{viewingStatus.pushName.charAt(0).toUpperCase()}</div>
          <div><p className="text-white font-medium text-sm">{viewingStatus.pushName}</p><p className="text-white/60 text-xs">{formatTime(viewingStatus.timestamp)}</p></div>
        </div>
        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          {viewingStatus.mediaPath ? (
            <img src={viewingStatus.mediaPath} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
          ) : (
            <p className="text-white text-2xl text-center font-light max-w-md">{viewingStatus.text}</p>
          )}
        </div>
        {viewingStatus.text && viewingStatus.mediaPath && (
          <div className="absolute bottom-8 left-0 right-0 text-center"><p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">{viewingStatus.text}</p></div>
        )}
      </div>
    )
  }

  // ─── Upload Modal ───
  if (showUploadModal && uploadPreview) {
    return (
      <div className="w-full h-[calc(100vh-80px)] bg-[#0b141a] flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#202c33]">
          <button onClick={() => { setShowUploadModal(false); setUploadPreview(null); setUploadBase64(null) }} className="text-[#aebac1] hover:text-white"><X size={24} /></button>
          <h3 className="text-[#e9edef] font-medium">Subir estado</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <img src={uploadPreview} alt="preview" className="max-w-full max-h-[60vh] object-contain rounded-xl" />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-[#202c33]">
          <input type="text" value={uploadCaption} onChange={e => setUploadCaption(e.target.value)} placeholder="Añade un texto..." className="flex-1 bg-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0] px-4 py-2.5 rounded-lg outline-none text-sm" />
          <button onClick={uploadStatus} disabled={isUploading} className="w-12 h-12 bg-[#00a884] rounded-full flex items-center justify-center hover:bg-[#00a884]/80 disabled:opacity-50">
            {isUploading ? <RefreshCw size={20} className="text-white animate-spin" /> : <Send size={20} className="text-white" />}
          </button>
        </div>
      </div>
    )
  }

  // ─── No conectado: Mostrar QR renderizado nativamente ───
  if (!isConnected) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center bg-[#111b21]">
        <div className="text-center p-6 w-full max-w-sm mx-auto">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#00a884]/20 flex items-center justify-center">
            <Phone size={36} className="text-[#00a884]" />
          </div>
          <h2 className="text-xl font-light text-[#e9edef] mb-2">WhatsApp Web</h2>
          <p className="text-[#8696a0] mb-5 text-sm">Conecta tu WhatsApp escaneando el código QR</p>
          
          <div className="w-full max-w-[280px] mx-auto bg-white rounded-2xl p-4 shadow-lg">
            {qrLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw size={32} className="animate-spin text-[#00a884] mb-3" />
                <p className="text-gray-500 text-sm">Cargando conexión...</p>
              </div>
            ) : qrError ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <X size={24} className="text-red-500" />
                </div>
                <p className="text-gray-700 text-sm font-medium mb-1">Sin conexión</p>
                <p className="text-gray-400 text-xs text-center mb-3">{qrError}</p>
                <button 
                  onClick={() => { setQrLoading(true); fetchQR() }}
                  className="px-4 py-2 bg-[#00a884] text-white text-sm rounded-lg hover:bg-[#00a884]/80 flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Reintentar
                </button>
              </div>
            ) : qrData ? (
              <div className="flex flex-col items-center">
                <QRCode
                  value={qrData}
                  size={240}
                  level="M"
                  style={{ width: '100%', height: 'auto', maxWidth: '240px' }}
                />
                <p className="text-gray-400 text-xs mt-3 flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" /> Esperando escaneo...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw size={32} className="animate-spin text-[#00a884] mb-3" />
                <p className="text-gray-500 text-sm">Generando QR...</p>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2 text-left">
            <p className="text-[#8696a0] text-xs">
              <strong className="text-[#e9edef]">1.</strong> Abre WhatsApp en tu teléfono
            </p>
            <p className="text-[#8696a0] text-xs">
              <strong className="text-[#e9edef]">2.</strong> Ve a Ajustes → Dispositivos vinculados
            </p>
            <p className="text-[#8696a0] text-xs">
              <strong className="text-[#e9edef]">3.</strong> Escanea este código QR
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Chat abierto ───
  if (selectedChat) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex flex-col bg-[#0b141a]">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#202c33] border-b border-[#2a3942]">
          <button onClick={() => setSelectedChat(null)} className="p-1 text-[#aebac1] hover:text-white"><ArrowLeft size={22} /></button>
          <div className="w-10 h-10 rounded-full bg-[#6b7b8d] flex items-center justify-center text-white font-bold text-sm">{selectedChatName.charAt(0).toUpperCase()}</div>
          <div className="flex-1 min-w-0"><h3 className="text-[#e9edef] font-medium truncate">{selectedChatName}</h3><p className="text-[#8696a0] text-xs truncate">{selectedChat.split('@')[0]}</p></div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {messages.length === 0 ? (<div className="flex items-center justify-center h-full"><p className="text-[#8696a0] text-sm">No hay mensajes aún.</p></div>) : (
            <>{messages.map((msg, idx) => {
              const showDate = idx === 0 || formatDate(messages[idx - 1]?.timestamp ?? 0) !== formatDate(msg.timestamp)
              return (<div key={msg.id + idx}>{showDate && <div className="flex justify-center my-3"><span className="bg-[#182229] text-[#8696a0] text-xs px-3 py-1 rounded-lg">{formatDate(msg.timestamp)}</span></div>}<div className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} mb-[2px]`}><div className={`max-w-[80%] px-3 py-[6px] rounded-lg shadow-sm ${msg.isMe ? 'bg-[#005c4b]' : 'bg-[#202c33]'} text-[#e9edef]`}>{msg.mediaPath && (msg.type === 'image' || msg.type === 'sticker') && <img src={msg.mediaPath} alt="" className="rounded-md mb-1 max-w-full max-h-[250px] object-cover" loading="lazy" />}<p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p><span className="text-[10px] text-[#ffffff99] float-right ml-2 mt-1">{formatTime(msg.timestamp)}</span></div></div></div>)
            })}<div ref={messagesEndRef} /></>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-[#202c33]">
          <button className="p-2 text-[#8696a0] hover:text-[#e9edef]"><Smile size={24} /></button>
          <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Escribe un mensaje" className="flex-1 bg-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0] px-4 py-[9px] rounded-lg outline-none text-sm" />
          <button onClick={sendMessage} disabled={!newMessage.trim() || isSending} className="p-2 text-[#8696a0] hover:text-[#00a884] disabled:opacity-40"><Send size={22} /></button>
        </div>
      </div>
    )
  }

  // ─── Vista principal ───
  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col bg-[#111b21]">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#202c33]">
        <h2 className="text-lg font-bold text-[#e9edef]">WhatsApp</h2>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#00a884] mr-2" />
          <span className="text-xs text-[#8696a0]">{userInfo?.user?.name || 'Conectado'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#202c33] border-b border-[#2a3942]">
        {(['chats', 'statuses', 'publish'] as const).map(tab => (
          <button key={tab} onClick={() => { setView(tab); if (tab === 'statuses') fetchStatuses() }}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${view === tab ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'}`}>
            <div className="flex items-center justify-center gap-1.5">
              {tab === 'chats' && <><MessageCircle size={16} /> Chats {chats.length > 0 && <span className="bg-[#00a884] text-white text-[10px] px-1.5 rounded-full">{chats.length}</span>}</>}
              {tab === 'statuses' && <><Circle size={16} /> Estados</>}
              {tab === 'publish' && <><Upload size={16} /> Catálogo</>}
            </div>
            {view === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00a884] rounded-t" />}
          </button>
        ))}
      </div>

      {/* Search (only chats) */}
      {view === 'chats' && <div className="px-3 py-2 bg-[#111b21]"><div className="flex items-center bg-[#202c33] rounded-lg px-3 py-[6px]"><Search size={16} className="text-[#8696a0] mr-3" /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar chat..." className="flex-1 bg-transparent text-[#e9edef] placeholder:text-[#8696a0] text-sm outline-none" /></div></div>}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ─── CHATS ─── */}
        {view === 'chats' && (
          filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Users size={48} className="text-[#8696a0] mb-4 opacity-50" />
              <p className="text-[#8696a0] text-sm">{chats.length === 0 ? 'Los chats aparecerán cuando recibas mensajes.' : 'No se encontraron chats.'}</p>
            </div>
          ) : filteredChats.map(chat => (
            <button key={chat.jid} onClick={() => { setSelectedChat(chat.jid); setSelectedChatName(chat.name) }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] transition-colors border-b border-[#222d34]">
              <div className="w-12 h-12 rounded-full bg-[#6b7b8d] flex items-center justify-center text-white font-bold text-lg shrink-0">{chat.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between"><span className="text-[#e9edef] font-medium truncate">{chat.name}</span><span className="text-[#8696a0] text-xs ml-2">{chat.lastTimestamp > 0 ? formatTime(chat.lastTimestamp) : ''}</span></div>
                <div className="flex justify-between mt-[2px]"><span className="text-[#8696a0] text-sm truncate">{chat.lastMessage || 'Sin mensajes'}</span>{chat.unreadCount > 0 && <span className="bg-[#00a884] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center ml-2">{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</span>}</div>
              </div>
            </button>
          ))
        )}

        {/* ─── ESTADOS (como WhatsApp original) ─── */}
        {view === 'statuses' && (
          <div className="p-0">
            {/* Mi Estado */}
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] transition-colors border-b border-[#222d34]">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-[#6b7b8d] flex items-center justify-center text-white font-bold text-xl">
                  {userInfo?.user?.name?.charAt(0).toUpperCase() || 'Y'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-[#00a884] rounded-full flex items-center justify-center border-2 border-[#111b21]">
                  <Plus size={14} className="text-white" />
                </div>
              </div>
              <div className="text-left">
                <p className="text-[#e9edef] font-medium">Mi estado</p>
                <p className="text-[#8696a0] text-xs">Toca para subir una foto a tu estado</p>
              </div>
            </button>

            {/* Mi estado (si tenemos estados propios) */}
            {groupedStatuses['me'] && (
              <div className="border-b border-[#222d34]">
                {groupedStatuses['me'].statuses.map((s, idx) => (
                  <button key={s.id + idx} onClick={() => openStatusViewer(s)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#202c33] transition-colors pl-8">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#00a884] shrink-0">
                      {s.mediaPath ? <img src={s.mediaPath} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#00a884]/20 flex items-center justify-center"><Eye size={16} className="text-[#00a884]" /></div>}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-[#e9edef] text-sm truncate">{s.text}</p>
                      <p className="text-[#8696a0] text-xs">{formatTime(s.timestamp)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recientes */}
            {Object.keys(groupedStatuses).filter(k => k !== 'me').length > 0 && (
              <>
                <p className="text-[#8696a0] text-xs font-medium uppercase tracking-wider px-4 py-3">Recientes</p>
                {Object.entries(groupedStatuses).filter(([k]) => k !== 'me').map(([key, group]) => {
                  const latest = group.statuses[group.statuses.length - 1]
                  if (!latest) return null
                  return (
                    <button key={key} onClick={() => openStatusViewer(latest)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] transition-colors">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-[3px] border-[#00a884] shrink-0 p-[2px]">
                        {latest.mediaPath ? (
                          <img src={latest.mediaPath} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#6b7b8d] flex items-center justify-center text-white font-bold text-lg">{group.name.charAt(0).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[#e9edef] font-medium">{group.name}</p>
                        <p className="text-[#8696a0] text-xs">{formatTime(latest.timestamp)} · {group.statuses.length} estado{group.statuses.length > 1 ? 's' : ''}</p>
                      </div>
                    </button>
                  )
                })}
              </>
            )}

            {/* Vacío */}
            {statuses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Clock size={48} className="text-[#8696a0] mb-4 opacity-40" />
                <p className="text-[#8696a0] text-sm">No hay estados recientes</p>
                <p className="text-[#8696a0] text-xs mt-1 opacity-60">Los estados de tus contactos aparecerán aquí</p>
                <button onClick={() => fileInputRef.current?.click()} className="mt-4 px-6 py-2.5 bg-[#00a884] text-white text-sm font-medium rounded-full flex items-center gap-2 hover:bg-[#00a884]/80">
                  <Camera size={16} /> Subir mi estado
                </button>
              </div>
            )}

            {/* FAB para subir estado */}
            <button onClick={() => fileInputRef.current?.click()} className="fixed bottom-24 right-8 w-14 h-14 bg-[#00a884] rounded-full shadow-lg shadow-[#00a884]/30 flex items-center justify-center hover:bg-[#00a884]/80 z-10">
              <Camera size={22} className="text-white" />
            </button>
          </div>
        )}

        {/* ─── CATÁLOGO / PUBLICAR ─── */}
        {view === 'publish' && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-r from-[#00a884]/20 to-[#005c4b]/20 rounded-2xl p-4 border border-[#00a884]/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center"><ShoppingBag size={20} className="text-white" /></div>
                <div><h3 className="text-[#e9edef] font-bold">Enviar al Catálogo</h3><p className="text-[#8696a0] text-xs">Las imágenes llegarán a tu WhatsApp listas para compartir a tu estado</p></div>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="text-[#00a884] text-xs bg-[#00a884]/10 px-2 py-1 rounded-full">🛡️ Anti-Ban: 20s</span>
                <span className="text-[#8696a0] text-xs bg-[#2a3942] px-2 py-1 rounded-full">{scheduledProducts.length}/10</span>
              </div>
            </div>

            <button onClick={smartSchedule} disabled={scheduledProducts.length >= 10} className="w-full py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-[#6366f1]/20"><Wand2 size={20} /> Botón Inteligente</button>

            <div className="bg-[#202c33] rounded-xl p-3">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center p-2 text-[#00a884]">
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  <span className="text-sm">Cargando productos de tu tienda...</span>
                </div>
              ) : (
                <select onChange={e => { if (e.target.value) { addProduct(e.target.value); e.target.value = '' } }} className="w-full bg-[#2a3942] text-[#e9edef] rounded-lg px-3 py-2.5 text-sm outline-none border border-[#3b4a54] focus:border-[#00a884]" disabled={scheduledProducts.length >= 10 || availableProducts.length === 0}>
                  <option value="">{availableProducts.length === 0 ? 'No tienes productos activos' : '+ Agregar producto...'}</option>
                  {availableProducts.map(p => <option key={p.id} value={p.id} disabled={scheduledProducts.some(sp => sp.productId === p.id)}>{p.name}</option>)}
                </select>
              )}
            </div>

            {scheduledProducts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[#e9edef] font-medium text-sm flex items-center gap-2"><ShoppingBag size={16} className="text-[#00a884]" /> Productos ({scheduledProducts.filter(p => p.isActive).length} activos)</h4>
                {scheduledProducts.map((product, index) => (
                  <div key={product.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${product.isActive ? 'bg-[#202c33]' : 'bg-[#202c33]/50 opacity-60'}`}>
                    <span className="text-[#8696a0] text-xs font-bold w-5 text-center">#{index + 1}</span>
                    <button onClick={() => toggleProduct(product.id)}>{product.isActive ? <CheckCircle2 size={22} className="text-[#00a884]" /> : <XCircle size={22} className="text-red-500" />}</button>
                    <img src={product.image} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                    <span className="text-[#e9edef] text-sm flex-1 truncate">{product.productName}</span>
                    <button onClick={() => removeProduct(product.id)} className="p-1.5 text-[#8696a0] hover:text-red-500 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}

            {publishResult && <div className={`rounded-xl p-3 text-sm font-medium ${publishResult.startsWith('✅') ? 'bg-[#00a884]/20 text-[#00a884]' : 'bg-red-500/20 text-red-400'}`}>{publishResult}</div>}

            {scheduledProducts.length > 0 && (
              <button onClick={publishNow} disabled={isPublishing || scheduledProducts.filter(p => p.isActive).length === 0} className={`w-full py-3.5 bg-[#00a884] text-white font-black rounded-xl flex items-center justify-center gap-2 ${isPublishing ? 'opacity-70' : 'hover:bg-[#00a884]/90 active:scale-[0.98]'} disabled:opacity-40 shadow-lg shadow-[#00a884]/30`}>
                {isPublishing ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                {isPublishing ? 'Enviando...' : `¡Enviar ${scheduledProducts.filter(p => p.isActive).length} a mi WhatsApp!`}
              </button>
            )}

            <div className="bg-[#202c33] rounded-xl p-3"><p className="text-[#8696a0] text-xs"><strong className="text-[#e9edef]">🔗 Tu catálogo:</strong> localecomer.vercel.app/tienda/{storeSlug || '...'}</p></div>
          </div>
        )}
      </div>
    </div>
  )
}
