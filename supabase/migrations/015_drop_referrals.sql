-- Eliminar vistas, tablas e índices relacionados con comisiones y afiliados
DROP TABLE IF EXISTS public.commissions CASCADE;
DROP TABLE IF EXISTS public.referral_links CASCADE;
DROP TABLE IF EXISTS public.referral_events CASCADE;

-- Eliminar columnas en tablas existentes public.users, public.stores o public.profiles si existen
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stores' AND column_name='referral_code') THEN 
    ALTER TABLE public.stores DROP COLUMN referral_code;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='referral_code') THEN 
    ALTER TABLE public.profiles DROP COLUMN referral_code;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='referred_by') THEN 
    ALTER TABLE public.profiles DROP COLUMN referred_by;
  END IF;
END $$;
