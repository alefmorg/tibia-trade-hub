
-- Wallets table
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert wallets" ON public.wallets FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Admins can update wallets" ON public.wallets FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Wallet transactions
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL DEFAULT 'credit',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Highlight plans (admin configurable)
CREATE TABLE public.highlight_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_coins integer NOT NULL,
  duration_days integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.highlight_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active highlight plans" ON public.highlight_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage highlight plans" ON public.highlight_plans FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Function to add balance and log transaction atomically
CREATE OR REPLACE FUNCTION public.add_balance(p_user_id uuid, p_amount integer, p_reason text DEFAULT null)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO wallets (user_id, balance) VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + p_amount, updated_at = now();
  
  INSERT INTO wallet_transactions (user_id, amount, type, reason)
  VALUES (p_user_id, p_amount, CASE WHEN p_amount >= 0 THEN 'credit' ELSE 'debit' END, p_reason);
END;
$$;

-- Function to spend coins on highlight
CREATE OR REPLACE FUNCTION public.highlight_ad(p_ad_id uuid, p_plan_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid;
  v_plan highlight_plans%ROWTYPE;
  v_balance integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_plan FROM highlight_plans WHERE id = p_plan_id AND active = true;
  IF v_plan IS NULL THEN RAISE EXCEPTION 'Plano não encontrado'; END IF;

  SELECT balance INTO v_balance FROM wallets WHERE user_id = v_user_id;
  IF v_balance IS NULL OR v_balance < v_plan.price_coins THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;

  -- Debit
  UPDATE wallets SET balance = balance - v_plan.price_coins, updated_at = now() WHERE user_id = v_user_id;
  INSERT INTO wallet_transactions (user_id, amount, type, reason) VALUES (v_user_id, -v_plan.price_coins, 'debit', 'Destaque: ' || v_plan.name);

  -- Highlight ad
  UPDATE ads SET featured = true, expires_at = now() + (v_plan.duration_days || ' days')::interval WHERE id = p_ad_id AND user_id = v_user_id;
END;
$$;
