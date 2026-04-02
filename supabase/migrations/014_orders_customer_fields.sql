ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS buyer_name text,
  ADD COLUMN IF NOT EXISTS buyer_phone text;

CREATE INDEX IF NOT EXISTS orders_store_id_idx ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS orders_buyer_id_idx ON public.orders(buyer_id);

