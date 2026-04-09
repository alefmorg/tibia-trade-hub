ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS tier INTEGER;

CREATE OR REPLACE FUNCTION public.validate_ad_tier()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tier IS NOT NULL AND (NEW.tier < 0 OR NEW.tier > 10) THEN
    RAISE EXCEPTION 'O tier do anúncio deve ficar entre 0 e 10';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_ad_tier_trigger ON public.ads;
CREATE TRIGGER validate_ad_tier_trigger
BEFORE INSERT OR UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.validate_ad_tier();