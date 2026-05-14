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
  FROM public.profiles AS p
  LEFT JOIN auth.users AS u ON u.id = p.user_id
  LEFT JOIN public.wallets AS w ON w.user_id = p.user_id
  LEFT JOIN (
    SELECT ads.user_id AS profile_user_id, COUNT(*)::bigint AS ads_count
    FROM public.ads AS ads
    GROUP BY ads.user_id
  ) AS a ON a.profile_user_id = p.user_id
  LEFT JOIN (
    SELECT participant.profile_user_id, COUNT(DISTINCT participant.conversation_id)::bigint AS conversations_count
    FROM (
      SELECT conversations.buyer_id AS profile_user_id, conversations.id AS conversation_id FROM public.conversations AS conversations
      UNION ALL
      SELECT conversations.seller_id AS profile_user_id, conversations.id AS conversation_id FROM public.conversations AS conversations
    ) AS participant
    GROUP BY participant.profile_user_id
  ) AS c ON c.profile_user_id = p.user_id
  LEFT JOIN (
    SELECT offers.sender_id AS profile_user_id, COUNT(*)::bigint AS offers_sent_count
    FROM public.offers AS offers
    GROUP BY offers.sender_id
  ) AS o ON o.profile_user_id = p.user_id
  LEFT JOIN (
    SELECT favorites.user_id AS profile_user_id, COUNT(*)::bigint AS favorites_count
    FROM public.favorites AS favorites
    GROUP BY favorites.user_id
  ) AS f ON f.profile_user_id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;