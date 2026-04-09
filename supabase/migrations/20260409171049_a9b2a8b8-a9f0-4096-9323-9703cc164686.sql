
-- Table for dynamic filter options managed by admin
CREATE TABLE public.filter_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filter_group text NOT NULL, -- e.g. 'category', 'sort', 'custom'
  label text NOT NULL,
  value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.filter_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read filter options"
  ON public.filter_options FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage filter options"
  ON public.filter_options FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
