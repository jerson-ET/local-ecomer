-- 1. Tabla de seguidores/suscriptores de tiendas
CREATE TABLE IF NOT EXISTS public.store_followers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, store_id)
);

ALTER TABLE public.store_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own follows" ON public.store_followers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can follow/unfollow" ON public.store_followers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Store owners can see followers" ON public.store_followers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_followers.store_id AND user_id = auth.uid())
);

-- 2. Tabla de referidos
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ref_code text NOT NULL UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'paid')),
  commission_amount bigint DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  converted_at timestamptz
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);
