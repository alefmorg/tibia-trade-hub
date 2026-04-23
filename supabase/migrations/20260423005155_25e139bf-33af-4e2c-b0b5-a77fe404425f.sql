-- 1) add_balance: require admin + revoke public execute
CREATE OR REPLACE FUNCTION public.add_balance(p_user_id uuid, p_amount integer, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  INSERT INTO wallets (user_id, balance) VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + p_amount, updated_at = now();

  INSERT INTO wallet_transactions (user_id, amount, type, reason)
  VALUES (p_user_id, p_amount, CASE WHEN p_amount >= 0 THEN 'credit' ELSE 'debit' END, p_reason);
END;
$function$;

REVOKE ALL ON FUNCTION public.add_balance(uuid, integer, text) FROM PUBLIC, anon, authenticated;

-- 2) buy_raffle_number: validate positive quantity
CREATE OR REPLACE FUNCTION public.buy_raffle_number(p_raffle_id uuid, p_quantity integer DEFAULT 1)
 RETURNS integer[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  END LOOP;

  RETURN v_picked;
END;
$function$;

-- 3) Lock down deposit-screenshots bucket
UPDATE storage.buckets SET public = false WHERE id = 'deposit-screenshots';

DROP POLICY IF EXISTS "Anyone can view deposit screenshots" ON storage.objects;

CREATE POLICY "Owners can view own deposit screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'deposit-screenshots'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all deposit screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'deposit-screenshots'
    AND public.has_role(auth.uid(), 'admin')
  );

-- 4) Notifications: restrict UPDATE to own rows only
DROP POLICY IF EXISTS "Users can mark notifications as read" ON public.notifications;

CREATE POLICY "Users can mark own notifications as read"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());