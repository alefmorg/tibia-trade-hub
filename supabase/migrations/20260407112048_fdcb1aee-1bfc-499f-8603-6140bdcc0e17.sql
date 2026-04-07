
-- Add currency column to ads
ALTER TABLE public.ads ADD COLUMN currency text NOT NULL DEFAULT 'kk';

-- Create offers table
CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  amount text NOT NULL,
  currency text NOT NULL DEFAULT 'kk',
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Sender can view own offers
CREATE POLICY "Users can view own offers"
ON public.offers FOR SELECT
USING (auth.uid() = sender_id);

-- Ad owner can view offers on their ads
CREATE POLICY "Ad owners can view offers on their ads"
ON public.offers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ads WHERE ads.id = offers.ad_id AND ads.user_id = auth.uid()
  )
);

-- Authenticated users can create offers
CREATE POLICY "Users can create offers"
ON public.offers FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Ad owner can accept/reject (update status)
CREATE POLICY "Ad owners can update offer status"
ON public.offers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ads WHERE ads.id = offers.ad_id AND ads.user_id = auth.uid()
  )
);

-- Sender can cancel (delete) own pending offers
CREATE POLICY "Users can delete own pending offers"
ON public.offers FOR DELETE
USING (auth.uid() = sender_id AND status = 'pending');

-- Trigger for updated_at
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
