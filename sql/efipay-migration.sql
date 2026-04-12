-- ═══════════════════════════════════════════════════════════════════════════
--  EFIPAY INTEGRATION - Agregar columnas a la tabla orders
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en el SQL Editor de Supabase

-- Columnas para vincular Efipay con las órdenes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS efipay_payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS efipay_checkout_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS efipay_transaction_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS efipay_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Índice para búsqueda rápida por payment_id (webhook)
CREATE INDEX IF NOT EXISTS idx_orders_efipay_payment_id ON orders (efipay_payment_id) WHERE efipay_payment_id IS NOT NULL;
