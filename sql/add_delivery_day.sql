-- Añadir columna de fecha estimada de entrega a los pedidos
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery text;
COMMENT ON COLUMN public.orders.estimated_delivery IS 'Día estimado de entrega (ej: Lunes, 20 de Abril)';
