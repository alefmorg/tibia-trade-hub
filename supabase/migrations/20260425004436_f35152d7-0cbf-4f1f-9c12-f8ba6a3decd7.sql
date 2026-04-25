-- ============================================
-- 1. RAFFLE PRIZES TABLE (mini prêmios)
-- ============================================
CREATE TABLE IF NOT EXISTS public.raffle_prizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  prize_number INTEGER NOT NULL,
  prize_name TEXT NOT NULL,
  prize_description TEXT,
  winner_user_id UUID,
  delivered BOOLEAN NOT NULL DEFAULT false,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(raffle_id, prize_number)
);

ALTER TABLE public.raffle_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view raffle prizes"
ON public.raffle_prizes FOR SELECT
USING (true);

CREATE POLICY "Admins manage raffle prizes"
ON public.raffle_prizes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_raffle_prizes_updated_at
BEFORE UPDATE ON public.raffle_prizes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_raffle_prizes_raffle ON public.raffle_prizes(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_prizes_winner ON public.raffle_prizes(winner_user_id);

-- ============================================
-- 2. NOTIFY ADMINS HELPER (broadcast notification)
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_admins(p_title TEXT, p_message TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_rec RECORD;
BEGIN
  FOR admin_rec IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (admin_rec.user_id, p_title, p_message);
  END LOOP;
END;
$$;

-- ============================================
-- 3. CLAIM RAFFLE PRIZE (instant win)
-- Marca prêmio como ganho ao comprar número
-- ============================================
CREATE OR REPLACE FUNCTION public.claim_raffle_prize(p_raffle_id UUID, p_user_id UUID, p_number INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prize raffle_prizes%ROWTYPE;
  v_user_name TEXT;
BEGIN
  SELECT * INTO v_prize FROM raffle_prizes
  WHERE raffle_id = p_raffle_id AND prize_number = p_number AND winner_user_id IS NULL;

  IF v_prize.id IS NULL THEN RETURN; END IF;

  UPDATE raffle_prizes SET winner_user_id = p_user_id, updated_at = now()
  WHERE id = v_prize.id;

  INSERT INTO notifications (user_id, title, message)
  VALUES (p_user_id, '🎁 Você ganhou um prêmio!',
          'Parabéns! O número ' || p_number || ' premiou você com: ' || v_prize.prize_name || '. Aguarde a entrega.');

  SELECT username INTO v_user_name FROM profiles WHERE user_id = p_user_id;
  PERFORM notify_admins(
    '🎁 Novo prêmio de rifa para entregar',
    'Usuário ' || COALESCE(v_user_name, p_user_id::text) || ' ganhou "' || v_prize.prize_name || '" (número ' || p_number || ').'
  );
END;
$$;

-- ============================================
-- 4. BUY RAFFLE NUMBER (atualizado: dispara prêmios)
-- ============================================
CREATE OR REPLACE FUNCTION public.buy_raffle_number(p_raffle_id uuid, p_quantity integer DEFAULT 1)
RETURNS integer[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_raffle raffles%ROWTYPE;
  v_balance integer;
  v_total_cost integer;
  v_available integer[];
  v_picked integer[];
  v_num integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100 THEN
    RAISE EXCEPTION 'Quantidade inválida';
  END IF;

  SELECT * INTO v_raffle FROM raffles WHERE id = p_raffle_id AND status = 'active';
  IF v_raffle IS NULL THEN RAISE EXCEPTION 'Rifa não encontrada ou inativa'; END IF;

  v_total_cost := v_raffle.price_per_number * p_quantity;

  SELECT balance INTO v_balance FROM wallets WHERE user_id = v_user_id;
  IF v_balance IS NULL OR v_balance < v_total_cost THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;

  SELECT array_agg(n) INTO v_available
  FROM generate_series(1, v_raffle.total_numbers) AS n
  WHERE n NOT IN (SELECT number FROM raffle_numbers WHERE raffle_id = p_raffle_id);

  IF v_available IS NULL OR array_length(v_available, 1) < p_quantity THEN
    RAISE EXCEPTION 'Números insuficientes disponíveis';
  END IF;

  v_available := ARRAY(SELECT unnest(v_available) ORDER BY random());
  v_picked := v_available[1:p_quantity];

  UPDATE wallets SET balance = balance - v_total_cost, updated_at = now() WHERE user_id = v_user_id;
  INSERT INTO wallet_transactions (user_id, amount, type, reason)
    VALUES (v_user_id, -v_total_cost, 'debit', 'Rifa: ' || v_raffle.title || ' (' || p_quantity || ' números)');

  FOREACH v_num IN ARRAY v_picked LOOP
    INSERT INTO raffle_numbers (raffle_id, user_id, number) VALUES (p_raffle_id, v_user_id, v_num);
    PERFORM claim_raffle_prize(p_raffle_id, v_user_id, v_num);
  END LOOP;

  RETURN v_picked;
END;
$$;

-- ============================================
-- 5. DRAW RAFFLE WINNER (admin informa nº loteria)
-- ============================================
CREATE OR REPLACE FUNCTION public.draw_raffle_winner(p_raffle_id UUID, p_winner_number INTEGER, p_lottery_ref TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_raffle raffles%ROWTYPE;
  v_winner_id UUID;
  v_winner_name TEXT;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT * INTO v_raffle FROM raffles WHERE id = p_raffle_id;
  IF v_raffle.id IS NULL THEN RAISE EXCEPTION 'Rifa não encontrada'; END IF;

  IF p_winner_number < 1 OR p_winner_number > v_raffle.total_numbers THEN
    RAISE EXCEPTION 'Número fora do intervalo da rifa';
  END IF;

  SELECT user_id INTO v_winner_id FROM raffle_numbers
  WHERE raffle_id = p_raffle_id AND number = p_winner_number;

  UPDATE raffles SET
    winner_number = p_winner_number,
    winner_user_id = v_winner_id,
    federal_lottery_ref = COALESCE(p_lottery_ref, federal_lottery_ref),
    status = 'finished',
    updated_at = now()
  WHERE id = p_raffle_id;

  IF v_winner_id IS NOT NULL THEN
    SELECT username INTO v_winner_name FROM profiles WHERE user_id = v_winner_id;
    INSERT INTO notifications (user_id, title, message)
    VALUES (v_winner_id, '🏆 Você ganhou a rifa!',
            'Parabéns! Você é o ganhador da rifa "' || v_raffle.title || '" com o número ' || p_winner_number || '.');
    PERFORM notify_admins(
      '🏆 Rifa finalizada com vencedor',
      'Rifa "' || v_raffle.title || '" - vencedor: ' || COALESCE(v_winner_name, v_winner_id::text) || ' (nº ' || p_winner_number || ').'
    );
  ELSE
    PERFORM notify_admins(
      '⚠️ Rifa finalizada sem vencedor',
      'Rifa "' || v_raffle.title || '" finalizada com número ' || p_winner_number || ', mas ninguém comprou esse número.'
    );
  END IF;

  RETURN v_winner_id;
END;
$$;

-- ============================================
-- 6. ADMIN BULK DELETE (limpeza em massa)
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_bulk_delete(p_target TEXT, p_older_than_days INTEGER DEFAULT 0)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER := 0;
  v_cutoff TIMESTAMPTZ;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  v_cutoff := now() - make_interval(days => GREATEST(p_older_than_days, 0));

  CASE p_target
    WHEN 'messages' THEN
      WITH d AS (DELETE FROM messages WHERE created_at < v_cutoff RETURNING 1)
      SELECT count(*) INTO v_count FROM d;
    WHEN 'conversations' THEN
      WITH d AS (DELETE FROM conversations WHERE updated_at < v_cutoff RETURNING 1)
      SELECT count(*) INTO v_count FROM d;
    WHEN 'offers' THEN
      WITH d AS (DELETE FROM offers WHERE created_at < v_cutoff RETURNING 1)
      SELECT count(*) INTO v_count FROM d;
    WHEN 'expired_ads' THEN
      WITH d AS (DELETE FROM ads WHERE expires_at IS NOT NULL AND expires_at < v_cutoff RETURNING 1)
      SELECT count(*) INTO v_count FROM d;
    WHEN 'notifications' THEN
      WITH d AS (DELETE FROM notifications WHERE created_at < v_cutoff RETURNING 1)
      SELECT count(*) INTO v_count FROM d;
    WHEN 'wallet_transactions' THEN
      WITH d AS (DELETE FROM wallet_transactions WHERE created_at < v_cutoff RETURNING 1)
      SELECT count(*) INTO v_count FROM d;
    WHEN 'deposits_old' THEN
      WITH d AS (DELETE FROM deposit_requests WHERE status IN ('approved','rejected') AND updated_at < v_cutoff RETURNING 1)
      SELECT count(*) INTO v_count FROM d;
    WHEN 'support_closed' THEN
      WITH d AS (DELETE FROM support_tickets WHERE status = 'closed' AND updated_at < v_cutoff RETURNING 1)
      SELECT count(*) INTO v_count FROM d;
    ELSE
      RAISE EXCEPTION 'Alvo de limpeza inválido: %', p_target;
  END CASE;

  RETURN v_count;
END;
$$;

-- ============================================
-- 7. ADMIN STATS (dashboard tempo real)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT jsonb_build_object(
    'users_total', (SELECT count(*) FROM profiles),
    'users_today', (SELECT count(*) FROM profiles WHERE created_at >= now() - interval '24 hours'),
    'users_week', (SELECT count(*) FROM profiles WHERE created_at >= now() - interval '7 days'),
    'users_banned', (SELECT count(*) FROM profiles WHERE banned = true),
    'ads_total', (SELECT count(*) FROM ads),
    'ads_active', (SELECT count(*) FROM ads WHERE status = 'active'),
    'ads_today', (SELECT count(*) FROM ads WHERE created_at >= now() - interval '24 hours'),
    'ads_featured', (SELECT count(*) FROM ads WHERE featured = true),
    'offers_total', (SELECT count(*) FROM offers),
    'offers_pending', (SELECT count(*) FROM offers WHERE status = 'pending'),
    'conversations_total', (SELECT count(*) FROM conversations),
    'messages_today', (SELECT count(*) FROM messages WHERE created_at >= now() - interval '24 hours'),
    'messages_total', (SELECT count(*) FROM messages),
    'deposits_pending', (SELECT count(*) FROM deposit_requests WHERE status = 'pending'),
    'deposits_approved_total', (SELECT COALESCE(sum(amount_coins), 0) FROM deposit_requests WHERE status = 'approved'),
    'coins_in_circulation', (SELECT COALESCE(sum(balance), 0) FROM wallets),
    'coins_donated', (SELECT COALESCE(sum(amount_coins), 0) FROM donations),
    'tickets_open', (SELECT count(*) FROM support_tickets WHERE status = 'open'),
    'raffles_active', (SELECT count(*) FROM raffles WHERE status = 'active'),
    'signup_chart', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb)
      FROM (
        SELECT to_char(date_trunc('day', created_at), 'DD/MM') AS day,
               count(*) AS cnt
        FROM profiles
        WHERE created_at >= now() - interval '14 days'
        GROUP BY date_trunc('day', created_at)
      ) s
    ),
    'ads_chart', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb)
      FROM (
        SELECT to_char(date_trunc('day', created_at), 'DD/MM') AS day,
               count(*) AS cnt
        FROM ads
        WHERE created_at >= now() - interval '14 days'
        GROUP BY date_trunc('day', created_at)
      ) s
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;