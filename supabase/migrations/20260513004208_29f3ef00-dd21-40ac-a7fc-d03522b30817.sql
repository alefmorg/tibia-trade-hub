CREATE OR REPLACE FUNCTION public.admin_list_profiles_enriched()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  avatar_url text,
  bio text,
  banned boolean,
  vip_until timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  email text,
  last_sign_in_at timestamptz,
  wallet_balance integer,
  ads_count bigint,
  conversations_count bigint,
  offers_sent_count bigint,
  favorites_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.username,
    p.avatar_url,
    p.bio,
    p.banned,
    p.vip_until,
    p.created_at,
    p.updated_at,
    u.email,
    u.last_sign_in_at,
    COALESCE(w.balance, 0) AS wallet_balance,
    COALESCE(a.ads_count, 0) AS ads_count,
    COALESCE(c.conversations_count, 0) AS conversations_count,
    COALESCE(o.offers_sent_count, 0) AS offers_sent_count,
    COALESCE(f.favorites_count, 0) AS favorites_count
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.wallets w ON w.user_id = p.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*)::bigint AS ads_count
    FROM public.ads
    GROUP BY user_id
  ) a ON a.user_id = p.user_id
  LEFT JOIN (
    SELECT participant.user_id, COUNT(DISTINCT participant.conversation_id)::bigint AS conversations_count
    FROM (
      SELECT buyer_id AS user_id, id AS conversation_id FROM public.conversations
      UNION ALL
      SELECT seller_id AS user_id, id AS conversation_id FROM public.conversations
    ) participant
    GROUP BY participant.user_id
  ) c ON c.user_id = p.user_id
  LEFT JOIN (
    SELECT sender_id AS user_id, COUNT(*)::bigint AS offers_sent_count
    FROM public.offers
    GROUP BY sender_id
  ) o ON o.user_id = p.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*)::bigint AS favorites_count
    FROM public.favorites
    GROUP BY user_id
  ) f ON f.user_id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;