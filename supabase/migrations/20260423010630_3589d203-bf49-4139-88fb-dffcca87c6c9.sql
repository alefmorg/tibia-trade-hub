-- 1) Raffle numbers: restrict public exposure of user_id
DROP POLICY IF EXISTS "Anyone can view raffle numbers" ON public.raffle_numbers;

CREATE POLICY "Users can view own raffle numbers"
ON public.raffle_numbers
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 2) Storage: explicit UPDATE/DELETE owner-scoped policies for deposit-screenshots
DROP POLICY IF EXISTS "Owners can update own deposit screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete own deposit screenshots" ON storage.objects;

CREATE POLICY "Owners can update own deposit screenshots"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'deposit-screenshots'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'deposit-screenshots'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can delete own deposit screenshots"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'deposit-screenshots'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3) Defense-in-depth on user_roles: block non-admins from self-inserting/updating roles
-- Recreate INSERT/UPDATE policies tightly bound to admin role check; deny anonymous entirely
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

CREATE POLICY "Only admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4) Realtime channel authorization for messages
-- Restrict realtime subscriptions on 'messages' topic to conversation participants
DROP POLICY IF EXISTS "Authenticated can read realtime messages for own convos" ON realtime.messages;

CREATE POLICY "Authenticated can read realtime messages for own convos"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Limit subscription topics to conversations the user participates in.
  -- Topic format used in client: messages-<conversationId> and unread-global
  (
    realtime.topic() = 'unread-global'
  )
  OR (
    realtime.topic() LIKE 'messages-%'
    AND public.is_conversation_participant(
      auth.uid(),
      (substring(realtime.topic() from 'messages-(.*)'))::uuid
    )
  )
);