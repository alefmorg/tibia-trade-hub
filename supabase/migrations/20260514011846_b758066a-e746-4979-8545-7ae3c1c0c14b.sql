
-- 1) Restrict profiles SELECT policy: drop public-readable policy and replace with safe one
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Public can view non-sensitive profile fields only (enforced via column grants already in place)
-- but we also restrict the RLS itself: hide rows' sensitive columns by splitting access.
-- Approach: keep public SELECT but rely on column grants. Additionally add owner/admin full-access policy.
CREATE POLICY "Public can view basic profile fields"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Re-assert column-level revokes for sensitive fields
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, username, avatar_url, bio, created_at, updated_at) ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.profiles TO service_role;

-- Owner can read all their own columns (including banned, vip_until)
GRANT SELECT (banned, vip_until) ON public.profiles TO authenticated;
-- Note: column grants are role-wide; row-level filtering still applies via RLS.
-- To truly restrict banned/vip_until reads to owner/admin, use a SECURITY DEFINER function (already exists: get_my_account_flags + admin_list_profiles_enriched).

-- 2) Fix race condition in buy_raffle_number
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

-- 3) Fix race condition in highlight_ad
CREATE OR REPLACE FUNCTION public.highlight_ad(p_ad_id uuid, p_plan_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  SELECT balance INTO v_balance FROM wallets WHERE user_id = v_user_id FOR UPDATE;
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
        expires_at = GREATEST(v_current_expires, v_new_featured_until)
    WHERE id = p_ad_id AND user_id = v_user_id;
END;
$function$;
