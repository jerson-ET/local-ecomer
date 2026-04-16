-- Añadir columna SKU (Código de producto) a la tabla products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
COMMENT ON COLUMN public.products.sku IS 'Código único o SKU del producto (letras y números)';
