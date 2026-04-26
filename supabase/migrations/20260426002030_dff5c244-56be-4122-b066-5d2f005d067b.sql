-- 1) Itens: coluna source (tibia/custom) + sort_order + remover T0
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'tibia',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Validação de source
CREATE OR REPLACE FUNCTION public.validate_item_source()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.source NOT IN ('tibia','custom') THEN
    RAISE EXCEPTION 'source deve ser tibia ou custom';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_item_source ON public.items;
CREATE TRIGGER trg_validate_item_source
BEFORE INSERT OR UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.validate_item_source();

-- Tier: remover T0 (vira NULL) e ajustar validação 1-10
UPDATE public.items SET tier = NULL WHERE tier = 0;
UPDATE public.ads   SET tier = NULL WHERE tier = 0;

CREATE OR REPLACE FUNCTION public.validate_item_tier()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.tier IS NOT NULL AND (NEW.tier < 1 OR NEW.tier > 10) THEN
    RAISE EXCEPTION 'O tier do item deve ficar entre 1 e 10 (ou vazio)';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.validate_ad_tier()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.tier IS NOT NULL AND (NEW.tier < 1 OR NEW.tier > 10) THEN
    RAISE EXCEPTION 'O tier do anúncio deve ficar entre 1 e 10 (ou vazio)';
  END IF;
  RETURN NEW;
END $$;

CREATE INDEX IF NOT EXISTS idx_items_source_sort ON public.items(source, sort_order);

-- 2) Banners: campos de patrocinador
ALTER TABLE public.site_banners
  ADD COLUMN IF NOT EXISTS sponsor_name text,
  ADD COLUMN IF NOT EXISTS logo_url text;

-- 3) Cron de limpeza de notificações lidas > 2 dias
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.cleanup_old_read_notifications()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  WITH d AS (
    DELETE FROM public.notifications
    WHERE read = true AND created_at < now() - interval '2 days'
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM d;
  RETURN v_count;
END $$;

-- Agendar a cada hora
SELECT cron.unschedule('cleanup-old-read-notifications')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-read-notifications');

SELECT cron.schedule(
  'cleanup-old-read-notifications',
  '0 * * * *',
  $$ SELECT public.cleanup_old_read_notifications(); $$
);