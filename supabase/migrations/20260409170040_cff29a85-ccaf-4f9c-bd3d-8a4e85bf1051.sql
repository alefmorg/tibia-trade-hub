
-- Navigation links table
CREATE TABLE public.nav_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  icon_url text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nav_links ENABLE ROW LEVEL SECURITY;

-- Everyone can read active nav links
CREATE POLICY "Anyone can read nav links"
ON public.nav_links FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can manage nav links
CREATE POLICY "Admins can manage nav links"
ON public.nav_links FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Site banners table
CREATE TABLE public.site_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  image_url text,
  link_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

-- Everyone can read active banners
CREATE POLICY "Anyone can read banners"
ON public.site_banners FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can manage banners
CREATE POLICY "Admins can manage banners"
ON public.site_banners FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
