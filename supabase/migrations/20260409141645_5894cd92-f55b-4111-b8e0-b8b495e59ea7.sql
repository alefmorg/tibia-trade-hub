CREATE TABLE IF NOT EXISTS public.trade_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_duration_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_settings ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS trade_settings_singleton_idx
ON public.trade_settings ((true));

CREATE OR REPLACE FUNCTION public.validate_trade_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ad_duration_days < 1 OR NEW.ad_duration_days > 365 THEN
    RAISE EXCEPTION 'A duração dos anúncios deve ficar entre 1 e 365 dias';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_trade_settings_trigger ON public.trade_settings;
CREATE TRIGGER validate_trade_settings_trigger
BEFORE INSERT OR UPDATE ON public.trade_settings
FOR EACH ROW
EXECUTE FUNCTION public.validate_trade_settings();

DROP TRIGGER IF EXISTS update_trade_settings_updated_at ON public.trade_settings;
CREATE TRIGGER update_trade_settings_updated_at
BEFORE UPDATE ON public.trade_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Trade settings are viewable by everyone"
ON public.trade_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert trade settings"
ON public.trade_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update trade settings"
ON public.trade_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trade settings"
ON public.trade_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.trade_settings (ad_duration_days)
SELECT 7
WHERE NOT EXISTS (
  SELECT 1 FROM public.trade_settings
);

ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS tier INTEGER;

CREATE OR REPLACE FUNCTION public.validate_item_tier()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tier IS NOT NULL AND (NEW.tier < 0 OR NEW.tier > 10) THEN
    RAISE EXCEPTION 'O tier do item deve ficar entre 0 e 10';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_item_tier_trigger ON public.items;
CREATE TRIGGER validate_item_tier_trigger
BEFORE INSERT OR UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.validate_item_tier();

ALTER TABLE public.ads
ADD COLUMN IF NOT EXISTS item_id UUID,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'ads'
      AND constraint_name = 'ads_item_id_fkey'
  ) THEN
    ALTER TABLE public.ads
    ADD CONSTRAINT ads_item_id_fkey
    FOREIGN KEY (item_id)
    REFERENCES public.items(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_items_tier ON public.items(tier);
CREATE INDEX IF NOT EXISTS idx_ads_item_id ON public.ads(item_id);
CREATE INDEX IF NOT EXISTS idx_ads_expires_at ON public.ads(expires_at);
CREATE INDEX IF NOT EXISTS idx_ads_status_expires_at ON public.ads(status, expires_at);

CREATE OR REPLACE FUNCTION public.get_ad_duration_days()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT ad_duration_days FROM public.trade_settings LIMIT 1), 7)
$$;

CREATE OR REPLACE FUNCTION public.set_ad_expiration_from_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + make_interval(days => public.get_ad_duration_days());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_ads_expiration_on_insert ON public.ads;
CREATE TRIGGER set_ads_expiration_on_insert
BEFORE INSERT ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.set_ad_expiration_from_settings();

CREATE POLICY "Admins can view all offers"
ON public.offers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any offer"
ON public.offers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any offer"
ON public.offers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all favorites"
ON public.favorites
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));