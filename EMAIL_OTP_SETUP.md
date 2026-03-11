# 📧 Sistema de Envío de Códigos OTP por Email — Gmail SMTP

> **Fecha de configuración:** 19 de febrero de 2026  
> **Estado:** ✅ Funcionando correctamente  
> **Cuenta Gmail:** `etjerson@gmail.com`

---

## 📋 Resumen

Se implementó un sistema propio de envío de códigos de verificación (OTP) por email usando **Gmail SMTP + Nodemailer**, reemplazando el SMTP interno de Supabase que tiene un límite muy bajo (~3-4 emails/hora en el plan gratuito).

### Límites de envío

| Tipo de cuenta         | Límite diario        |
| ---------------------- | -------------------- |
| Gmail normal           | **500 emails/día**   |
| Google Workspace       | **2,000 emails/día** |
| Requisito del proyecto | **80 emails/día** ✅ |

---

## 🏗️ Arquitectura

```
Usuario se registra
       │
       ▼
┌─────────────────────┐
│   AuthModal.tsx      │  Frontend (React)
│   (Formulario)       │
└──────────┬──────────┘
           │ POST /api/auth/send-email-otp
           ▼
┌─────────────────────┐
│  send-email-otp     │  API Route (Next.js)
│  route.ts           │
│                     │
│  1. Genera código   │
│     de 6 dígitos    │
│  2. Lo guarda en    │
│     Supabase        │
│  3. Lo envía por    │
│     Gmail SMTP      │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌──────────┐
│Supabase │ │  Gmail   │
│  tabla  │ │  SMTP    │
│ email_  │ │(Nodemailer)│
│verifica-│ └──────────┘
│tion_    │
│codes    │      │
└─────────┘      ▼
              📧 Email llega
              al usuario
                 │
                 ▼
┌─────────────────────┐
│  AuthModal.tsx       │  Usuario ingresa código
│  (Vista OTP)         │
└──────────┬──────────┘
           │ POST /api/auth/verify-email-otp
           ▼
┌─────────────────────┐
│  verify-email-otp   │  API Route
│  route.ts           │
│                     │
│  1. Verifica código │
│  2. Crea usuario en │
│     Supabase Auth   │
│  3. Crea perfil     │
└─────────────────────┘
```

---

## 📁 Archivos Creados/Modificados

### Nuevos archivos

| Archivo                                        | Descripción                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| `lib/email/transporter.ts`                     | Configuración del transporter SMTP de Gmail con Nodemailer            |
| `lib/email/templates.ts`                       | Plantillas HTML profesionales para emails (registro y recuperación)   |
| `app/api/auth/send-email-otp/route.ts`         | API que genera código OTP, lo guarda en Supabase y lo envía por Gmail |
| `app/api/auth/verify-email-otp/route.ts`       | API que verifica el código OTP y crea el usuario en Supabase Auth     |
| `supabase/create_email_verification_codes.sql` | SQL para crear la tabla `email_verification_codes`                    |

### Archivos modificados

| Archivo                         | Cambio                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `components/auth/AuthModal.tsx` | Reescrito para usar nuestras APIs propias en lugar de `supabase.auth.signUp()` |
| `.env.local`                    | Agregadas variables `GMAIL_USER` y `GMAIL_APP_PASS`                            |
| `package.json`                  | Agregadas dependencias `nodemailer` y `@types/nodemailer`                      |

---

## 🔐 Variables de Entorno

```env
# Gmail SMTP - Envío de correos (códigos OTP)
GMAIL_USER=etjerson@gmail.com
GMAIL_APP_PASS=ahjazaanfemuyxan   # Contraseña de aplicación (16 caracteres)
```

### Cómo generar la contraseña de aplicación

1. Ir a [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Activar **Verificación en 2 pasos** (si no está activa)
3. Ir a [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Crear nueva contraseña para la app "LocalEcomer"
5. Google genera un código de 16 caracteres

> ⚠️ **IMPORTANTE:** Si cambias la contraseña de Gmail o revocas la contraseña de aplicación, debes generar una nueva y actualizar `.env.local`.

---

## 🗄️ Base de Datos — Tabla `email_verification_codes`

```sql
CREATE TABLE email_verification_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'registration',  -- 'registration' o 'recovery'
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

- **RLS habilitado**: Solo `service_role` puede acceder
- **Índices**: Optimizados para búsqueda por email + código
- **Expiración**: Los códigos expiran en 5 minutos

---

## 🔄 Flujos de Usuario

### Registro

1. Usuario llena formulario (nombre, email, contraseña)
2. Clic en **"Continuar"**
3. Frontend llama a `POST /api/auth/send-email-otp` con `type: 'registration'`
4. API genera código de 6 dígitos → lo guarda en Supabase → lo envía por Gmail
5. Modal cambia a vista de verificación OTP
6. Usuario ingresa el código de 6 dígitos
7. Frontend llama a `POST /api/auth/verify-email-otp`
8. API verifica código → crea usuario con `supabase.auth.admin.createUser()` (con `email_confirm: true`) → crea perfil
9. Login automático post-verificación

### Recuperación de contraseña

1. Usuario ingresa email en "¿Olvidaste tu contraseña?"
2. Clic en **"Enviar Código"**
3. Frontend llama a `POST /api/auth/send-email-otp` con `type: 'recovery'`
4. API genera código y lo envía por Gmail
5. Usuario ingresa el código
6. Frontend llama a `POST /api/auth/verify-email-otp` con `type: 'recovery'`
7. Si es válido, muestra campo de nueva contraseña
8. Frontend llama a `POST /api/auth/reset-password`

### Login (sin cambios)

- Usa directamente `supabase.auth.signInWithPassword()` — no envía correo.

---

## 🛡️ Seguridad

- **Rate limiting**: Máximo 5 códigos por hora por email
- **Expiración**: Códigos expiran en 5 minutos
- **RLS**: Tabla solo accesible vía `service_role` (backend)
- **Invalidación**: Al generar un nuevo código, los anteriores se marcan como usados
- **Contraseña de app**: No es la contraseña de Gmail, es un token específico revocable

---

## 📦 Dependencias Agregadas

```json
{
  "dependencies": {
    "nodemailer": "^8.0.1"
  },
  "devDependencies": {
    "@types/nodemailer": "^7.0.10"
  }
}
```

---

## 🧪 Prueba Realizada

- **Fecha:** 19 de febrero de 2026, ~01:46 AM
- **Email de prueba:** `etjerson@gmail.com`
- **Nombre de prueba:** "Usuario Prueba"
- **Resultado:** ✅ Código enviado exitosamente, modal de verificación mostrado correctamente

---

## 🔧 Troubleshooting

### Error: "Servicio de correo no configurado"

→ Verifica que `GMAIL_USER` y `GMAIL_APP_PASS` están en `.env.local` y reinicia el servidor.

### Error: "Error de autenticación con Gmail"

→ La contraseña de aplicación puede haber sido revocada. Genera una nueva en [apppasswords](https://myaccount.google.com/apppasswords).

### Error: "Demasiados intentos"

→ Rate limiting activo. Esperar 1 hora o reiniciar el servidor (limpia el rate limit en memoria).

### Los correos llegan a spam

→ Normal las primeras veces. El usuario debe marcar "No es spam". Con el tiempo Gmail aprende.

### Error: "Este correo ya está registrado"

→ El email ya existe en Supabase Auth. Usar "Iniciar Sesión" en lugar de "Registrarse".
