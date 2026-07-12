-- 20. Añadir columna para trackear qué asesor creó el perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_by_sales_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
