-- 1. Protect vip_until on profiles (prevent free VIP self-grant) + ensure other guards remain
CREATE OR REPLACE FUNCTION public.guard_profiles_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  IF NEW.vip_until IS DISTINCT FROM OLD.vip_until THEN
    RAISE EXCEPTION 'Use a função de compra VIP para alterar este campo';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_profiles_privileged_columns_trg ON public.profiles;
CREATE TRIGGER guard_profiles_privileged_columns_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_privileged_columns();

-- 2. Add WITH CHECK to the profiles update policy to enforce ownership on resulting row too
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Restrict updates to broadcast notifications: users can only update their own rows,
--    and only the `read` flag (admins bypass).
DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.notifications;
CREATE POLICY "Users can mark own notifications as read"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.guard_notifications_read_only_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Apenas o status de leitura pode ser alterado';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_notifications_read_only_update_trg ON public.notifications;
CREATE TRIGGER guard_notifications_read_only_update_trg
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.guard_notifications_read_only_update();

-- 4. Lock down direct INSERT into donations — force users through donate_coins() RPC
DROP POLICY IF EXISTS "Users create donations" ON public.donations;
-- (No replacement INSERT policy for users; donate_coins is SECURITY DEFINER and bypasses RLS)
