-- Añadir columna para número de WhatsApp de la tienda
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS whatsapp_number text;
