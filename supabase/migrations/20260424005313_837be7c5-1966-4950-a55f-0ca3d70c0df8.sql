-- Tickets de suporte
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users close own tickets" ON public.support_tickets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND status IN ('open','closed'));
CREATE POLICY "Admins manage tickets" ON public.support_tickets
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_support_tickets_updated
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mensagens dos tickets
CREATE TABLE public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_ticket_participant(_ticket_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = _ticket_id AND (user_id = _user_id OR public.has_role(_user_id, 'admin'::app_role))
  )
$$;

CREATE POLICY "Participants view ticket messages" ON public.support_ticket_messages
  FOR SELECT USING (public.is_ticket_participant(ticket_id, auth.uid()));
CREATE POLICY "Participants send ticket messages" ON public.support_ticket_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND public.is_ticket_participant(ticket_id, auth.uid())
  );
CREATE POLICY "Admins delete ticket messages" ON public.support_ticket_messages
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Bump do updated_at do ticket quando há nova mensagem
CREATE OR REPLACE FUNCTION public.bump_ticket_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.support_tickets SET updated_at = now() WHERE id = NEW.ticket_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_bump_ticket_updated
  AFTER INSERT ON public.support_ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_ticket_updated_at();

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id);