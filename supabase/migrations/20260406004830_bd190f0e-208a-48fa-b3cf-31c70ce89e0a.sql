CREATE POLICY "Participants and admins can delete conversations"
ON public.conversations
FOR DELETE
USING (
  auth.uid() = buyer_id
  OR auth.uid() = seller_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Participants and admins can delete messages"
ON public.messages
FOR DELETE
USING (
  public.is_conversation_participant(auth.uid(), conversation_id)
  OR public.has_role(auth.uid(), 'admin')
);