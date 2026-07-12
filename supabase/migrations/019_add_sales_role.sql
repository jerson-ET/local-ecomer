-- 19. Añadir rol 'sales' (Área de Ventas) a la restricción de perfiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('buyer', 'seller', 'reseller', 'admin', 'superadmin', 'sales'));
