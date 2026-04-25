
CREATE OR REPLACE FUNCTION public.guard_profiles_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.banned IS DISTINCT FROM OLD.banned THEN
    RAISE EXCEPTION 'Não é permitido alterar o status de banimento';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Não é permitido alterar o dono do perfil';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profiles_privileged_columns_trg ON public.profiles;
CREATE TRIGGER guard_profiles_privileged_columns_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_profiles_privileged_columns();
