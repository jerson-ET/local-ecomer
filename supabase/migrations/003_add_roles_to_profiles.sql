-- Add role to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'buyer';
  END IF;
END $$;

-- Drop constraints if they exist and recreate them to include superadmin
DO $$ 
BEGIN
  -- We don't drop constraints here just in case, since check constraints might have different names, 
  -- but we can try to update the policy or just make sure the column accepts text
  -- For now just having the role text column is enough.
END $$;
