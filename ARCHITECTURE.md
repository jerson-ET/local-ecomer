# 🏛️ Arquitectura Enterprise - LocalEcomer

> **Documento de Arquitectura Técnica**  
> Versión: 1.0.0  
> Última actualización: Febrero 2026

---

## 📋 Índice

1. [Visión General](#1-visión-general)
2. [Principios de Diseño](#2-principios-de-diseño)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Sistema de Tipos](#5-sistema-de-tipos)
6. [Manejo de Errores](#6-manejo-de-errores)
7. [Sistema de Logging](#7-sistema-de-logging)
8. [Testing](#8-testing)
9. [Control de Calidad](#9-control-de-calidad)
10. [Seguridad](#10-seguridad)
11. [Monitoreo](#11-monitoreo)
12. [Escalabilidad](#12-escalabilidad)

---

## 1. Visión General

### 🎯 Objetivo

LocalEcomer está diseñado para ser una plataforma **indestructible** que pueda:

- ✅ Funcionar sin fallos durante **20+ años**
- ✅ Manejar **millones de usuarios** simultáneos
- ✅ Recuperarse automáticamente de errores
- ✅ Escalar horizontalmente sin límites
- ✅ Mantener **99.99% de disponibilidad**

### 🏗️ Filosofía de Construcción

```
┌─────────────────────────────────────────────────────────────────┐
│                    🔒 CAPA DE SEGURIDAD                         │
├─────────────────────────────────────────────────────────────────┤
│                    📊 CAPA DE MONITOREO                         │
├─────────────────────────────────────────────────────────────────┤
│              ⚡ CAPA DE RENDIMIENTO (Caché, CDN)                │
├─────────────────────────────────────────────────────────────────┤
│                  🧪 CAPA DE TESTING                             │
├─────────────────────────────────────────────────────────────────┤
│              📐 CAPA DE VALIDACIÓN (Zod Schemas)                │
├─────────────────────────────────────────────────────────────────┤
│                 🔷 CAPA DE TIPOS (TypeScript)                   │
├─────────────────────────────────────────────────────────────────┤
│              💾 CAPA DE DATOS (Supabase + R2)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Principios de Diseño

### 2.1 SOLID

| Principio                 | Aplicación                                     |
| ------------------------- | ---------------------------------------------- |
| **S**ingle Responsibility | Cada módulo hace UNA sola cosa                 |
| **O**pen/Closed           | Extensible sin modificar código existente      |
| **L**iskov Substitution   | Las interfaces son intercambiables             |
| **I**nterface Segregation | Interfaces pequeñas y específicas              |
| **D**ependency Inversion  | Depender de abstracciones, no implementaciones |

### 2.2 Fail-Safe Design

```typescript
/**
 * Toda operación crítica sigue este patrón:
 * 1. Validar entrada
 * 2. Ejecutar operación
 * 3. Manejar error gracefully
 * 4. Logging estructurado
 * 5. Retornar resultado tipado
 */
async function safeOperation<T>(operation: () => Promise<T>, context: string): Promise<Result<T>> {
  try {
    const result = await operation()
    logger.info(`${context}: Operación exitosa`)
    return { success: true, data: result }
  } catch (error) {
    logger.error(`${context}: Error`, error)
    return { success: false, error: toAppError(error) }
  }
}
```

### 2.3 Defense in Depth

Múltiples capas de protección:

1. **Validación de entrada** (Zod)
2. **Tipos estáticos** (TypeScript)
3. **Tests automatizados** (Vitest)
4. **Análisis estático** (ESLint)
5. **Git hooks** (Husky)
6. **Row Level Security** (Supabase)
7. **Rate limiting** (API)
8. **Monitoreo** (Logs)

---

## 3. Stack Tecnológico

### 3.1 Core

| Tecnología | Versión | Propósito            |
| ---------- | ------- | -------------------- |
| Next.js    | 16.x    | Framework full-stack |
| React      | 19.x    | UI library           |
| TypeScript | 5.x     | Type safety          |
| Node.js    | 20+     | Runtime              |
| pnpm       | 9+      | Package manager      |

### 3.2 Backend

| Tecnología     | Propósito                       |
| -------------- | ------------------------------- |
| Supabase       | Base de datos + Auth + Realtime |
| Cloudflare R2  | Almacenamiento de imágenes      |
| Edge Functions | Serverless computing            |

### 3.3 Calidad

| Herramienta | Propósito              |
| ----------- | ---------------------- |
| Vitest      | Testing framework      |
| ESLint      | Linting                |
| Prettier    | Formatting             |
| Husky       | Git hooks              |
| Commitlint  | Commits convencionales |

---

## 4. Estructura del Proyecto

```
local-ecomer/
│
├── 📁 app/                    # Next.js App Router
│   ├── (auth)/               # Rutas de autenticación
│   ├── (dashboard)/          # Panel de control
│   ├── (marketing)/          # Páginas públicas
│   ├── api/                  # API Routes
│   ├── globals.css           # Estilos globales
│   └── layout.tsx            # Layout raíz
│
├── 📁 components/             # Componentes React
│   ├── ui/                   # Componentes base (Button, Input, etc.)
│   ├── layout/               # Layout components (Header, Footer)
│   ├── features/             # Feature-specific components
│   └── shared/               # Shared components
│
├── 📁 lib/                    # Lógica de negocio
│   ├── errors/               # Sistema de errores
│   ├── logger/               # Sistema de logging
│   ├── validations/          # Esquemas Zod
│   ├── supabase/             # Cliente de Supabase
│   ├── r2/                   # Cliente de R2
│   ├── images/               # Procesamiento de imágenes
│   └── types/                # Tipos TypeScript
│
├── 📁 hooks/                  # Custom React hooks
│
├── 📁 stores/                 # Estado global (Zustand)
│
├── 📁 tests/                  # Tests
│   ├── setup.ts              # Setup global
│   └── lib/                  # Tests de lib
│
├── 📁 supabase/               # Configuración de Supabase
│   └── schema.sql            # Schema de base de datos
│
├── 📁 public/                 # Assets estáticos
│
└── 📁 .husky/                 # Git hooks
```

---

## 5. Sistema de Tipos

### 5.1 TypeScript Estricto

Configuración ultra-estricta en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 5.2 Validación con Zod

Todo dato que entra o sale se valida:

```typescript
// Definir schema
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
})

// Uso
const result = UserSchema.safeParse(data)
if (!result.success) {
  throw new ValidationError('Datos inválidos', result.error.issues)
}
```

### 5.3 Tipos Inferidos

Los tipos se infieren automáticamente de los schemas:

```typescript
// El tipo se infiere del schema
type User = z.infer<typeof UserSchema>
// Resultado: { email: string; name: string }
```

---

## 6. Manejo de Errores

### 6.1 Clases de Error

```typescript
// Error base
class AppError extends Error {
  code: ErrorCode
  statusCode: number
  isOperational: boolean
}

// Errores específicos
class AuthError extends AppError {}
class ValidationError extends AppError {}
class NotFoundError extends AppError {}
class BusinessError extends AppError {}
```

### 6.2 Códigos de Error

```typescript
const ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  VALIDATION_FAILED: 'VAL_001',
  DB_NOT_FOUND: 'DB_003',
  // ...
}
```

### 6.3 Flujo de Errores

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Error     │ ──► │  toAppError │ ──► │   Logger    │
│   Ocurre    │     │  (Normalize)│     │   (Log)     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐            │
                    │  Response   │ ◄──────────┘
                    │  al Cliente │
                    └─────────────┘
```

---

## 7. Sistema de Logging

### 7.1 Niveles de Log

| Nivel | Cuándo usar                            |
| ----- | -------------------------------------- |
| DEBUG | Solo desarrollo, información detallada |
| INFO  | Eventos normales del sistema           |
| WARN  | Situaciones inusuales pero manejables  |
| ERROR | Errores que afectan funcionalidad      |
| FATAL | Errores críticos del sistema           |

### 7.2 Formato

**Desarrollo:**

```
🔍 [14:30:22] [LocalEcomer:Auth] Usuario autenticado
   { userId: "123", method: "email" }
```

**Producción:**

```json
{
  "timestamp": "2026-02-01T14:30:22.000Z",
  "level": "INFO",
  "context": "LocalEcomer:Auth",
  "message": "Usuario autenticado",
  "data": { "userId": "123", "method": "email" }
}
```

---

## 8. Testing

### 8.1 Pirámide de Tests

```
        ┌─────────┐
        │   E2E   │  10%  (Playwright)
        ├─────────┤
        │  Integ. │  20%  (React Testing Library)
        ├─────────┤
        │  Unit   │  70%  (Vitest)
        └─────────┘
```

### 8.2 Cobertura Mínima

| Métrica    | Umbral |
| ---------- | ------ |
| Lines      | 70%    |
| Functions  | 70%    |
| Branches   | 70%    |
| Statements | 70%    |

### 8.3 Ejecutar Tests

```bash
# Tests una vez
pnpm test

# Tests en modo watch
pnpm test:watch

# Tests con cobertura
pnpm test:coverage

# Tests con UI
pnpm test:ui
```

---

## 9. Control de Calidad

### 9.1 Pre-commit Hooks

Antes de cada commit se ejecuta:

1. **ESLint** - Verifica errores de código
2. **Prettier** - Formatea el código
3. **TypeScript** - Verifica tipos

### 9.2 Commit Messages

Formato: `<tipo>(<alcance>): <descripción>`

Tipos permitidos:

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Mantenimiento

Ejemplo: `feat(auth): agregar login con Google`

### 9.3 Script de Validación

```bash
# Ejecuta lint + type-check + tests
pnpm validate
```

---

## 10. Seguridad

### 10.1 Autenticación

- **Supabase Auth** con JWT
- **Row Level Security** en base de datos
- **Refresh tokens** automáticos
- **MFA** disponible

### 10.2 Validación

- **Zod** en todas las entradas
- **Sanitización** de inputs
- **Rate limiting** en APIs
- **CORS** configurado

### 10.3 Headers de Seguridad

```typescript
// next.config.ts
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]
```

---

## 11. Monitoreo

### 11.1 Logs Estructurados

Todos los logs incluyen:

- Timestamp
- Nivel
- Contexto
- Mensaje
- Datos adicionales

### 11.2 Métricas (Futuro)

- Request duration
- Error rates
- Active users
- API latency

### 11.3 Alertas (Futuro)

- Error rate > 1%
- Latency > 2s
- Downtime detection

---

## 12. Escalabilidad

### 12.1 Estrategia

```
┌───────────────────────────────────────────────────────────┐
│                      CDN (Cloudflare)                     │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────┼─────────────────────────────┐
│                    Edge Functions                          │
│              (Serverless, auto-scaling)                    │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────┼─────────────────────────────┐
│                  Supabase (PostgreSQL)                     │
│              Connection Pooling (PgBouncer)                │
└───────────────────────────────────────────────────────────┘
```

### 12.2 Optimizaciones

- **Static Generation** para páginas públicas
- **ISR** para catálogos de productos
- **CDN** para assets estáticos
- **Connection pooling** para base de datos
- **Image optimization** con Sharp

---

## 📚 Referencias

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook)
- [Zod Docs](https://zod.dev)
- [Vitest Docs](https://vitest.dev)

---

> **Mantenido por:** LocalEcomer Team  
> **Licencia:** MIT
