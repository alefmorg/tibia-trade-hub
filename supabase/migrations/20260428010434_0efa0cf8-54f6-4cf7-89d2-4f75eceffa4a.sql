-- Tabela site_assets: armazena URLs de ícones customizáveis pelo admin
CREATE TABLE public.site_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site assets"
  ON public.site_assets FOR SELECT
  USING (true);

CREATE POLICY "Admins manage site assets"
  ON public.site_assets FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER site_assets_updated_at
  BEFORE UPDATE ON public.site_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela partner_streamers
CREATE TABLE public.partner_streamers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  twitch_login text NOT NULL UNIQUE,
  avatar_url text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_streamers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read partner streamers"
  ON public.partner_streamers FOR SELECT
  USING (true);

CREATE POLICY "Admins manage partner streamers"
  ON public.partner_streamers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER partner_streamers_updated_at
  BEFORE UPDATE ON public.partner_streamers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket público para os ícones do site
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-icons', 'site-icons', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read site-icons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-icons');

CREATE POLICY "Admins upload site-icons"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update site-icons"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete site-icons"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-icons' AND has_role(auth.uid(), 'admin'::app_role));