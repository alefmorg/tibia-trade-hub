
-- Add deposit config to trade_settings
ALTER TABLE public.trade_settings 
  ADD COLUMN IF NOT EXISTS deposit_char_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS gold_to_coins_rate numeric DEFAULT 1;

-- Deposit requests
CREATE TABLE public.deposit_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount_gold integer NOT NULL,
  amount_coins integer NOT NULL,
  screenshot_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create deposit requests" ON public.deposit_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own deposit requests" ON public.deposit_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage deposit requests" ON public.deposit_requests
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Raffles
CREATE TABLE public.raffles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  image_url text,
  price_per_number integer NOT NULL,
  total_numbers integer NOT NULL DEFAULT 100,
  draw_date timestamptz,
  status text NOT NULL DEFAULT 'active',
  winner_number integer,
  winner_user_id uuid,
  federal_lottery_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view raffles" ON public.raffles
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage raffles" ON public.raffles
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Raffle numbers
CREATE TABLE public.raffle_numbers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raffle_id uuid NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  number integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(raffle_id, number)
);

ALTER TABLE public.raffle_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view raffle numbers" ON public.raffle_numbers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can buy numbers" ON public.raffle_numbers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage raffle numbers" ON public.raffle_numbers
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Storage bucket for deposit screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('deposit-screenshots', 'deposit-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload deposit screenshots" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'deposit-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view deposit screenshots" ON storage.objects
  FOR SELECT USING (bucket_id = 'deposit-screenshots');

-- Function to buy raffle number (deducts coins)
CREATE OR REPLACE FUNCTION public.buy_raffle_number(p_raffle_id uuid, p_quantity integer DEFAULT 1)
RETURNS integer[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  SELECT * INTO v_raffle FROM raffles WHERE id = p_raffle_id AND status = 'active';
  IF v_raffle IS NULL THEN RAISE EXCEPTION 'Rifa não encontrada ou inativa'; END IF;

  v_total_cost := v_raffle.price_per_number * p_quantity;

  SELECT balance INTO v_balance FROM wallets WHERE user_id = v_user_id;
  IF v_balance IS NULL OR v_balance < v_total_cost THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;

  -- Get available numbers
  SELECT array_agg(n) INTO v_available
  FROM generate_series(1, v_raffle.total_numbers) AS n
  WHERE n NOT IN (SELECT number FROM raffle_numbers WHERE raffle_id = p_raffle_id);

  IF v_available IS NULL OR array_length(v_available, 1) < p_quantity THEN
    RAISE EXCEPTION 'Números insuficientes disponíveis';
  END IF;

  -- Shuffle and pick
  v_available := ARRAY(SELECT unnest(v_available) ORDER BY random());
  v_picked := v_available[1:p_quantity];

  -- Debit
  UPDATE wallets SET balance = balance - v_total_cost, updated_at = now() WHERE user_id = v_user_id;
  INSERT INTO wallet_transactions (user_id, amount, type, reason)
    VALUES (v_user_id, -v_total_cost, 'debit', 'Rifa: ' || v_raffle.title || ' (' || p_quantity || ' números)');

  -- Insert numbers
  FOREACH v_num IN ARRAY v_picked LOOP
    INSERT INTO raffle_numbers (raffle_id, user_id, number) VALUES (p_raffle_id, v_user_id, v_num);
  END LOOP;

  RETURN v_picked;
END;
$$;

-- Function to approve deposit
CREATE OR REPLACE FUNCTION public.approve_deposit(p_deposit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposit deposit_requests%ROWTYPE;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  SELECT * INTO v_deposit FROM deposit_requests WHERE id = p_deposit_id AND status = 'pending';
  IF v_deposit IS NULL THEN RAISE EXCEPTION 'Depósito não encontrado ou já processado'; END IF;

  UPDATE deposit_requests SET status = 'approved', reviewed_by = auth.uid(), updated_at = now() WHERE id = p_deposit_id;

  PERFORM add_balance(v_deposit.user_id, v_deposit.amount_coins, 'Depósito aprovado: ' || v_deposit.amount_gold || ' gold');
END;
$$;
