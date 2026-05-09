UPDATE public.user_reviews SET rating = LEAST(5, GREATEST(1, rating)) WHERE rating < 1 OR rating > 5;
ALTER TABLE public.user_reviews ADD CONSTRAINT rating_range CHECK (rating BETWEEN 1 AND 5);