ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS referral_code text;

CREATE INDEX IF NOT EXISTS commissions_store_id_idx ON public.commissions(store_id);
CREATE INDEX IF NOT EXISTS commissions_order_id_idx ON public.commissions(order_id);

