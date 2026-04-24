
-- 1) OFFERS: restringir update do dono do anúncio apenas ao campo status
DROP POLICY IF EXISTS "Ad owners can update offer status" ON public.offers;

CREATE OR REPLACE FUNCTION public.guard_offers_owner_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- admin bypass
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- sender pode editar livremente as próprias ofertas pendentes (já coberto por outras policies se existirem)
  IF auth.uid() = OLD.sender_id THEN
    RETURN NEW;
  END IF;

  -- ad owner: somente status pode mudar
  IF EXISTS (SELECT 1 FROM public.ads WHERE id = OLD.ad_id AND user_id = auth.uid()) THEN
    IF NEW.amount IS DISTINCT FROM OLD.amount
       OR NEW.currency IS DISTINCT FROM OLD.currency
       OR NEW.message IS DISTINCT FROM OLD.message
       OR NEW.ad_id IS DISTINCT FROM OLD.ad_id
       OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Dono do anúncio só pode alterar o status da oferta';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Sem permissão para atualizar esta oferta';
END;
$$;

DROP TRIGGER IF EXISTS guard_offers_owner_update_trg ON public.offers;
CREATE TRIGGER guard_offers_owner_update_trg
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.guard_offers_owner_update();

CREATE POLICY "Ad owners can update offer status"
ON public.offers
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = offers.ad_id AND ads.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = offers.ad_id AND ads.user_id = auth.uid()));

-- 2) MESSAGES: restringir update apenas ao campo read
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;

CREATE OR REPLACE FUNCTION public.guard_messages_read_only_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;

  IF NEW.content IS DISTINCT FROM OLD.content
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Apenas o status de leitura pode ser alterado';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_messages_read_only_update_trg ON public.messages;
CREATE TRIGGER guard_messages_read_only_update_trg
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_messages_read_only_update();

CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
TO authenticated
USING (public.is_conversation_participant(auth.uid(), conversation_id))
WITH CHECK (public.is_conversation_participant(auth.uid(), conversation_id));

-- 3) REALTIME: substituir canal global por canal por-usuário
DROP POLICY IF EXISTS "Authenticated can read realtime messages for own convos" ON realtime.messages;

CREATE POLICY "Authenticated can read realtime messages for own convos"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- canal por usuário: unread-<uid>
  realtime.topic() = ('unread-' || auth.uid()::text)
  OR (
    realtime.topic() LIKE 'messages-%'
    AND public.is_conversation_participant(
      auth.uid(),
      (substring(realtime.topic(), 'messages-(.*)'))::uuid
    )
  )
);

-- 4) RAFFLE_NUMBERS: visão pública só dos números (sem user_id) via view segura
CREATE OR REPLACE VIEW public.raffle_numbers_public AS
SELECT id, raffle_id, number, created_at
FROM public.raffle_numbers;

GRANT SELECT ON public.raffle_numbers_public TO anon, authenticated;
