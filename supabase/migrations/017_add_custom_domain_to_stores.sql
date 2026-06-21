-- Añadir columna custom_domain a la tabla stores
alter table public.stores add column if not exists custom_domain text unique;
