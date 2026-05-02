DROP POLICY IF EXISTS "Participants send ticket messages" ON public.support_ticket_messages;

CREATE POLICY "Participants send ticket messages"
  ON public.support_ticket_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_ticket_participant(ticket_id, auth.uid())
    AND (is_admin = false OR public.has_role(auth.uid(), 'admin'::app_role))
  );