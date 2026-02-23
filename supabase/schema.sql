-- ═══════════════════════════════════════════════════════════════════════════
--                       ESQUEMA DE BASE DE DATOS - LOCAL ECOMER
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ───────────────────────────────────────────────────────────────────────────
--                                  USUARIOS
-- ───────────────────────────────────────────────────────────────────────────

-- Tabla pública de perfiles (extiende auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  name text,
  avatar_url text,
  role text default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  wallet_balance bigint default 0, -- en centavos
  country_code text,
  phone_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_seen timestamp with time zone
);

-- Políticas RLS (Row Level Security)
alter table public.profiles enable row level security;

create policy "Perfiles son verables por todos" 
  on public.profiles for select using (true);

create policy "Usuarios pueden editar su propio perfil" 
  on public.profiles for update using (auth.uid() = id);

-- ───────────────────────────────────────────────────────────────────────────
--                            VERIFICACIÓN OTP
-- ───────────────────────────────────────────────────────────────────────────

create table public.verification_codes (
  id uuid default uuid_generate_v4() primary key,
  phone text not null,
  code text not null,
  used boolean default false,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.verification_codes enable row level security;

-- Bloquear acceso público, solo accesible vía Service Role en servidor
create policy "Sin acceso público" on public.verification_codes for all using (false);

-- ───────────────────────────────────────────────────────────────────────────
--                                  TIENDAS
-- ───────────────────────────────────────────────────────────────────────────

create table public.stores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  banner_url text,
  theme_color text default '#6366f1',
  is_active boolean default true,
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stores enable row level security;

create policy "Tiendas son verables por todos" 
  on public.stores for select using (true);

create policy "Solo dueños pueden editar tiendas" 
  on public.stores for all using (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
--                                PRODUCTOS
-- ───────────────────────────────────────────────────────────────────────────

create table public.products (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) not null,
  name text not null,
  description text,
  price bigint not null, -- en centavos/unidades
  discount_price bigint,
  discount_percent integer,
  stock integer default 0,
  category_id text, -- ID simple o referencia a tabla categorias futura
  images jsonb default '[]'::jsonb, -- Array de {full, thumbnail}
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.products enable row level security;

create policy "Productos activos son verables por todos" 
  on public.products for select using (is_active = true);

create policy "Dueños de tienda gestionan sus productos" 
  on public.products for all using (
    exists ( select 1 from public.stores where id = products.store_id and user_id = auth.uid() )
  );

-- ───────────────────────────────────────────────────────────────────────────
--                                PEDIDOS (ORDERS)
-- ───────────────────────────────────────────────────────────────────────────

create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) not null,
  buyer_id uuid references public.profiles(id) not null,
  status text default 'pending' check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
  total_amount bigint not null,
  payment_method text not null check (payment_method in ('credit_card', 'nequi', 'daviplata', 'pse', 'cash_on_delivery')),
  shipping_address text not null,
  shipping_cost bigint default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;

-- Comprador ve sus pedidos
create policy "Comprador ve sus pedidos" 
  on public.orders for select using (auth.uid() = buyer_id);

-- Vendedor ve pedidos de su tienda
create policy "Vendedor ve pedidos de su tienda" 
  on public.orders for select using (
    exists ( select 1 from public.stores where id = orders.store_id and user_id = auth.uid() )
  );

-- Vendedor actualiza estado de pedidos
create policy "Vendedor actualiza estado" 
  on public.orders for update using (
    exists ( select 1 from public.stores where id = orders.store_id and user_id = auth.uid() )
  );


-- ───────────────────────────────────────────────────────────────────────────
--                           DETALLE DE PEDIDOS (ITEMS)
-- ───────────────────────────────────────────────────────────────────────────

create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null default 1,
  unit_price bigint not null, -- Precio congelado al momento de compra
  total_price bigint not null, -- quantity * unit_price
  product_name_snapshot text not null,
  product_image_snapshot text
);

alter table public.order_items enable row level security;

-- Visible si tienes acceso al pedido padre
create policy "Visible por acceso al pedido" 
  on public.order_items for select using (
    exists ( select 1 from public.orders where id = order_items.order_id and (buyer_id = auth.uid() or store_id in (select id from public.stores where user_id = auth.uid())) )
  );

-- ───────────────────────────────────────────────────────────────────────────
--                                CHAT & MENSAJES
-- ───────────────────────────────────────────────────────────────────────────

create table public.chat_rooms (
  id uuid default uuid_generate_v4() primary key,
  type text default 'direct' check (type in ('direct', 'group', 'channel')),
  store_id uuid references public.stores(id), -- Opcional, para chats de soporte
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_message_at timestamp with time zone
);

create table public.chat_participants (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.chat_rooms(id) not null,
  user_id uuid references public.profiles(id) not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_read_at timestamp with time zone
);

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.chat_rooms(id) not null,
  sender_id uuid references public.profiles(id), -- null para mensajes de sistema
  content text not null,
  type text default 'text' check (type in ('text', 'image', 'file', 'product')),
  attachments text[], -- Array de URLs
  reply_to uuid references public.messages(id),
  is_deleted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  edited_at timestamp with time zone
);

-- (RLS para chat omitido por brevedad, pero seguiría lógica de participants)
