-- Función del trigger para forzar el rol de comprador a usuarios de Google
CREATE OR REPLACE FUNCTION public.handle_profile_role_enforcement()
RETURNS TRIGGER AS $$
DECLARE
  v_provider TEXT;
BEGIN
  -- Obtener el proveedor de autenticación de auth.users
  SELECT (raw_app_meta_data->>'provider')
  INTO v_provider
  FROM auth.users
  WHERE id = NEW.id;

  -- Si el proveedor es google, forzar rol a buyer
  IF v_provider = 'google' THEN
    NEW.role := 'buyer';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sobre la tabla profiles
DROP TRIGGER IF EXISTS enforce_profile_role_trigger ON public.profiles;
CREATE TRIGGER enforce_profile_role_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_role_enforcement();
