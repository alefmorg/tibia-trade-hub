
-- 1) Reputation: user_reviews table (manual reviews on profiles)
CREATE TABLE public.user_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewed_user_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reviewed_user_id, reviewer_id)
);

ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.user_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated can create reviews on others"
  ON public.user_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id AND reviewer_id <> reviewed_user_id);

CREATE POLICY "Users update own reviews"
  ON public.user_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users delete own reviews; admins delete any"
  ON public.user_reviews FOR DELETE
  USING (auth.uid() = reviewer_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER user_reviews_updated_at
  BEFORE UPDATE ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_reviews_reviewed ON public.user_reviews(reviewed_user_id);

-- Function to fetch reputation summary
CREATE OR REPLACE FUNCTION public.get_user_reputation(p_user_id UUID)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'avg', COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    'count', COUNT(*)
  )
  FROM public.user_reviews
  WHERE reviewed_user_id = p_user_id;
$$;

-- 2) Raffles: add progress override percent (manual)
ALTER TABLE public.raffles
  ADD COLUMN IF NOT EXISTS progress_percent INTEGER CHECK (progress_percent BETWEEN 0 AND 100);

-- 3) Ads: extra info + reference link to find item
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS extra_info TEXT,
  ADD COLUMN IF NOT EXISTS item_reference_url TEXT;

-- 4) Allow admins to UPDATE messages so they can manage; users already can mark as read.
-- Already covered via DELETE policy (participants and admins). Nothing needed for delete.
