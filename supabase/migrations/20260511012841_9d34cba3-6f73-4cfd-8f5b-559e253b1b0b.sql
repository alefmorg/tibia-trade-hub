
-- 1) Affiliate links: remove public read; admins only (RPC handles redirects)
DROP POLICY IF EXISTS "Anyone can read active affiliate links" ON public.affiliate_links;

-- 2) Profiles: restrict column-level access so banned/vip_until are not publicly readable
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, username, avatar_url, bio, created_at, updated_at)
  ON public.profiles TO anon, authenticated;

-- Owner needs to read their own banned/vip_until via a function
CREATE OR REPLACE FUNCTION public.get_my_account_flags()
RETURNS TABLE(banned boolean, vip_until timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT banned, vip_until FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Admin listing of profiles (replaces select * from profiles in admin UI)
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
END;
$$;

-- Admin listing of VIP users
CREATE OR REPLACE FUNCTION public.admin_list_vip_users()
RETURNS TABLE(user_id uuid, username text, vip_until timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  RETURN QUERY
    SELECT p.user_id, p.username, p.vip_until
    FROM public.profiles p
    WHERE p.vip_until IS NOT NULL
    ORDER BY p.vip_until DESC
    LIMIT 200;
END;
$$;
