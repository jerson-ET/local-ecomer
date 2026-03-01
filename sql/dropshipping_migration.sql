-- 1. Añadir enum de rol a reseller si no existe modificando la constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('buyer', 'seller', 'admin', 'reseller', 'superadmin'));

-- 2. Modificar status en orders para dropshipping local
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending_confirmation', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'));

-- 3. Añadir tracking fields
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_id uuid references public.profiles(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_affiliate_ready boolean default false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS commission_rate integer default 0; -- % de comision

-- 4. Nueva Tabla Comisiones
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

CREATE POLICY "Revendedores ven sus comisiones" 
  ON public.commissions FOR SELECT USING (auth.uid() = reseller_id);

CREATE POLICY "Dueños de tienda ven comisiones a pagar" 
  ON public.commissions FOR SELECT USING (
    EXISTS ( SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid() )
  );
