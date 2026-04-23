-- Tabela de solicitações de intermédio (escrow/middleman)
CREATE TABLE public.intermediation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy','sell','trade')),
  item_description TEXT NOT NULL,
  estimated_value TEXT,
  contact_info TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected','cancelled')),
  admin_notes TEXT,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.intermediation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own intermediation" ON public.intermediation_requests
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own intermediation" ON public.intermediation_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel own pending" ON public.intermediation_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending','cancelled'));
CREATE POLICY "Admins manage intermediation" ON public.intermediation_requests
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_intermediation_updated
BEFORE UPDATE ON public.intermediation_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de doações
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount_coins INTEGER NOT NULL CHECK (amount_coins > 0),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own donations" ON public.donations
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create donations" ON public.donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage donations" ON public.donations
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- RPC para doar (debita carteira, registra)
CREATE OR REPLACE FUNCTION public.donate_coins(p_amount INTEGER, p_message TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_balance INTEGER;
  v_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT balance INTO v_balance FROM public.wallets WHERE user_id = v_uid FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_amount THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;

  UPDATE public.wallets SET balance = balance - p_amount, updated_at = now() WHERE user_id = v_uid;
  INSERT INTO public.wallet_transactions(user_id, amount, type, reason)
    VALUES (v_uid, -p_amount, 'donation', COALESCE('Doação: ' || p_message, 'Doação'));
  INSERT INTO public.donations(user_id, amount_coins, message) VALUES (v_uid, p_amount, p_message)
    RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;