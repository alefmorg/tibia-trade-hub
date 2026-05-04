
-- =====================================================
-- 1) RAFFLE PAGE SETTINGS (modo "em breve" + visual)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.raffle_page_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coming_soon boolean NOT NULL DEFAULT false,
  coming_soon_title text NOT NULL DEFAULT 'Em breve!',
  coming_soon_message text NOT NULL DEFAULT 'Estamos preparando rifas incríveis para você. Volte em breve!',
  coming_soon_image_url text,
  page_title text NOT NULL DEFAULT 'CAMPANHAS ATIVAS',
  page_subtitle text NOT NULL DEFAULT 'Escolha sua sorte e garanta seus bilhetes!',
  accent_color text NOT NULL DEFAULT 'warning',
  cta_text text NOT NULL DEFAULT 'Garantir meus bilhetes',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.raffle_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read raffle page settings"
  ON public.raffle_page_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage raffle page settings"
  ON public.raffle_page_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Linha única (singleton)
INSERT INTO public.raffle_page_settings (id) VALUES (gen_random_uuid());

-- =====================================================
-- 2) RAFFLE AUDIT LOG (histórico por rifa)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.raffle_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raffle_audit_raffle ON public.raffle_audit_log (raffle_id, created_at DESC);

ALTER TABLE public.raffle_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view raffle audit"
  ON public.raffle_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Helper
CREATE OR REPLACE FUNCTION public.raffle_log(
  p_raffle_id uuid, p_action text, p_details jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.raffle_audit_log (raffle_id, actor_id, action, details)
  VALUES (p_raffle_id, auth.uid(), p_action, COALESCE(p_details, '{}'::jsonb));
END;
$$;

-- Triggers automáticos
CREATE OR REPLACE FUNCTION public.trg_raffles_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM raffle_log(NEW.id, 'created',
      jsonb_build_object('title', NEW.title, 'price', NEW.price_per_number, 'total', NEW.total_numbers));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM raffle_log(NEW.id, 'status_changed',
        jsonb_build_object('from', OLD.status, 'to', NEW.status));
    END IF;
    IF NEW.winner_number IS DISTINCT FROM OLD.winner_number THEN
      PERFORM raffle_log(NEW.id, 'winner_drawn',
        jsonb_build_object('number', NEW.winner_number, 'user_id', NEW.winner_user_id, 'lottery_ref', NEW.federal_lottery_ref));
    END IF;
    IF NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.image_url IS DISTINCT FROM OLD.image_url
       OR NEW.price_per_number IS DISTINCT FROM OLD.price_per_number
       OR NEW.total_numbers IS DISTINCT FROM OLD.total_numbers
       OR NEW.draw_date IS DISTINCT FROM OLD.draw_date THEN
      PERFORM raffle_log(NEW.id, 'edited', jsonb_build_object('by', auth.uid()));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS raffles_audit ON public.raffles;
CREATE TRIGGER raffles_audit AFTER INSERT OR UPDATE ON public.raffles
  FOR EACH ROW EXECUTE FUNCTION public.trg_raffles_audit();

CREATE OR REPLACE FUNCTION public.trg_raffle_numbers_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM raffle_log(NEW.raffle_id, 'number_purchased',
      jsonb_build_object('number', NEW.number, 'user_id', NEW.user_id));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM raffle_log(OLD.raffle_id, 'number_removed',
      jsonb_build_object('number', OLD.number, 'user_id', OLD.user_id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS raffle_numbers_audit ON public.raffle_numbers;
CREATE TRIGGER raffle_numbers_audit AFTER INSERT OR DELETE ON public.raffle_numbers
  FOR EACH ROW EXECUTE FUNCTION public.trg_raffle_numbers_audit();

CREATE OR REPLACE FUNCTION public.trg_raffle_prizes_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM raffle_log(NEW.raffle_id, 'prize_added',
      jsonb_build_object('number', NEW.prize_number, 'name', NEW.prize_name));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.delivered IS DISTINCT FROM OLD.delivered AND NEW.delivered THEN
      PERFORM raffle_log(NEW.raffle_id, 'prize_delivered',
        jsonb_build_object('number', NEW.prize_number, 'winner', NEW.winner_user_id));
    END IF;
    IF NEW.winner_user_id IS DISTINCT FROM OLD.winner_user_id AND NEW.winner_user_id IS NOT NULL THEN
      PERFORM raffle_log(NEW.raffle_id, 'prize_won',
        jsonb_build_object('number', NEW.prize_number, 'winner', NEW.winner_user_id));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS raffle_prizes_audit ON public.raffle_prizes;
CREATE TRIGGER raffle_prizes_audit AFTER INSERT OR UPDATE ON public.raffle_prizes
  FOR EACH ROW EXECUTE FUNCTION public.trg_raffle_prizes_audit();

-- Função para o admin ler histórico
CREATE OR REPLACE FUNCTION public.get_raffle_history(p_raffle_id uuid, p_limit int DEFAULT 200)
RETURNS TABLE(id uuid, action text, details jsonb, actor_id uuid, actor_name text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  RETURN QUERY
    SELECT l.id, l.action, l.details, l.actor_id, p.username, l.created_at
    FROM raffle_audit_log l
    LEFT JOIN profiles p ON p.user_id = l.actor_id
    WHERE l.raffle_id = p_raffle_id
    ORDER BY l.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 1000));
END;
$$;

-- =====================================================
-- 3) FILTER OPTION ITEMS (vínculo categoria do filtro -> itens)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.filter_option_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_option_id uuid NOT NULL REFERENCES public.filter_options(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (filter_option_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_filter_option_items_option ON public.filter_option_items (filter_option_id);
CREATE INDEX IF NOT EXISTS idx_filter_option_items_item ON public.filter_option_items (item_id);

ALTER TABLE public.filter_option_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read filter option items"
  ON public.filter_option_items FOR SELECT USING (true);

CREATE POLICY "Admins manage filter option items"
  ON public.filter_option_items FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
