CREATE TABLE IF NOT EXISTS public.referral_links (
  id uuid default uuid_generate_v4() primary key,
  reseller_id uuid references public.profiles(id) not null,
  store_id uuid references public.stores(id) not null,
  product_id uuid references public.products(id),
  code text not null unique,
  commission_pct integer not null default 10 check (commission_pct >= 0 and commission_pct <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'referral_links' AND policyname = 'Revendedor gestiona sus links'
  ) THEN
    CREATE POLICY "Revendedor gestiona sus links"
      ON public.referral_links
      FOR ALL
      USING (auth.uid() = reseller_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) not null,
  reseller_id uuid references public.profiles(id) not null,
  store_id uuid references public.stores(id) not null,
  amount bigint not null,
  status text default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'commissions' AND policyname = 'Revendedores ven sus comisiones'
  ) THEN
    CREATE POLICY "Revendedores ven sus comisiones"
      ON public.commissions
      FOR SELECT
      USING (auth.uid() = reseller_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'commissions' AND policyname = 'Dueños de tienda ven comisiones a pagar'
  ) THEN
    CREATE POLICY "Dueños de tienda ven comisiones a pagar"
      ON public.commissions
      FOR SELECT
      USING (exists (select 1 from public.stores where id = store_id and user_id = auth.uid()));
  END IF;
END $$;

