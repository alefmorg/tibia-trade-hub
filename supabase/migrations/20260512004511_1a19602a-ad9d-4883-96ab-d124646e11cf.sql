
-- 1) Restrict sensitive profile columns from public clients
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, username, avatar_url, bio, created_at, updated_at) ON public.profiles TO anon, authenticated;

-- 2) Restrict sensitive raffle_prizes columns from public clients
REVOKE SELECT ON public.raffle_prizes FROM anon, authenticated;
GRANT SELECT (id, raffle_id, prize_number, prize_name, prize_description, delivered, delivered_at, created_at, updated_at) ON public.raffle_prizes TO anon, authenticated;

-- Allow winners to see their own winner_user_id row (and admins via existing ALL policy)
-- Add a SECURITY DEFINER function to fetch winners for admin/winner contexts if needed later.
