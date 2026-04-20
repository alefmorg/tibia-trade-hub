-- Enum dos tipos de badge
CREATE TYPE public.badge_type AS ENUM ('premium_verified', 'trusted_trader', 'top_trader', 'veteran', 'custom');

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_type public.badge_type NOT NULL,
  custom_label text,
  custom_color text,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_type, custom_label)
);

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user badges"
  ON public.user_badges FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update badges"
  ON public.user_badges FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete badges"
  ON public.user_badges FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));