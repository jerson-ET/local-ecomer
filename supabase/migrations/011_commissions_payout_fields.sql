DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'commissions'
  ) THEN
    ALTER TABLE public.commissions
      ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS paid_method text,
      ADD COLUMN IF NOT EXISTS paid_note text,
      ADD COLUMN IF NOT EXISTS paid_by uuid references public.profiles(id);
  END IF;
END $$;

