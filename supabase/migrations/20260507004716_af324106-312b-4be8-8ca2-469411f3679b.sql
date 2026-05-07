CREATE OR REPLACE FUNCTION public.guard_intermediation_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    RAISE EXCEPTION 'Only admins can modify admin_notes';
  END IF;
  IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by THEN
    RAISE EXCEPTION 'Only admins can modify reviewed_by';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_intermediation_privileged_columns_trg ON public.intermediation_requests;
CREATE TRIGGER guard_intermediation_privileged_columns_trg
BEFORE UPDATE ON public.intermediation_requests
FOR EACH ROW
EXECUTE FUNCTION public.guard_intermediation_privileged_columns();