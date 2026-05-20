
-- 1. Donations: restrict INSERT to self
DROP POLICY IF EXISTS "Users insert own donations" ON public.donations;
CREATE POLICY "Users insert own donations"
ON public.donations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Messages: restrict UPDATE to only the read flag, no sender/conversation/content changes
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;
CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
TO authenticated
USING (is_conversation_participant(auth.uid(), conversation_id))
WITH CHECK (
  is_conversation_participant(auth.uid(), conversation_id)
  AND sender_id = (SELECT m.sender_id FROM public.messages m WHERE m.id = messages.id)
  AND conversation_id = (SELECT m.conversation_id FROM public.messages m WHERE m.id = messages.id)
  AND content = (SELECT m.content FROM public.messages m WHERE m.id = messages.id)
);

-- (guard_messages_read_only_update trigger already enforces this server-side, but tighten policy too)

-- 3. Profiles: revoke column-level grant exposing banned/vip_until
REVOKE SELECT (banned, vip_until) ON public.profiles FROM authenticated;
REVOKE SELECT (banned, vip_until) ON public.profiles FROM anon;
