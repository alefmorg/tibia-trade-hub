
-- Helper: check if user is banned
CREATE OR REPLACE FUNCTION public.is_banned(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT banned FROM public.profiles WHERE user_id = _uid), false)
$$;

-- Ads: block banned users from inserting
DROP POLICY IF EXISTS "Users can create own ads" ON public.ads;
CREATE POLICY "Users can create own ads" ON public.ads
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

-- Messages: block banned users from sending
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_conversation_participant(auth.uid(), conversation_id)
    AND NOT public.is_banned(auth.uid())
  );

-- Offers: block banned users from creating
DROP POLICY IF EXISTS "Users can create offers" ON public.offers;
CREATE POLICY "Users can create offers" ON public.offers
  FOR INSERT TO public
  WITH CHECK (auth.uid() = sender_id AND NOT public.is_banned(auth.uid()));

-- Raffle numbers: block banned users from buying
DROP POLICY IF EXISTS "Authenticated users can buy numbers" ON public.raffle_numbers;
CREATE POLICY "Authenticated users can buy numbers" ON public.raffle_numbers
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

-- Conversations: block banned users from creating
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT TO public
  WITH CHECK (auth.uid() = buyer_id AND NOT public.is_banned(auth.uid()));

-- Fix buy_raffle_number to honor sales_blocked
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

  IF public.is_banned(v_user_id) THEN
    RAISE EXCEPTION 'Conta banida';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100 THEN
    RAISE EXCEPTION 'Quantidade inválida';
  END IF;

  SELECT * INTO v_raffle FROM raffles
    WHERE id = p_raffle_id AND status = 'active' AND sales_blocked = false;
  IF v_raffle IS NULL THEN RAISE EXCEPTION 'Rifa não encontrada, inativa ou com vendas pausadas'; END IF;

  v_total_cost := v_raffle.price_per_number * p_quantity;

  SELECT balance INTO v_balance FROM wallets WHERE user_id = v_user_id FOR UPDATE;
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
$function$;
