-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: AGREGAR COLUMN A PRODUCTOS PARA CONTROL DE MARKETPLACE
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_in_marketplace boolean default true;
