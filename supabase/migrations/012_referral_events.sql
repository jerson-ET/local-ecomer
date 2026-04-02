CREATE TABLE IF NOT EXISTS public.referral_events (
  id uuid default uuid_generate_v4() primary key,
  referral_code text not null,
  store_id uuid references public.stores(id) not null,
  product_id uuid references public.products(id),
  event_type text not null check (event_type in ('click')),
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE INDEX IF NOT EXISTS referral_events_code_idx ON public.referral_events(referral_code);
CREATE INDEX IF NOT EXISTS referral_events_store_idx ON public.referral_events(store_id);
CREATE INDEX IF NOT EXISTS referral_events_created_idx ON public.referral_events(created_at);

ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'referral_events' AND policyname = 'No acceso público referral_events'
  ) THEN
    CREATE POLICY "No acceso público referral_events"
      ON public.referral_events
      FOR ALL
      USING (false);
  END IF;
END $$;

