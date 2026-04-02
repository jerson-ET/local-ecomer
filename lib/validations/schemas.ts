/**
 * ============================================
 * ESQUEMAS DE VALIDACIÓN - ZOD
 * ============================================
 *
 * 🛡️ PROPÓSITO:
 * Zod valida TODOS los datos que entran y salen
 * de la aplicación. Esto garantiza que:
 *
 * - Los datos de usuarios son válidos
 * - Las respuestas de la API son correctas
 * - Los formularios tienen validación robusta
 * - No hay datos corruptos en la base de datos
 *
 * 🏗️ ARQUITECTURA:
 * - Cada entidad tiene su propio esquema
 * - Los esquemas se pueden componer
 * - TypeScript infiere tipos automáticamente
 *
 * ============================================
 */

import { z } from 'zod'

/* ==========================================
 * CONSTANTES DE VALIDACIÓN
 * ==========================================
 * Límites y reglas centralizadas
 */

export const VALIDATION_LIMITS = {
  /** Longitud mínima de contraseña */
  PASSWORD_MIN: 8,

  /** Longitud máxima de contraseña */
  PASSWORD_MAX: 128,

  /** Longitud mínima de nombre */
  NAME_MIN: 2,

  /** Longitud máxima de nombre */
  NAME_MAX: 100,

  /** Longitud máxima de descripción */
  DESCRIPTION_MAX: 5000,

  /** Precio máximo (en centavos) */
  PRICE_MAX: 999999999,

  /** Productos máximos por tienda */
  MAX_PRODUCTS_PER_STORE: 500,

  /** Imágenes máximas por producto */
  MAX_IMAGES_PER_PRODUCT: 5,

  /** Tamaño máximo de imagen (5MB) */
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,

  /** Caracteres máximos en mensaje de chat */
  MAX_MESSAGE_LENGTH: 4000,
} as const

/* ==========================================
 * ESQUEMAS BASE REUTILIZABLES
 * ==========================================
 * Bloques de construcción para otros esquemas
 */

/**
 * Esquema de ID UUID
 * Valida que sea un UUID v4 válido
 */
export const UUIDSchema = z.string().uuid({ message: 'ID inválido' })

/**
 * Esquema de Email
 * Valida formato de email y normaliza a minúsculas
 */
export const EmailSchema = z.string().email({ message: 'Email inválido' }).toLowerCase().trim()

/**
 * Esquema de Contraseña
 * Requiere: mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
 */
export const PasswordSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD_MIN, {
    message: `La contraseña debe tener al menos ${VALIDATION_LIMITS.PASSWORD_MIN} caracteres`,
  })
  .max(VALIDATION_LIMITS.PASSWORD_MAX, {
    message: `La contraseña no puede exceder ${VALIDATION_LIMITS.PASSWORD_MAX} caracteres`,
  })
  .regex(/[A-Z]/, {
    message: 'La contraseña debe contener al menos una mayúscula',
  })
  .regex(/[a-z]/, {
    message: 'La contraseña debe contener al menos una minúscula',
  })
  .regex(/[0-9]/, {
    message: 'La contraseña debe contener al menos un número',
  })

/**
 * Esquema de Nombre
 * Limpia espacios y valida longitud
 */
export const NameSchema = z
  .string()
  .trim()
  .min(VALIDATION_LIMITS.NAME_MIN, {
    message: `El nombre debe tener al menos ${VALIDATION_LIMITS.NAME_MIN} caracteres`,
  })
  .max(VALIDATION_LIMITS.NAME_MAX, {
    message: `El nombre no puede exceder ${VALIDATION_LIMITS.NAME_MAX} caracteres`,
  })

/**
 * Esquema de Slug (URL amigable)
 * Solo permite letras, números y guiones
 */
export const SlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, { message: 'El slug debe tener al menos 3 caracteres' })
  .max(50, { message: 'El slug no puede exceder 50 caracteres' })
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug solo puede contener letras, números y guiones',
  })

/**
 * Esquema de URL
 * Valida que sea una URL válida
 */
export const UrlSchema = z.string().url({ message: 'URL inválida' })

/**
 * Esquema de Precio
 * Precio en la moneda local (entero positivo)
 */
export const PriceSchema = z
  .number()
  .int({ message: 'El precio debe ser un número entero' })
  .min(0, { message: 'El precio no puede ser negativo' })
  .max(VALIDATION_LIMITS.PRICE_MAX, {
    message: 'El precio excede el máximo permitido',
  })

/**
 * Esquema de Porcentaje
 * Número entre 0 y 100
 */
export const PercentageSchema = z
  .number()
  .min(0, { message: 'El porcentaje no puede ser negativo' })
  .max(100, { message: 'El porcentaje no puede exceder 100' })

/* ==========================================
 * ESQUEMAS DE AUTENTICACIÓN
 * ========================================== */

/**
 * Esquema de Login
 */
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, { message: 'La contraseña es requerida' }),
})

/**
 * Esquema de Registro
 */
export const RegisterSchema = z
  .object({
    name: NameSchema,
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string(),
    document_type: z.enum(['CC', 'CE', 'NIT', 'PP'], {
      error: 'Tipo de documento obligatorio',
    }),
    document_number: z.string().min(5, { message: 'El número de documento es demasiado corto' }),
    country: z.string().min(2, { message: 'El país es obligatorio' }),
    city: z.string().min(2, { message: 'La ciudad es obligatoria' }),
    whatsapp: z.string().min(10, { message: 'El WhatsApp debe tener al menos 10 dígitos' }),
    acceptTerms: z.literal(true, {
      message: 'Debes aceptar los términos y condiciones',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

/**
 * Esquema de Recuperar Contraseña
 */
export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
})

/**
 * Esquema de Reset de Contraseña
 */
export const ResetPasswordSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: z.string(),
    token: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

/* ==========================================
 * ESQUEMAS DE USUARIO
 * ========================================== */

/**
 * Roles de usuario permitidos
 */
export const UserRoleSchema = z.enum(['buyer', 'seller', 'reseller', 'admin', 'superadmin'])

/**
 * Esquema de Perfil de Usuario
 */
export const UserProfileSchema = z.object({
  id: UUIDSchema,
  email: EmailSchema,
  name: NameSchema,
  avatar_url: UrlSchema.nullable(),
  role: UserRoleSchema,
  document_type: z.string().nullable(),
  document_number: z.string().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  whatsapp: z.string().nullable(),
  wallet_balance: z.number().min(0),
  created_at: z.string().datetime(),
  last_seen: z.string().datetime().nullable(),
})

/**
 * Esquema para Actualizar Perfil
 */
export const UpdateProfileSchema = z.object({
  name: NameSchema.optional(),
  avatar_url: UrlSchema.nullable().optional(),
})

/* ==========================================
 * ESQUEMAS DE TIENDA
 * ========================================== */

/**
 * Planes de tienda permitidos
 */
export const StorePlanSchema = z.enum(['free', 'pro', 'enterprise'])

/**
 * Esquema base de Tienda
 */
export const StoreSchema = z.object({
  id: UUIDSchema,
  user_id: UUIDSchema,
  name: NameSchema,
  slug: SlugSchema,
  description: z.string().max(VALIDATION_LIMITS.DESCRIPTION_MAX).nullable(),
  logo_url: UrlSchema.nullable(),
  banner_url: UrlSchema.nullable(),
  theme_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color hexadecimal inválido',
  }),
  is_active: z.boolean(),
  plan: StorePlanSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * Esquema para Crear Tienda
 */
export const CreateStoreSchema = z.object({
  name: NameSchema,
  slug: SlugSchema,
  description: z.string().max(VALIDATION_LIMITS.DESCRIPTION_MAX).optional(),
  theme_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#6366f1'),
})

/**
 * Esquema para Actualizar Tienda
 */
export const UpdateStoreSchema = z.object({
  name: NameSchema.optional(),
  description: z.string().max(VALIDATION_LIMITS.DESCRIPTION_MAX).nullable().optional(),
  logo_url: UrlSchema.nullable().optional(),
  banner_url: UrlSchema.nullable().optional(),
  theme_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  is_active: z.boolean().optional(),
})

/* ==========================================
 * ESQUEMAS DE PRODUCTO
 * ========================================== */

/**
 * Esquema de Imagen de Producto
 */
export const ProductImageSchema = z.object({
  full: UrlSchema,
  thumbnail: UrlSchema,
})

/**
 * Esquema base de Producto
 */
export const ProductSchema = z.object({
  id: UUIDSchema,
  store_id: UUIDSchema,
  name: NameSchema,
  description: z.string().max(VALIDATION_LIMITS.DESCRIPTION_MAX).nullable(),
  price: PriceSchema,
  discount_price: PriceSchema.nullable(),
  discount_percent: PercentageSchema.nullable(),
  images: z.array(ProductImageSchema).max(VALIDATION_LIMITS.MAX_IMAGES_PER_PRODUCT),
  category_id: UUIDSchema.nullable(),
  stock: z.number().int().min(0),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * Esquema para Crear Producto
 */
export const CreateProductSchema = z.object({
  name: NameSchema,
  description: z.string().max(VALIDATION_LIMITS.DESCRIPTION_MAX).optional(),
  price: PriceSchema,
  discount_price: PriceSchema.optional(),
  category_id: UUIDSchema.optional(),
  stock: z.number().int().min(0).default(0),
})

/**
 * Esquema para Actualizar Producto
 */
export const UpdateProductSchema = z.object({
  name: NameSchema.optional(),
  description: z.string().max(VALIDATION_LIMITS.DESCRIPTION_MAX).nullable().optional(),
  price: PriceSchema.optional(),
  discount_price: PriceSchema.nullable().optional(),
  category_id: UUIDSchema.nullable().optional(),
  stock: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
})

/* ==========================================
 * ESQUEMAS DE PROMOCIÓN
 * ========================================== */

/**
 * Tipos de promoción permitidos
 */
export const PromotionTypeSchema = z.enum(['featured', 'banner', 'carousel'])

/**
 * Esquema de Promoción
 */
export const PromotionSchema = z.object({
  id: UUIDSchema,
  product_id: UUIDSchema,
  store_id: UUIDSchema,
  type: PromotionTypeSchema,
  cost_per_click: z.number().min(0),
  budget: z.number().min(0),
  spent: z.number().min(0),
  clicks: z.number().int().min(0),
  impressions: z.number().int().min(0),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().nullable(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
})

/**
 * Esquema para Crear Promoción
 */
export const CreatePromotionSchema = z.object({
  product_id: UUIDSchema,
  type: PromotionTypeSchema,
  budget: z.number().min(1000, { message: 'El presupuesto mínimo es $1,000' }),
  end_date: z.string().datetime().optional(),
})

/* ==========================================
 * ESQUEMAS DE CHAT
 * ========================================== */

/**
 * Tipos de sala de chat
 */
export const ChatRoomTypeSchema = z.enum(['direct', 'group', 'channel'])

/**
 * Tipos de mensaje
 */
export const MessageTypeSchema = z.enum(['text', 'image', 'file', 'product'])

/**
 * Esquema de Mensaje
 */
export const MessageSchema = z.object({
  id: UUIDSchema,
  room_id: UUIDSchema,
  sender_id: UUIDSchema.nullable(),
  content: z.string().max(VALIDATION_LIMITS.MAX_MESSAGE_LENGTH),
  type: MessageTypeSchema,
  attachments: z.array(UrlSchema).nullable(),
  reply_to: UUIDSchema.nullable(),
  created_at: z.string().datetime(),
  edited_at: z.string().datetime().nullable(),
  is_deleted: z.boolean(),
})

/**
 * Esquema para Enviar Mensaje
 */
export const SendMessageSchema = z.object({
  room_id: UUIDSchema,
  content: z
    .string()
    .min(1, { message: 'El mensaje no puede estar vacío' })
    .max(VALIDATION_LIMITS.MAX_MESSAGE_LENGTH),
  type: MessageTypeSchema.default('text'),
  reply_to: UUIDSchema.optional(),
})

/* ==========================================
 * ESQUEMAS DE API RESPONSE
 * ========================================== */

/**
 * Esquema de Error de API
 */
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})

/**
 * Esquema de Éxito de API
 */
export function ApiSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  })
}

/**
 * Esquema de Respuesta Paginada
 */
export function PaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    success: z.literal(true),
    data: z.object({
      items: z.array(itemSchema),
      total: z.number().int().min(0),
      page: z.number().int().min(1),
      limit: z.number().int().min(1).max(100),
      hasMore: z.boolean(),
    }),
  })
}

/* ==========================================
 * TIPOS INFERIDOS
 * ==========================================
 * TypeScript infiere los tipos automáticamente
 * desde los esquemas de Zod
 */

// Autenticación
export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>

// Usuario
export type UserRole = z.infer<typeof UserRoleSchema>
export type UserProfile = z.infer<typeof UserProfileSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>

// Tienda
export type StorePlan = z.infer<typeof StorePlanSchema>
export type Store = z.infer<typeof StoreSchema>
export type CreateStoreInput = z.infer<typeof CreateStoreSchema>
export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>

// Producto
export type ProductImage = z.infer<typeof ProductImageSchema>
export type Product = z.infer<typeof ProductSchema>
export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>

// Promoción
export type PromotionType = z.infer<typeof PromotionTypeSchema>
export type Promotion = z.infer<typeof PromotionSchema>
export type CreatePromotionInput = z.infer<typeof CreatePromotionSchema>

// Chat
export type ChatRoomType = z.infer<typeof ChatRoomTypeSchema>
export type MessageType = z.infer<typeof MessageTypeSchema>
export type Message = z.infer<typeof MessageSchema>
export type SendMessageInput = z.infer<typeof SendMessageSchema>
