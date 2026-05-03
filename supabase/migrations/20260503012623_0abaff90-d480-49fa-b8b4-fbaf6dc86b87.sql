
-- ============= AUDIT LOG =============
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);
CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log (admin_id);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log (action);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No INSERT/UPDATE/DELETE policies = only SECURITY DEFINER functions can write

-- Helper: log admin action
CREATE OR REPLACE FUNCTION public.admin_log(
  p_action text, p_target_type text, p_target_id text, p_details jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, COALESCE(p_details, '{}'::jsonb));
END;
$$;

-- ============= RESETS =============

-- Reset all wallets to 0
CREATE OR REPLACE FUNCTION public.admin_reset_all_wallets()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total_users int;
  v_total_coins bigint;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  SELECT count(*), COALESCE(sum(balance),0) INTO v_total_users, v_total_coins
  FROM wallets WHERE balance <> 0;

  -- record debit transaction for each non-zero wallet
  INSERT INTO wallet_transactions (user_id, amount, type, reason)
  SELECT user_id, -balance, 'debit', 'Reset global de carteiras pelo admin'
  FROM wallets WHERE balance <> 0;

  -- notify affected users
  INSERT INTO notifications (user_id, title, message)
  SELECT user_id, 'Saldo zerado',
         'Sua carteira foi zerada por um administrador como parte de uma operação global.'
  FROM wallets WHERE balance <> 0;

  UPDATE wallets SET balance = 0, updated_at = now() WHERE balance <> 0;

  PERFORM admin_log('reset_all_wallets', 'wallets', NULL,
    jsonb_build_object('users_affected', v_total_users, 'coins_zeroed', v_total_coins));

  RETURN jsonb_build_object('users_affected', v_total_users, 'coins_zeroed', v_total_coins);
END;
$$;

-- Reset all conversations + messages
CREATE OR REPLACE FUNCTION public.admin_reset_all_conversations()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_msgs int; v_convs int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  WITH d AS (DELETE FROM messages RETURNING 1) SELECT count(*) INTO v_msgs FROM d;
  WITH d AS (DELETE FROM conversations RETURNING 1) SELECT count(*) INTO v_convs FROM d;

  PERFORM admin_log('reset_all_conversations', 'conversations', NULL,
    jsonb_build_object('messages_deleted', v_msgs, 'conversations_deleted', v_convs));

  RETURN jsonb_build_object('messages_deleted', v_msgs, 'conversations_deleted', v_convs);
END;
$$;

-- Reset all favorites + likes
CREATE OR REPLACE FUNCTION public.admin_reset_all_favorites()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_favs int; v_ads int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  WITH d AS (DELETE FROM favorites RETURNING 1) SELECT count(*) INTO v_favs FROM d;
  WITH u AS (UPDATE ads SET likes_count = 0 WHERE likes_count <> 0 RETURNING 1)
    SELECT count(*) INTO v_ads FROM u;

  PERFORM admin_log('reset_all_favorites', 'favorites', NULL,
    jsonb_build_object('favorites_deleted', v_favs, 'ads_reset', v_ads));

  RETURN jsonb_build_object('favorites_deleted', v_favs, 'ads_reset', v_ads);
END;
$$;

-- Set exact balance for a user
CREATE OR REPLACE FUNCTION public.admin_set_user_balance(p_user_id uuid, p_target int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current int;
  v_delta int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF p_target < 0 THEN RAISE EXCEPTION 'Saldo não pode ser negativo'; END IF;

  SELECT balance INTO v_current FROM wallets WHERE user_id = p_user_id;
  IF v_current IS NULL THEN
    INSERT INTO wallets (user_id, balance) VALUES (p_user_id, p_target);
    v_current := 0;
  ELSE
    UPDATE wallets SET balance = p_target, updated_at = now() WHERE user_id = p_user_id;
  END IF;

  v_delta := p_target - v_current;
  IF v_delta <> 0 THEN
    INSERT INTO wallet_transactions (user_id, amount, type, reason)
    VALUES (p_user_id, v_delta, CASE WHEN v_delta >= 0 THEN 'credit' ELSE 'debit' END,
            'Ajuste manual: saldo definido para ' || p_target);
  END IF;

  PERFORM admin_log('set_user_balance', 'user', p_user_id::text,
    jsonb_build_object('previous', v_current, 'new', p_target, 'delta', v_delta));

  RETURN jsonb_build_object('previous', v_current, 'new', p_target, 'delta', v_delta);
END;
$$;

-- Grant raffle numbers manually (no charge)
CREATE OR REPLACE FUNCTION public.admin_grant_raffle_numbers(
  p_raffle_id uuid, p_user_id uuid, p_quantity int, p_specific_numbers int[] DEFAULT NULL
)
RETURNS int[]
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_raffle raffles%ROWTYPE;
  v_available int[];
  v_picked int[];
  v_num int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  SELECT * INTO v_raffle FROM raffles WHERE id = p_raffle_id;
  IF v_raffle.id IS NULL THEN RAISE EXCEPTION 'Rifa não encontrada'; END IF;

  IF p_specific_numbers IS NOT NULL AND array_length(p_specific_numbers, 1) > 0 THEN
    -- validate range and availability
    SELECT array_agg(n) INTO v_picked
    FROM unnest(p_specific_numbers) n
    WHERE n BETWEEN 1 AND v_raffle.total_numbers
      AND n NOT IN (SELECT number FROM raffle_numbers WHERE raffle_id = p_raffle_id);
    IF v_picked IS NULL OR array_length(v_picked,1) <> array_length(p_specific_numbers,1) THEN
      RAISE EXCEPTION 'Alguns números são inválidos ou já foram comprados';
    END IF;
  ELSE
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100 THEN
      RAISE EXCEPTION 'Quantidade inválida (1-100)';
    END IF;
    SELECT array_agg(n) INTO v_available
      FROM generate_series(1, v_raffle.total_numbers) n
      WHERE n NOT IN (SELECT number FROM raffle_numbers WHERE raffle_id = p_raffle_id);
    IF v_available IS NULL OR array_length(v_available,1) < p_quantity THEN
      RAISE EXCEPTION 'Números insuficientes disponíveis';
    END IF;
    v_available := ARRAY(SELECT unnest(v_available) ORDER BY random());
    v_picked := v_available[1:p_quantity];
  END IF;

  FOREACH v_num IN ARRAY v_picked LOOP
    INSERT INTO raffle_numbers (raffle_id, user_id, number) VALUES (p_raffle_id, p_user_id, v_num);
    PERFORM claim_raffle_prize(p_raffle_id, p_user_id, v_num);
  END LOOP;

  INSERT INTO notifications (user_id, title, message)
  VALUES (p_user_id, '🎟️ Você ganhou números na rifa!',
          'Um administrador te concedeu ' || array_length(v_picked,1) || ' número(s) na rifa "' || v_raffle.title || '".');

  PERFORM admin_log('grant_raffle_numbers', 'raffle', p_raffle_id::text,
    jsonb_build_object('user_id', p_user_id, 'numbers', v_picked));

  RETURN v_picked;
END;
$$;

-- Refund a buyer in a raffle (delete their numbers + return coins)
CREATE OR REPLACE FUNCTION public.admin_refund_raffle_user(p_raffle_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_raffle raffles%ROWTYPE;
  v_count int;
  v_refund int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  SELECT * INTO v_raffle FROM raffles WHERE id = p_raffle_id;
  IF v_raffle.id IS NULL THEN RAISE EXCEPTION 'Rifa não encontrada'; END IF;

  SELECT count(*) INTO v_count FROM raffle_numbers
    WHERE raffle_id = p_raffle_id AND user_id = p_user_id;
  IF v_count = 0 THEN RAISE EXCEPTION 'Usuário não tem números nesta rifa'; END IF;

  v_refund := v_count * v_raffle.price_per_number;

  -- release any prizes won by this user in this raffle
  UPDATE raffle_prizes SET winner_user_id = NULL, updated_at = now()
    WHERE raffle_id = p_raffle_id AND winner_user_id = p_user_id AND delivered = false;

  DELETE FROM raffle_numbers WHERE raffle_id = p_raffle_id AND user_id = p_user_id;

  INSERT INTO wallets (user_id, balance) VALUES (p_user_id, v_refund)
    ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + v_refund, updated_at = now();
  INSERT INTO wallet_transactions (user_id, amount, type, reason)
    VALUES (p_user_id, v_refund, 'credit', 'Reembolso rifa: ' || v_raffle.title);

  INSERT INTO notifications (user_id, title, message)
  VALUES (p_user_id, '💰 Reembolso de rifa',
          'Seus ' || v_count || ' número(s) na rifa "' || v_raffle.title || '" foram reembolsados (' || v_refund || ' coins).');

  PERFORM admin_log('refund_raffle_user', 'raffle', p_raffle_id::text,
    jsonb_build_object('user_id', p_user_id, 'numbers_removed', v_count, 'coins_refunded', v_refund));

  RETURN jsonb_build_object('numbers_removed', v_count, 'coins_refunded', v_refund);
END;
$$;
