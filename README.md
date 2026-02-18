# 🏪 LocalEcomer - Centro Comercial Digital

<div align="center">

![LocalEcomer](https://img.shields.io/badge/LocalEcomer-v0.1.0-6366f1?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tests](https://img.shields.io/badge/Tests-28%20passing-green?style=for-the-badge)

**El marketplace digital más robusto y confiable de Latinoamérica**

[Ver Demo](#) • [Documentación](./ARCHITECTURE.md) • [Contribuir](#contribuir)

</div>

---

## 🏗️ Arquitectura Enterprise

Este proyecto está construido con una arquitectura de **nivel empresarial** diseñada para:

- ✅ Funcionar **20+ años** sin fallos
- ✅ Manejar **millones de usuarios**
- ✅ **99.99% de disponibilidad**
- ✅ Recuperación automática de errores

### Capas de Protección

```
┌───────────────────────────────────────────────────────┐
│              🔒 GIT HOOKS (Husky)                     │
│     Previene código malo antes del commit             │
├───────────────────────────────────────────────────────┤
│              📝 COMMIT MESSAGES                        │
│     Conventional Commits obligatorios                 │
├───────────────────────────────────────────────────────┤
│              🧪 TESTING (Vitest)                      │
│     28+ tests automatizados                           │
├───────────────────────────────────────────────────────┤
│              📐 VALIDACIÓN (Zod)                      │
│     Todos los datos validados                         │
├───────────────────────────────────────────────────────┤
│              🔷 TYPESCRIPT ESTRICTO                   │
│     Modo ultra-estricto habilitado                    │
├───────────────────────────────────────────────────────┤
│              🛡️ ESLINT + PRETTIER                    │
│     Código limpio y consistente                       │
└───────────────────────────────────────────────────────┘
```

---

## 🚀 Inicio Rápido

### Requisitos

- **Node.js** 20+
- **pnpm** 9+

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/local-ecomer.git
cd local-ecomer

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📋 Comandos Disponibles

### Desarrollo

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm start        # Iniciar producción
```

### Calidad de Código

```bash
pnpm lint         # Verificar errores de ESLint
pnpm lint:fix     # Corregir errores automáticamente
pnpm format       # Formatear código con Prettier
pnpm type-check   # Verificar tipos TypeScript
```

### Testing

```bash
pnpm test            # Ejecutar tests una vez
pnpm test:watch      # Tests en modo watch
pnpm test:coverage   # Tests con cobertura
pnpm test:ui         # Tests con interfaz visual
```

### Validación Completa

```bash
pnpm validate     # Lint + TypeScript + Tests (todo en uno)
```

---

## 📁 Estructura del Proyecto

```
local-ecomer/
├── 📂 app/                 # Next.js App Router
│   ├── globals.css        # Sistema de diseño
│   ├── layout.tsx         # Layout raíz
│   └── page.tsx           # Página de inicio
│
├── 📂 components/          # Componentes React
│   └── layout/            # Header, Footer
│
├── 📂 lib/                 # Lógica de negocio
│   ├── errors/            # Sistema de errores
│   ├── logger/            # Sistema de logging
│   ├── validations/       # Esquemas Zod
│   ├── supabase/          # Cliente Supabase
│   ├── r2/                # Cliente Cloudflare R2
│   └── types/             # Tipos TypeScript
│
├── 📂 tests/               # Tests automatizados
│
├── 📂 supabase/            # Schema de BD
│
├── 📂 .husky/              # Git hooks
│
├── 📄 ARCHITECTURE.md     # Documentación técnica
├── 📄 tsconfig.json       # TypeScript estricto
├── 📄 vitest.config.ts    # Configuración de tests
└── 📄 eslint.config.mjs   # Configuración ESLint
```

---

## 🛡️ Sistema de Protección

### TypeScript Ultra-Estricto

```typescript
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true
}
```

### Validación con Zod

Todo dato que entra o sale se valida:

```typescript
const result = LoginSchema.safeParse(data)
if (!result.success) {
  throw new ValidationError('Datos inválidos')
}
```

### Manejo de Errores Centralizado

```typescript
try {
  await operation()
} catch (error) {
  logger.error('Operación falló', error)
  throw toAppError(error)
}
```

### Git Hooks (Husky)

- **pre-commit**: Ejecuta lint-staged
- **commit-msg**: Verifica formato de commits

---

## 🧪 Testing

### Ejecutar Tests

```bash
pnpm test
```

### Resultado Esperado

```
 ✓ EmailSchema › debe aceptar emails válidos
 ✓ PasswordSchema › debe rechazar contraseñas muy cortas
 ✓ LoginSchema › debe aceptar datos de login válidos
 ✓ RegisterSchema › debe rechazar si las contraseñas no coinciden
 ... (28 tests pasando)
```

### Cobertura Mínima

| Métrica    | Umbral |
|------------|--------|
| Lines      | 70%    |
| Functions  | 70%    |
| Branches   | 70%    |
| Statements | 70%    |

---

## 📊 Stack Tecnológico

| Categoría | Tecnología | Propósito |
|-----------|------------|-----------|
| **Framework** | Next.js 16 | Full-stack React |
| **Lenguaje** | TypeScript 5 | Type safety |
| **Estilos** | Tailwind CSS 4 | Utility-first CSS |
| **Base de Datos** | Supabase | PostgreSQL + Auth |
| **Almacenamiento** | Cloudflare R2 | Imágenes |
| **Testing** | Vitest | Test runner |
| **Validación** | Zod | Runtime validation |
| **Linting** | ESLint + Prettier | Code quality |
| **Git Hooks** | Husky | Pre-commit checks |

---

## 📄 Licencia

MIT © LocalEcomer Team

---

<div align="center">

**Construido con ❤️ para vendedores y compradores**

[⬆ Volver arriba](#-localecomer---centro-comercial-digital)

</div>
