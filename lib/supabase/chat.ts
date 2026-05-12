import { createClient } from './client'

export interface Message {
  id: string
  room_id: string
  sender_id: string | null
  content: string
  type: 'text' | 'image' | 'product'
  created_at: string
}

export const chatService = {
  // Crear o buscar una sala entre un comprador y una tienda
  async getOrCreateRoom(storeId: string, buyerId: string) {
    const supabase = createClient()
    
    // Buscar sala existente
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('store_id', storeId)
      .single()

    if (room) return room.id

    // Crear sala nueva
    const { data: newRoom, error: roomError } = await supabase
      .from('chat_rooms')
      .insert([{ store_id: storeId, type: 'direct' }])
      .select()
      .single()

    if (roomError) throw roomError

    // Agregar comprador como participante
    await supabase.from('chat_participants').insert([
      { room_id: newRoom.id, user_id: buyerId }
    ])

    return newRoom.id
  },

  // Enviar mensaje
  async sendMessage(roomId: string, senderId: string, content: string, type: 'text' | 'product' = 'text') {
    const supabase = createClient()
    return await supabase.from('messages').insert([{
      room_id: roomId,
      sender_id: senderId,
      content,
      type
    }])
  }
}
