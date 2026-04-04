-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Autenticación Telegram + Red de Referidos
-- ═══════════════════════════════════════════════════════════════════════════
-- Fecha: 2026-04-04
-- Descripción: Agrega campos de Telegram a profiles, código de referido,
--              red de referidos con tracking de comisiones por membresía.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. AGREGAR COLUMNAS DE TELEGRAM A PROFILES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS telegram_id bigint UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_username text,
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial' 
    CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;

-- Índice para búsquedas rápidas por telegram_id
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ADAPTAR TABLA verification_codes PARA SOPORTAR TELEGRAM
-- ─────────────────────────────────────────────────────────────────────────────

-- Agregar campo de telegram_id (el phone ya existe, ahora es opcional)
ALTER TABLE public.verification_codes 
  ADD COLUMN IF NOT EXISTS telegram_id bigint;

-- Hacer phone nullable ya que ahora puede ser telegram_id
ALTER TABLE public.verification_codes ALTER COLUMN phone DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABLA DE RED DE REFERIDOS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.referral_network (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Quien invitó (el padrino)
  referrer_id uuid REFERENCES public.profiles(id) NOT NULL,
  
  -- El invitado
  referred_id uuid REFERENCES public.profiles(id) NOT NULL UNIQUE,
  
  -- El código que usó para registrarse
  referral_code_used text NOT NULL,
  
  -- Comisión por cada pago de membresía ($5,000 COP = 500000 centavos)
  commission_amount bigint DEFAULT 500000,
  
  -- Estado de la relación
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_referral_network_referrer ON public.referral_network(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_network_referred ON public.referral_network(referred_id);

-- RLS
ALTER TABLE public.referral_network ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver su propia red (los que invitaron)
CREATE POLICY "Ver mi red de referidos" 
  ON public.referral_network FOR SELECT 
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TABLA DE PAGOS/COMISIONES DE REFERIDOS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.referral_commissions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Relación con la red
  referral_network_id uuid REFERENCES public.referral_network(id) NOT NULL,
  
  -- Quien recibe la comisión
  beneficiary_id uuid REFERENCES public.profiles(id) NOT NULL,
  
  -- Quien pagó la membresía (el invitado)
  payer_id uuid REFERENCES public.profiles(id) NOT NULL,
  
  -- Monto de la comisión en centavos
  amount bigint NOT NULL DEFAULT 500000,
  
  -- Estado del pago
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'paid_out', 'cancelled')),
  
  -- Período de membresía al que corresponde
  membership_period_start timestamp with time zone,
  membership_period_end timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  paid_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_beneficiary ON public.referral_commissions(beneficiary_id);

ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver mis comisiones de ref" 
  ON public.referral_commissions FOR SELECT 
  USING (auth.uid() = beneficiary_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TABLA TEMPORAL: Usuarios que interactúan con el Bot
--    Necesaria para vincular @username ↔ telegram_id
--    Cuando un usuario escribe /start al bot, se guarda aquí
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.telegram_bot_users (
  telegram_id bigint PRIMARY KEY,
  username text,
  first_name text,
  chat_id bigint,
  last_interaction timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tg_bot_users_username ON public.telegram_bot_users(username);

ALTER TABLE public.telegram_bot_users ENABLE ROW LEVEL SECURITY;

-- Solo accesible por service role (servidor)
CREATE POLICY "Sin acceso público tg_bot" ON public.telegram_bot_users FOR ALL USING (false);

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DE LA MIGRACIÓN
-- ═══════════════════════════════════════════════════════════════════════════
