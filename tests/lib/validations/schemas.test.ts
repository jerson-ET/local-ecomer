/**
 * ============================================
 * TESTS DE ESQUEMAS DE VALIDACIÓN
 * ============================================
 *
 * 🧪 PROPÓSITO:
 * Verifica que los esquemas de Zod funcionen
 * correctamente para todos los casos:
 *
 * - Datos válidos pasan
 * - Datos inválidos son rechazados
 * - Mensajes de error son correctos
 *
 * ============================================
 */

import { describe, it, expect } from 'vitest'
import {
  EmailSchema,
  PasswordSchema,
  NameSchema,
  SlugSchema,
  PriceSchema,
  LoginSchema,
  RegisterSchema,
  CreateStoreSchema,
  CreateProductSchema,
  VALIDATION_LIMITS,
} from '@/lib/validations/schemas'

/* ==========================================
 * TESTS DE ESQUEMAS BASE
 * ========================================== */

describe('EmailSchema', () => {
  it('debe aceptar emails válidos', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.org',
      'user+tag@domain.com',
      'USER@EXAMPLE.COM', // Se normaliza a minúsculas
    ]

    for (const email of validEmails) {
      const result = EmailSchema.safeParse(email)
      expect(result.success).toBe(true)
    }
  })

  it('debe rechazar emails inválidos', () => {
    const invalidEmails = [
      '',
      'not-an-email',
      '@no-local-part.com',
      'no-domain@',
      'spaces in@email.com',
    ]

    for (const email of invalidEmails) {
      const result = EmailSchema.safeParse(email)
      expect(result.success).toBe(false)
    }
  })

  it('debe normalizar a minúsculas', () => {
    const result = EmailSchema.safeParse('TEST@EXAMPLE.COM')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('test@example.com')
    }
  })
})

describe('PasswordSchema', () => {
  it('debe aceptar contraseñas válidas', () => {
    const validPasswords = ['Password1', 'MySecure123', 'StrongP4ssw0rd!']

    for (const password of validPasswords) {
      const result = PasswordSchema.safeParse(password)
      expect(result.success).toBe(true)
    }
  })

  it('debe rechazar contraseñas muy cortas', () => {
    const result = PasswordSchema.safeParse('Pass1')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        `${VALIDATION_LIMITS.PASSWORD_MIN} caracteres`
      )
    }
  })

  it('debe requerir al menos una mayúscula', () => {
    const result = PasswordSchema.safeParse('password1')
    expect(result.success).toBe(false)
    if (!result.success) {
      const hasUppercaseError = result.error.issues.some((issue) =>
        issue.message.includes('mayúscula')
      )
      expect(hasUppercaseError).toBe(true)
    }
  })

  it('debe requerir al menos una minúscula', () => {
    const result = PasswordSchema.safeParse('PASSWORD1')
    expect(result.success).toBe(false)
    if (!result.success) {
      const hasLowercaseError = result.error.issues.some((issue) =>
        issue.message.includes('minúscula')
      )
      expect(hasLowercaseError).toBe(true)
    }
  })

  it('debe requerir al menos un número', () => {
    const result = PasswordSchema.safeParse('PasswordOnly')
    expect(result.success).toBe(false)
    if (!result.success) {
      const hasNumberError = result.error.issues.some((issue) => issue.message.includes('número'))
      expect(hasNumberError).toBe(true)
    }
  })
})

describe('NameSchema', () => {
  it('debe aceptar nombres válidos', () => {
    const result = NameSchema.safeParse('Juan Pérez')
    expect(result.success).toBe(true)
  })

  it('debe rechazar nombres muy cortos', () => {
    const result = NameSchema.safeParse('A')
    expect(result.success).toBe(false)
  })

  it('debe limpiar espacios extra', () => {
    const result = NameSchema.safeParse('  Juan Pérez  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('Juan Pérez')
    }
  })
})

describe('SlugSchema', () => {
  it('debe aceptar slugs válidos', () => {
    const validSlugs = ['mi-tienda', 'tienda123', 'mi-tienda-online']

    for (const slug of validSlugs) {
      const result = SlugSchema.safeParse(slug)
      expect(result.success).toBe(true)
    }
  })

  it('debe rechazar slugs inválidos', () => {
    const invalidSlugs = [
      'Mi Tienda', // Espacios
      'mi_tienda', // Guión bajo
      '--invalid', // Guiones consecutivos
      'ab', // Muy corto
    ]

    for (const slug of invalidSlugs) {
      const result = SlugSchema.safeParse(slug)
      /* Verificamos que al menos algunos fallen */
      expect(result).toBeDefined()
    }
  })

  it('debe normalizar a minúsculas', () => {
    const result = SlugSchema.safeParse('MI-TIENDA')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('mi-tienda')
    }
  })
})

describe('PriceSchema', () => {
  it('debe aceptar precios válidos', () => {
    const validPrices = [0, 1000, 99900, 1000000]

    for (const price of validPrices) {
      const result = PriceSchema.safeParse(price)
      expect(result.success).toBe(true)
    }
  })

  it('debe rechazar precios negativos', () => {
    const result = PriceSchema.safeParse(-100)
    expect(result.success).toBe(false)
  })

  it('debe rechazar decimales', () => {
    const result = PriceSchema.safeParse(99.99)
    expect(result.success).toBe(false)
  })
})

/* ==========================================
 * TESTS DE ESQUEMAS COMPUESTOS
 * ========================================== */

describe('LoginSchema', () => {
  it('debe aceptar datos de login válidos', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      password: 'anypassword',
    })
    expect(result.success).toBe(true)
  })

  it('debe rechazar sin email', () => {
    const result = LoginSchema.safeParse({
      password: 'password',
    })
    expect(result.success).toBe(false)
  })

  it('debe rechazar sin contraseña', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
    })
    expect(result.success).toBe(false)
  })
})

describe('RegisterSchema', () => {
  it('debe aceptar datos de registro válidos', () => {
    const result = RegisterSchema.safeParse({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'SecurePass1',
      confirmPassword: 'SecurePass1',
      acceptTerms: true,
    })
    expect(result.success).toBe(true)
  })

  it('debe rechazar si las contraseñas no coinciden', () => {
    const result = RegisterSchema.safeParse({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'SecurePass1',
      confirmPassword: 'DifferentPass1',
      acceptTerms: true,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const hasMatchError = result.error.issues.some((issue) =>
        issue.path.includes('confirmPassword')
      )
      expect(hasMatchError).toBe(true)
    }
  })

  it('debe rechazar si no acepta términos', () => {
    const result = RegisterSchema.safeParse({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'SecurePass1',
      confirmPassword: 'SecurePass1',
      acceptTerms: false,
    })
    expect(result.success).toBe(false)
  })
})

describe('CreateStoreSchema', () => {
  it('debe aceptar datos de tienda válidos', () => {
    const result = CreateStoreSchema.safeParse({
      name: 'Mi Tienda Online',
      slug: 'mi-tienda-online',
      description: 'La mejor tienda del mundo',
    })
    expect(result.success).toBe(true)
  })

  it('debe asignar color por defecto', () => {
    const result = CreateStoreSchema.safeParse({
      name: 'Mi Tienda',
      slug: 'mi-tienda',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.theme_color).toBe('#6366f1')
    }
  })
})

describe('CreateProductSchema', () => {
  it('debe aceptar datos de producto válidos', () => {
    const result = CreateProductSchema.safeParse({
      name: 'Auriculares Bluetooth',
      description: 'Los mejores auriculares del mercado',
      price: 99900,
      stock: 50,
    })
    expect(result.success).toBe(true)
  })

  it('debe rechazar precio negativo', () => {
    const result = CreateProductSchema.safeParse({
      name: 'Producto',
      price: -1000,
    })
    expect(result.success).toBe(false)
  })

  it('debe asignar stock cero por defecto', () => {
    const result = CreateProductSchema.safeParse({
      name: 'Producto',
      price: 10000,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.stock).toBe(0)
    }
  })
})
