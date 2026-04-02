CREATE UNIQUE INDEX IF NOT EXISTS referral_links_unique_reseller_store_product
  ON public.referral_links (reseller_id, store_id, product_id);

