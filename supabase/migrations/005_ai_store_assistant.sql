-- Añadimos las nuevas columnas a stores y products requeridas en Fase 1
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{"Efectivo"}',
ADD COLUMN IF NOT EXISTS auto_discount_rules JSONB DEFAULT '[]'::jsonb;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_tags TEXT[] DEFAULT '{}'::text[];

-- Se asume que whatsapp_number ya existe según 002_store_whatsapp.sql
