-- Hide sensitive profile flags (banned, vip_until) from public reads.
-- Table-level SELECT grant currently overrides column-level revokes,
-- so we revoke the table grant and re-grant only the safe columns.
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;

GRANT SELECT (id, user_id, username, avatar_url, bio, created_at, updated_at)
  ON public.profiles TO anon;
GRANT SELECT (id, user_id, username, avatar_url, bio, created_at, updated_at)
  ON public.profiles TO authenticated;