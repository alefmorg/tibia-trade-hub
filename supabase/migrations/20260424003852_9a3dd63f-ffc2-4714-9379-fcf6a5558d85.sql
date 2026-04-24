-- 1. Replace permissive UPDATE policy on ads with a column-restricted version using a trigger guard
-- Drop existing user update policy
DROP POLICY IF EXISTS "Users can update own ads" ON public.ads;

-- Create a trigger that prevents non-admin users from changing privileged columns
CREATE OR REPLACE FUNCTION public.guard_ads_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins bypass all checks
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Owner-only updates: block changes to privileged fields
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Não é permitido alterar o dono do anúncio';
  END IF;
  IF NEW.featured IS DISTINCT FROM OLD.featured THEN
    RAISE EXCEPTION 'Use a função de destaque para alterar este campo';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Não é permitido alterar o status diretamente';
  END IF;
  IF NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION 'Não é permitido alterar a data de expiração';
  END IF;
  IF NEW.likes_count IS DISTINCT FROM OLD.likes_count THEN
    RAISE EXCEPTION 'Não é permitido alterar o número de curtidas';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_ads_privileged_columns_trg ON public.ads;
CREATE TRIGGER guard_ads_privileged_columns_trg
  BEFORE UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_ads_privileged_columns();

-- Recreate user update policy (owner-only)
CREATE POLICY "Users can update own ads"
ON public.ads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Ensure favorites trigger keeps likes_count consistent (already exists as update_likes_count fn)
-- Attach trigger if missing
DROP TRIGGER IF EXISTS on_favorite_change ON public.favorites;
CREATE TRIGGER on_favorite_change
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_likes_count();

-- 3. Restrict realtime broadcasts for ads to authenticated users on a specific topic
-- Drop overly broad public realtime access if any (no-op if not present)
DROP POLICY IF EXISTS "Authenticated can read realtime ads" ON realtime.messages;

CREATE POLICY "Authenticated can read realtime ads"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'ads-public'
);