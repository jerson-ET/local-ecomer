-- ═══════════════════════════════════════════════════════════════════════════
--                    MIGRACIÓN: TABLA product_variants
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Esta tabla almacena las variantes de cada producto (colores, tallas, etc.)
-- Cada variante tiene su propio stock, precio modificado e imágenes.
--
-- EJECUTAR EN: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.product_variants (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  color text not null,
  color_hex text default '#000000',
  size text not null,
  type text default 'adulto' check (type in ('adulto', 'niño', 'niña', 'unisex')),
  images jsonb default '[]'::jsonb,   -- Array de {full, thumbnail}
  stock integer default 0,
  price_modifier bigint default 0,     -- 0 = mismo precio, positivo = más caro, negativo = más barato
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índice para buscar variantes por producto rápidamente
create index if not exists idx_product_variants_product_id on public.product_variants(product_id);

-- Habilitar Row Level Security
alter table public.product_variants enable row level security;

-- Variantes de productos activos son visibles por todos
create policy "Variantes visibles por todos" 
  on public.product_variants for select using (
    exists (
      select 1 from public.products 
      where id = product_variants.product_id 
      and is_active = true
    )
  );

-- Dueños de tienda pueden gestionar variantes de sus productos
create policy "Dueños gestionan variantes" 
  on public.product_variants for all using (
    exists (
      select 1 from public.products p
      join public.stores s on s.id = p.store_id
      where p.id = product_variants.product_id 
      and s.user_id = auth.uid()
    )
  );
