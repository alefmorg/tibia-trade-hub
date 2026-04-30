
-- 1) ADS: featured_until
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS featured_until timestamptz;

-- 2) PROFILES: vip_until
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vip_until timestamptz;

-- 3) TRADE_SETTINGS: campos VIP
ALTER TABLE public.trade_settings
  ADD COLUMN IF NOT EXISTS vip_price_coins integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS vip_duration_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS vip_extra_ad_days integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS vip_max_active_ads integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS normal_max_active_ads integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS vip_free_highlights integer NOT NULL DEFAULT 2;

-- 4) VIP_PURCHASES table
CREATE TABLE IF NOT EXISTS public.vip_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  price_coins integer NOT NULL,
  duration_days integer NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vip_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own vip purchases" ON public.vip_purchases;
CREATE POLICY "Users view own vip purchases" ON public.vip_purchases
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage vip purchases" ON public.vip_purchases;
CREATE POLICY "Admins manage vip purchases" ON public.vip_purchases
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_vip_purchases_user ON public.vip_purchases(user_id);

-- 5) is_vip helper
CREATE OR REPLACE FUNCTION public.is_vip(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND vip_until IS NOT NULL AND vip_until > now()
  )
$$;

-- 6) get ad duration days (considerando VIP)
CREATE OR REPLACE FUNCTION public.get_ad_duration_for_user(_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT ad_duration_days FROM public.trade_settings LIMIT 1), 7)
       + CASE WHEN public.is_vip(_user_id)
              THEN COALESCE((SELECT vip_extra_ad_days FROM public.trade_settings LIMIT 1), 0)
              ELSE 0 END
$$;

-- 7) Atualiza trigger de expiração para considerar VIP
CREATE OR REPLACE FUNCTION public.set_ad_expiration_from_settings()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + make_interval(days => public.get_ad_duration_for_user(NEW.user_id));
  END IF;
  RETURN NEW;
END;
$$;

-- 8) get_user_ad_limit
CREATE OR REPLACE FUNCTION public.get_user_ad_limit(_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE WHEN public.is_vip(_user_id)
              THEN COALESCE((SELECT vip_max_active_ads FROM public.trade_settings LIMIT 1), 30)
              ELSE COALESCE((SELECT normal_max_active_ads FROM public.trade_settings LIMIT 1), 10) END
$$;

-- 9) Trigger para limitar anúncios ativos por usuário (apenas em INSERT, exceto admins)
CREATE OR REPLACE FUNCTION public.enforce_user_ad_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_limit integer;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_count FROM public.ads
    WHERE user_id = NEW.user_id AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now());
  v_limit := public.get_user_ad_limit(NEW.user_id);
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Limite de anúncios ativos atingido (%). Torne-se VIP para aumentar o limite.', v_limit;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_user_ad_limit ON public.ads;
CREATE TRIGGER trg_enforce_user_ad_limit
  BEFORE INSERT ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_ad_limit();

-- 10) Atualiza highlight_ad para usar featured_until separado
CREATE OR REPLACE FUNCTION public.highlight_ad(p_ad_id uuid, p_plan_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_plan highlight_plans%ROWTYPE;
  v_balance integer;
  v_new_featured_until timestamptz;
  v_current_expires timestamptz;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_plan FROM highlight_plans WHERE id = p_plan_id AND active = true;
  IF v_plan IS NULL THEN RAISE EXCEPTION 'Plano não encontrado'; END IF;

  SELECT balance INTO v_balance FROM wallets WHERE user_id = v_user_id;
  IF v_balance IS NULL OR v_balance < v_plan.price_coins THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;

  UPDATE wallets SET balance = balance - v_plan.price_coins, updated_at = now() WHERE user_id = v_user_id;
  INSERT INTO wallet_transactions (user_id, amount, type, reason)
    VALUES (v_user_id, -v_plan.price_coins, 'debit', 'Destaque: ' || v_plan.name);

  v_new_featured_until := now() + (v_plan.duration_days || ' days')::interval;

  SELECT expires_at INTO v_current_expires FROM ads WHERE id = p_ad_id AND user_id = v_user_id;
  IF v_current_expires IS NULL THEN RAISE EXCEPTION 'Anúncio não encontrado'; END IF;

  UPDATE ads
    SET featured = true,
        featured_until = v_new_featured_until,
        -- garante que o anúncio não expire antes do destaque acabar
        expires_at = GREATEST(v_current_expires, v_new_featured_until)
    WHERE id = p_ad_id AND user_id = v_user_id;
END;
$$;

-- 11) Função para expirar destaques (limpa flag featured após featured_until)
CREATE OR REPLACE FUNCTION public.expire_featured_ads()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  WITH u AS (
    UPDATE public.ads
      SET featured = false, featured_until = NULL
      WHERE featured = true AND featured_until IS NOT NULL AND featured_until <= now()
      RETURNING 1
  )
  SELECT count(*) INTO v_count FROM u;
  RETURN v_count;
END;
$$;

-- 12) purchase_vip RPC
CREATE OR REPLACE FUNCTION public.purchase_vip()
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_settings trade_settings%ROWTYPE;
  v_balance integer;
  v_current_until timestamptz;
  v_new_until timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_settings FROM trade_settings LIMIT 1;
  IF v_settings IS NULL THEN RAISE EXCEPTION 'Configurações não encontradas'; END IF;

  SELECT balance INTO v_balance FROM wallets WHERE user_id = v_uid FOR UPDATE;
  IF v_balance IS NULL OR v_balance < v_settings.vip_price_coins THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  UPDATE wallets SET balance = balance - v_settings.vip_price_coins, updated_at = now() WHERE user_id = v_uid;
  INSERT INTO wallet_transactions (user_id, amount, type, reason)
    VALUES (v_uid, -v_settings.vip_price_coins, 'debit', 'Compra VIP (' || v_settings.vip_duration_days || ' dias)');

  -- Estende a partir do vip_until atual se ainda válido
  SELECT vip_until INTO v_current_until FROM profiles WHERE user_id = v_uid;
  v_new_until := GREATEST(COALESCE(v_current_until, now()), now()) + (v_settings.vip_duration_days || ' days')::interval;

  UPDATE profiles SET vip_until = v_new_until, updated_at = now() WHERE user_id = v_uid;

  INSERT INTO vip_purchases (user_id, price_coins, duration_days, expires_at)
    VALUES (v_uid, v_settings.vip_price_coins, v_settings.vip_duration_days, v_new_until);

  INSERT INTO notifications (user_id, title, message)
    VALUES (v_uid, '👑 VIP ativado!', 'Você é VIP até ' || to_char(v_new_until, 'DD/MM/YYYY HH24:MI') || '.');

  RETURN v_new_until;
END;
$$;

-- 13) Admin: definir VIP manualmente
CREATE OR REPLACE FUNCTION public.admin_set_vip(p_user_id uuid, p_until timestamptz)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  UPDATE profiles SET vip_until = p_until, updated_at = now() WHERE user_id = p_user_id;
END;
$$;

-- 14) Permissions
REVOKE EXECUTE ON FUNCTION public.expire_featured_ads() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enforce_user_ad_limit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_vip(uuid, timestamptz) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.purchase_vip() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_vip(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_ad_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ad_duration_for_user(uuid) TO authenticated;

-- 15) Backfill: define featured_until para anúncios já destacados (usa expires_at atual)
UPDATE public.ads SET featured_until = expires_at WHERE featured = true AND featured_until IS NULL;
