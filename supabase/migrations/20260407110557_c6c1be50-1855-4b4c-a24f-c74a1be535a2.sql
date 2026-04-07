CREATE POLICY "Admins can view all ads"
ON public.ads
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.delete_ad_cascade(_ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT user_id
  INTO _owner_id
  FROM public.ads
  WHERE id = _ad_id;

  IF _owner_id IS NULL THEN
    RAISE EXCEPTION 'Anúncio não encontrado';
  END IF;

  IF auth.uid() <> _owner_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão para remover este anúncio';
  END IF;

  DELETE FROM public.ads
  WHERE id = _ad_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Falha ao remover anúncio';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_ad_cascade(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_ad_cascade(uuid) TO authenticated;