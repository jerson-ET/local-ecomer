DO $$
DECLARE
  role_constraint_name text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'buyer';
  END IF;

  UPDATE public.profiles
  SET role = 'buyer'
  WHERE role IS NULL
     OR role NOT IN ('buyer', 'seller', 'reseller', 'admin', 'superadmin');

  SELECT c.conname
  INTO role_constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE t.relname = 'profiles'
    AND n.nspname = 'public'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%role in%';

  IF role_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', role_constraint_name);
  END IF;

  ALTER TABLE public.profiles
    ALTER COLUMN role SET DEFAULT 'buyer';

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('buyer', 'seller', 'reseller', 'admin', 'superadmin'));
END $$;
