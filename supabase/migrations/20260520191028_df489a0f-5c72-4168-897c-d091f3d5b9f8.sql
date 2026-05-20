
-- Reaffirm column-level restriction on sensitive profile columns
REVOKE SELECT (banned, vip_until) ON public.profiles FROM anon, authenticated, PUBLIC;

-- Ensure safe columns remain readable
GRANT SELECT (id, user_id, username, avatar_url, bio, created_at, updated_at)
  ON public.profiles TO anon, authenticated;

-- Helper function (idempotent) to reassert the column privileges
CREATE OR REPLACE FUNCTION public.enforce_profiles_column_privileges()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Re-revoke sensitive columns from public roles in case a prior DDL granted them
  EXECUTE 'REVOKE SELECT (banned, vip_until) ON public.profiles FROM anon, authenticated, PUBLIC';
  EXECUTE 'GRANT SELECT (id, user_id, username, avatar_url, bio, created_at, updated_at) ON public.profiles TO anon, authenticated';
EXCEPTION WHEN OTHERS THEN
  -- Never block DDL; just log
  RAISE NOTICE 'enforce_profiles_column_privileges skipped: %', SQLERRM;
END;
$$;

-- Drop pre-existing trigger if any
DROP EVENT TRIGGER IF EXISTS trg_enforce_profiles_column_privileges;

-- Reapply after any DDL that may affect privileges on public.profiles
CREATE EVENT TRIGGER trg_enforce_profiles_column_privileges
ON ddl_command_end
WHEN TAG IN ('GRANT', 'REVOKE', 'ALTER TABLE', 'CREATE TABLE', 'CREATE POLICY', 'ALTER POLICY')
EXECUTE FUNCTION public.enforce_profiles_column_privileges();

COMMENT ON COLUMN public.profiles.banned IS 'Sensitive: not exposed via PostgREST. Accessible only via get_my_account_flags() and admin RPCs.';
COMMENT ON COLUMN public.profiles.vip_until IS 'Sensitive: not exposed via PostgREST. Accessible only via get_my_account_flags() and admin RPCs.';
