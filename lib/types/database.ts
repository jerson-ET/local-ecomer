/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                   TIPOS DE BASE DE DATOS                                     */
/*                                                                              */
/*   Propósito     : Definir TODOS los tipos para las tablas de Supabase        */
/*   Uso           : Se importan en toda la aplicación para tipado              */
/*   Archivo       : lib/types/database.ts                                      */
/*                                                                              */
/*   ARQUITECTURA:                                                              */
/*   Estos tipos reflejan EXACTAMENTE la estructura de las tablas               */
/*   en Supabase. Cuando cambias el schema SQL, debes actualizar aquí.          */
/*                                                                              */
/*   NOMENCLATURA:                                                              */
/*   - *Row   : Tipo de una fila como viene de la BD (snake_case)               */
/*   - *Insert: Tipo para insertar (sin campos auto-generados)                  */
/*   - *Update: Tipo para actualizar (todos los campos opcionales)              */
/*                                                                              */
/*   IMPORTANTE:                                                                */
/*   En producción, estos tipos se generan automáticamente con:                 */
/*   npx supabase gen types typescript --local > lib/types/database.ts          */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────── */
/*                               ENUMS                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Roles de usuario en la plataforma
 * ───────────────────────────────────
 *
 * @value buyer    - Comprador: puede ver productos y chatear
 * @value seller   - Vendedor: puede crear tiendas y productos
 * @value admin    - Administrador: acceso total al sistema
 */
export type UserRole = 'buyer' | 'seller' | 'reseller' | 'admin' | 'superadmin'

/**
 * Planes de suscripción de las tiendas
 * ──────────────────────────────────────
 *
 * @value free       - Plan gratuito: funcionalidades básicas
 * @value pro        - Plan Pro: más productos, estadísticas
 * @value enterprise - Plan Enterprise: todo ilimitado, soporte
 */
export type StorePlan = 'free' | 'pro' | 'enterprise'

/**
 * Tipos de promoción/publicidad
 * ───────────────────────────────
 *
 * @value featured - Producto destacado en la página principal
 * @value banner   - Banner publicitario
 * @value carousel - Aparece en el carrusel de ofertas
 */
export type PromotionType = 'featured' | 'banner' | 'carousel'

/**
 * Tipos de sala de chat
 * ───────────────────────
 *
 * @value direct  - Chat 1 a 1 entre comprador y vendedor
 * @value group   - Chat grupal (futuro)
 * @value channel - Canal de broadcast (futuro)
 */
export type ChatRoomType = 'direct' | 'group' | 'channel'

/**
 * Tipos de mensaje en el chat
 * ─────────────────────────────
 *
 * @value text    - Mensaje de texto normal
 * @value image   - Imagen adjunta
 * @value file    - Archivo adjunto
 * @value product - Enlace a un producto
 */
export type MessageType = 'text' | 'image' | 'file' | 'product'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                           TIPOS DE USUARIO                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Fila de la tabla 'users'
 * ──────────────────────────
 *
 * Representa un usuario registrado en la plataforma.
 * Esta tabla extiende la tabla auth.users de Supabase.
 */
export interface UserRow {
  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                     CAMPOS DE IDENTIFICACIÓN                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** ID único del usuario (UUID de Supabase Auth)                            */
  id: string

  /** Email del usuario (único, verificado por Supabase Auth)                 */
  email: string

  /** Nombre completo del usuario                                             */
  name: string

  /** URL del avatar (null si no tiene)                                       */
  avatar_url: string | null

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                        CAMPOS DE ROL Y ESTADO                            */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Rol del usuario en la plataforma                                        */
  role: UserRole

  /** Tipo de documento (CC, CE, NIT, PP)                                     */
  document_type: string | null

  /** Número de documento de identidad                                        */
  document_number: string | null

  /** País de residencia                                                      */
  country: string | null

  /** Ciudad de residencia                                                     */
  city: string | null

  /** Número de WhatsApp (con indicativo)                                     */
  whatsapp: string | null

  /** Saldo disponible en la wallet (en centavos)                             */
  wallet_balance: number

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                         CAMPOS DE TIEMPO                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Fecha de registro (ISO string)                                          */
  created_at: string

  /** Última vez que el usuario estuvo activo (null si nunca)                 */
  last_seen: string | null
}

/**
 * Tipo para insertar un nuevo usuario
 * ─────────────────────────────────────
 *
 * Omite campos auto-generados y marca opcionales los que tienen default.
 */
export type UserInsert = {
  id: string /* Requerido: viene de Auth     */
  email: string /* Requerido                     */
  name: string /* Requerido                     */
  avatar_url?: string | null /* Opcional, default: null       */
  role?: UserRole /* Opcional, default: 'buyer'    */
  document_type?: string | null
  document_number?: string | null
  country?: string | null
  city?: string | null
  whatsapp?: string | null
  wallet_balance?: number /* Opcional, default: 0          */
}

/**
 * Tipo para actualizar un usuario
 * ─────────────────────────────────
 *
 * Todos los campos son opcionales porque solo enviamos lo que cambia.
 */
export type UserUpdate = Partial<Omit<UserRow, 'id' | 'created_at'>>

/* ─────────────────────────────────────────────────────────────────────────── */
/*                           TIPOS DE TIENDA                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Fila de la tabla 'stores'
 * ──────────────────────────
 *
 * Representa una tienda creada por un vendedor.
 * Cada vendedor puede tener múltiples tiendas.
 */
export interface StoreRow {
  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                     CAMPOS DE IDENTIFICACIÓN                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** ID único de la tienda (UUID)                                            */
  id: string

  /** ID del usuario dueño de la tienda                                       */
  user_id: string

  /** Nombre de la tienda                                                     */
  name: string

  /** Slug único URL-friendly (ej: 'mi-tienda-123')                           */
  slug: string

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                      CAMPOS DE PRESENTACIÓN                              */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Descripción de la tienda (puede ser null)                               */
  description: string | null

  /** URL del logo de la tienda                                               */
  logo_url: string | null

  /** URL del banner/portada de la tienda                                     */
  banner_url: string | null

  /** Color del tema de la tienda (hexadecimal)                               */
  theme_color: string

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                        CAMPOS DE ESTADO                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Si la tienda está activa y visible                                      */
  is_active: boolean

  /** Plan de suscripción de la tienda                                        */
  plan: StorePlan

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                         CAMPOS DE TIEMPO                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Fecha de creación de la tienda                                          */
  created_at: string

  /** Última fecha de actualización                                           */
  updated_at: string
}

/**
 * Tipo para insertar una nueva tienda
 */
export type StoreInsert = {
  user_id: string /* Requerido: dueño              */
  name: string /* Requerido                     */
  slug: string /* Requerido: único              */
  description?: string | null /* Opcional                      */
  logo_url?: string | null /* Opcional                      */
  banner_url?: string | null /* Opcional                      */
  theme_color?: string /* Opcional, default: #6366f1    */
  is_active?: boolean /* Opcional, default: true       */
  plan?: StorePlan /* Opcional, default: 'free'     */
}

/**
 * Tipo para actualizar una tienda
 */
export type StoreUpdate = Partial<Omit<StoreRow, 'id' | 'user_id' | 'created_at'>>

/* ─────────────────────────────────────────────────────────────────────────── */
/*                          TIPOS DE PRODUCTO                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Estructura de una imagen de producto
 * ──────────────────────────────────────
 *
 * Cada producto puede tener múltiples imágenes,
 * y cada imagen tiene una versión full y thumbnail.
 */
export interface ProductImage {
  /** URL de la imagen en tamaño completo                                     */
  full: string

  /** URL de la imagen en tamaño thumbnail                                    */
  thumbnail: string
}

/**
 * Fila de la tabla 'products'
 * ────────────────────────────
 *
 * Representa un producto en venta dentro de una tienda.
 */
export interface ProductRow {
  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                     CAMPOS DE IDENTIFICACIÓN                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** ID único del producto (UUID)                                            */
  id: string

  /** ID de la tienda a la que pertenece                                      */
  store_id: string

  /** Nombre del producto                                                     */
  name: string

  /** Descripción detallada del producto                                      */
  description: string | null

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                       CAMPOS DE PRECIO                                   */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Precio normal (en la unidad monetaria local, ej: pesos)                 */
  price: number

  /** Precio con descuento (null si no hay descuento)                         */
  discount_price: number | null

  /** Porcentaje de descuento (null si no hay descuento)                      */
  discount_percent: number | null

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                      CAMPOS DE INVENTARIO                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Cantidad disponible en stock                                            */
  stock: number

  /** ID de la categoría (null si no está categorizado)                       */
  category_id: string | null

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                      CAMPOS DE MULTIMEDIA                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Array de imágenes del producto                                          */
  images: ProductImage[]

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                        CAMPOS DE ESTADO                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Si el producto está activo y visible                                    */
  is_active: boolean

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                         CAMPOS DE TIEMPO                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Fecha de creación del producto                                          */
  created_at: string

  /** Última fecha de actualización                                           */
  updated_at: string
}

/**
 * Tipo para insertar un nuevo producto
 */
export type ProductInsert = {
  store_id: string /* Requerido: tienda dueña       */
  name: string /* Requerido                     */
  price: number /* Requerido                     */
  description?: string | null /* Opcional                      */
  discount_price?: number | null /* Opcional                      */
  discount_percent?: number | null /* Opcional                      */
  stock?: number /* Opcional, default: 0          */
  category_id?: string | null /* Opcional                      */
  images?: ProductImage[] /* Opcional, default: []         */
  is_active?: boolean /* Opcional, default: true       */
}

/**
 * Tipo para actualizar un producto
 */
export type ProductUpdate = Partial<Omit<ProductRow, 'id' | 'store_id' | 'created_at'>>

/* ─────────────────────────────────────────────────────────────────────────── */
/*                         TIPOS DE PROMOCIÓN                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Fila de la tabla 'promotions'
 * ───────────────────────────────
 *
 * Representa una promoción/publicidad pagada de un producto.
 */
export interface PromotionRow {
  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                     CAMPOS DE IDENTIFICACIÓN                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** ID único de la promoción (UUID)                                         */
  id: string

  /** ID del producto promocionado                                            */
  product_id: string

  /** ID de la tienda dueña                                                   */
  store_id: string

  /** Tipo de promoción                                                       */
  type: PromotionType

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                       CAMPOS ECONÓMICOS                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Costo por cada click (CPC)                                              */
  cost_per_click: number

  /** Presupuesto total de la promoción                                       */
  budget: number

  /** Cantidad ya gastada del presupuesto                                     */
  spent: number

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                      CAMPOS DE ESTADÍSTICAS                              */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Número de clicks recibidos                                              */
  clicks: number

  /** Número de impresiones (veces mostrado)                                  */
  impressions: number

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                        CAMPOS DE TIEMPO                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Fecha de inicio de la promoción                                         */
  start_date: string

  /** Fecha de fin (null si no tiene fecha límite)                            */
  end_date: string | null

  /** Si la promoción está activa                                             */
  is_active: boolean

  /** Fecha de creación del registro                                          */
  created_at: string
}

/**
 * Tipo para insertar una nueva promoción
 */
export type PromotionInsert = {
  product_id: string /* Requerido                     */
  store_id: string /* Requerido                     */
  type: PromotionType /* Requerido                     */
  budget: number /* Requerido                     */
  cost_per_click?: number /* Opcional, calculado por tipo  */
  end_date?: string | null /* Opcional                      */
}

/**
 * Tipo para actualizar una promoción
 */
export type PromotionUpdate = Partial<Pick<PromotionRow, 'budget' | 'end_date' | 'is_active'>>

/* ─────────────────────────────────────────────────────────────────────────── */
/*                           TIPOS DE CHAT                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Fila de la tabla 'chat_rooms'
 * ───────────────────────────────
 *
 * Representa una sala de chat entre usuarios.
 */
export interface ChatRoomRow {
  /** ID único de la sala (UUID)                                              */
  id: string

  /** Tipo de sala de chat                                                    */
  type: ChatRoomType

  /** ID de la tienda asociada (para chats de soporte)                        */
  store_id: string | null

  /** Fecha de creación de la sala                                            */
  created_at: string

  /** Fecha del último mensaje                                                */
  last_message_at: string | null
}

/**
 * Fila de la tabla 'chat_participants'
 * ──────────────────────────────────────
 *
 * Representa la participación de un usuario en una sala.
 */
export interface ChatParticipantRow {
  /** ID único del registro (UUID)                                            */
  id: string

  /** ID de la sala de chat                                                   */
  room_id: string

  /** ID del usuario participante                                             */
  user_id: string

  /** Fecha en que se unió a la sala                                          */
  joined_at: string

  /** Último mensaje que leyó (para marcar como leído)                        */
  last_read_at: string | null
}

/**
 * Fila de la tabla 'messages'
 * ─────────────────────────────
 *
 * Representa un mensaje enviado en una sala de chat.
 */
export interface MessageRow {
  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                     CAMPOS DE IDENTIFICACIÓN                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** ID único del mensaje (UUID)                                             */
  id: string

  /** ID de la sala donde se envió                                            */
  room_id: string

  /** ID del usuario que envió (null si es sistema)                           */
  sender_id: string | null

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                       CAMPOS DE CONTENIDO                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Contenido del mensaje                                                   */
  content: string

  /** Tipo de mensaje                                                         */
  type: MessageType

  /** URLs de archivos adjuntos (si hay)                                      */
  attachments: string[] | null

  /** ID del mensaje al que responde (null si no es respuesta)                */
  reply_to: string | null

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                        CAMPOS DE ESTADO                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Si el mensaje fue eliminado (soft delete)                               */
  is_deleted: boolean

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                         CAMPOS DE TIEMPO                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /** Fecha de envío del mensaje                                              */
  created_at: string

  /** Fecha de última edición (null si no fue editado)                        */
  edited_at: string | null
}

/**
 * Tipo para insertar un nuevo mensaje
 */
export type MessageInsert = {
  room_id: string /* Requerido                     */
  sender_id: string /* Requerido                     */
  content: string /* Requerido                     */
  type?: MessageType /* Opcional, default: 'text'     */
  attachments?: string[] | null /* Opcional                      */
  reply_to?: string | null /* Opcional                      */
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                       TIPOS EXTENDIDOS (FRONTEND)                            */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Producto con información de tienda incluida
 * ─────────────────────────────────────────────
 *
 * Útil para mostrar productos en listados donde
 * necesitamos mostrar el nombre de la tienda.
 */
export interface ProductWithStore extends ProductRow {
  /** Tienda a la que pertenece el producto                                   */
  store: Pick<StoreRow, 'id' | 'name' | 'slug' | 'logo_url'>
}

/**
 * Tienda con estadísticas
 * ─────────────────────────
 *
 * Útil para el dashboard del vendedor.
 */
export interface StoreWithStats extends StoreRow {
  /** Número total de productos en la tienda                                  */
  product_count: number

  /** Número de productos activos                                             */
  active_product_count: number

  /** Número de vistas totales                                                */
  total_views: number
}

/**
 * Mensaje con información del remitente
 * ───────────────────────────────────────
 *
 * Útil para mostrar mensajes en el chat con
 * el nombre y avatar del remitente.
 */
export interface MessageWithSender extends MessageRow {
  /** Información del usuario que envió el mensaje                            */
  sender: Pick<UserRow, 'id' | 'name' | 'avatar_url'> | null
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                           TIPOS DE PEDIDOS                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Estado del pedido
 * ──────────────────
 */
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'

/**
 * Método de pago
 * ────────────────
 */
export type PaymentMethod = 'credit_card' | 'nequi' | 'daviplata' | 'pse' | 'cash_on_delivery'

/**
 * Fila de la tabla 'orders'
 * ──────────────────────────
 *
 * Representa un pedido realizado por un comprador.
 * Un pedido puede contener múltiples items de UNA o VARIAS tiendas
 * (dependiendo de la lógica de negocio, aquí asumimos multibendedor = múltiples pedidos o un pedido padre).
 * Para simplificar, asumiremos que un Pedido pertenece a UNA Tienda.
 * Si el carrito tiene productos de varias tiendas, se generan múltiples pedidos.
 */
export interface OrderRow {
  /** ID único del pedido (UUID)                                              */
  id: string

  /** ID de la tienda a la que se le compra                                   */
  store_id: string

  /** ID del comprador                                                        */
  buyer_id: string

  /** Nombre del comprador (snapshot)                                         */
  buyer_name?: string | null

  /** Teléfono del comprador (snapshot)                                       */
  buyer_phone?: string | null

  /** Estado actual del pedido                                                */
  status: OrderStatus

  /** Total a pagar (suma de items + envío)                                   */
  total_amount: number

  /** Método de pago seleccionado                                             */
  payment_method: PaymentMethod

  /** Dirección de envío (texto simple o JSON string)                         */
  shipping_address: string

  /** Costo de envío                                                          */
  shipping_cost: number

  /** Notas o instrucciones especiales del comprador                          */
  notes: string | null

  /** Fecha de creación                                                       */
  created_at: string

  /** Fecha de última actualización                                           */
  updated_at: string
}

/**
 * Fila de la tabla 'order_items'
 * ────────────────────────────────
 *
 * Detalle de productos dentro de un pedido.
 */
export interface OrderItemRow {
  /** ID único del item (UUID)                                                */
  id: string

  /** ID del pedido padre                                                     */
  order_id: string

  /** ID del producto comprado                                                */
  product_id: string

  /** Cantidad comprada                                                       */
  quantity: number

  /** Precio unitario al momento de la compra (snapshot)                      */
  unit_price: number

  /** Total de la línea (quantity * unit_price)                               */
  total_price: number

  /** Nombre del producto al momento de comprar (snapshot)                    */
  product_name_snapshot: string

  /** Imagen del producto (snapshot)                                          */
  product_image_snapshot: string | null
}

/**
 * Tipo para insertar un pedido
 */
export type OrderInsert = {
  store_id: string
  buyer_id: string
  total_amount: number
  payment_method: PaymentMethod
  shipping_address: string
  shipping_cost?: number
  status?: OrderStatus
  notes?: string | null
}

/**
 * Tipo para insertar un item de pedido
 */
export type OrderItemInsert = {
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  product_name_snapshot: string
  product_image_snapshot?: string | null
}

/**
 * Pedido completo con sus items y datos del comprador
 * ─────────────────────────────────────────────────────
 */
export interface OrderWithDetails extends OrderRow {
  /** Items del pedido                                                        */
  items: OrderItemRow[]

  /** Datos del comprador (para el panel del vendedor)                        */
  buyer: Pick<UserRow, 'id' | 'name' | 'email' | 'avatar_url'>
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*                           TIPOS DE GANANCIAS                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Categorías de ingresos para el usuario
 * ──────────────────────────────────────
 *
 * @value referral     - Ganancia por link de afiliado
 * @value product_sale - Ganancia por venta directa de producto
 */
export type EarningCategory = 'referral' | 'product_sale'

/**
 * Registro de una ganancia para un usuario
 * ─────────────────────────────────────────
 */
export interface UserEarningRow {
  id: string
  user_id: string
  amount: number
  category: EarningCategory
  description: string
  created_at: string
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FIN DEL ARCHIVO                                   */
/*                                                                              */
/*   CÓMO REGENERAR ESTOS TIPOS AUTOMÁTICAMENTE:                                */
/*   1. Tener Supabase CLI instalado                                            */
/*   2. Tener el proyecto vinculado (supabase link)                             */
/*   3. Ejecutar: npx supabase gen types typescript --local                     */
/*   4. Los tipos se generan basándose en el schema actual                      */
/*                                                                              */
/*   NOTA: Los tipos extendidos (*WithStore, *WithStats) NO se generan          */
/*   automáticamente porque son combinaciones para el frontend.                 */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
