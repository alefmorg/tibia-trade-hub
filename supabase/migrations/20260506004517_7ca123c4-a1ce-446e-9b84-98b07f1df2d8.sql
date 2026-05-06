-- Houses catalog
CREATE TABLE public.houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  type text NOT NULL DEFAULT 'house', -- house | guildhall
  beds integer,
  size_sqm integer,
  rent_gold integer,
  image_url text,
  wiki_url text,
  source text NOT NULL DEFAULT 'tibiawiki',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, city)
);

ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read houses" ON public.houses FOR SELECT USING (true);
CREATE POLICY "Admins manage houses" ON public.houses FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_houses_updated_at
BEFORE UPDATE ON public.houses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_houses_city ON public.houses(city);
CREATE INDEX idx_houses_name ON public.houses(name);

-- Add house support to ads
ALTER TABLE public.ads ADD COLUMN house_id uuid REFERENCES public.houses(id) ON DELETE SET NULL;
ALTER TABLE public.ads ADD COLUMN house_city text;

-- category already exists; new value 'house' is allowed (text column, no check constraint)