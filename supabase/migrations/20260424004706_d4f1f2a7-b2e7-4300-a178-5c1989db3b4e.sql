
DROP VIEW IF EXISTS public.raffle_numbers_public;

CREATE VIEW public.raffle_numbers_public
WITH (security_invoker = true)
AS
SELECT id, raffle_id, number, created_at
FROM public.raffle_numbers;

-- Permitir leitura pública só destes campos (sem user_id)
GRANT SELECT ON public.raffle_numbers_public TO anon, authenticated;

-- Garantir que a tabela base permita leitura pelos roles via view
-- (RLS continua restringindo SELECT direto na tabela)
DROP POLICY IF EXISTS "Anyone can view taken raffle numbers" ON public.raffle_numbers;
CREATE POLICY "Anyone can view taken raffle numbers"
ON public.raffle_numbers
FOR SELECT
TO anon, authenticated
USING (true);

-- A política antiga restritiva continua existindo mas SELECT agora é público
-- (user_id é exposto via tabela direta). Para realmente esconder user_id,
-- removemos a permissividade e mantemos apenas a view pública:
DROP POLICY IF EXISTS "Anyone can view taken raffle numbers" ON public.raffle_numbers;
