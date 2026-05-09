
-- 1) Custom badge icon support
ALTER TABLE public.user_badges ADD COLUMN IF NOT EXISTS custom_icon_url text;

-- 2) Affiliate links
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  target_url text NOT NULL,
  label text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  click_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active affiliate links"
ON public.affiliate_links FOR SELECT USING (true);

CREATE POLICY "Admins manage affiliate links"
ON public.affiliate_links FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.affiliate_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  referrer text,
  ua_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link ON public.affiliate_link_clicks(link_id, created_at DESC);
ALTER TABLE public.affiliate_link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view affiliate clicks"
ON public.affiliate_link_clicks FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RPC to register a click (callable by anyone, security definer)
CREATE OR REPLACE FUNCTION public.register_affiliate_click(
  p_slug text,
  p_referrer text DEFAULT NULL,
  p_ua_hash text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link record;
BEGIN
  SELECT id, target_url, active INTO v_link
  FROM public.affiliate_links
  WHERE slug = p_slug;

  IF NOT FOUND OR NOT v_link.active THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.affiliate_link_clicks (link_id, referrer, ua_hash)
  VALUES (v_link.id, p_referrer, p_ua_hash);

  UPDATE public.affiliate_links
  SET click_count = click_count + 1, updated_at = now()
  WHERE id = v_link.id;

  RETURN v_link.target_url;
END;
$$;

REVOKE ALL ON FUNCTION public.register_affiliate_click(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.register_affiliate_click(text, text, text) TO anon, authenticated;

-- 3) Welcome screen settings (single-row)
CREATE TABLE IF NOT EXISTS public.welcome_screen_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  title text NOT NULL DEFAULT 'Bem-vindo ao Rubin TRADE',
  subtitle text NOT NULL DEFAULT 'O melhor marketplace do RubinOT',
  cta_text text NOT NULL DEFAULT 'Entrar agora',
  cta_url text NOT NULL DEFAULT '/',
  background_image_url text,
  accent_color text NOT NULL DEFAULT '#F59E0B',
  show_once_per_session boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.welcome_screen_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read welcome settings"
ON public.welcome_screen_settings FOR SELECT USING (true);

CREATE POLICY "Admins manage welcome settings"
ON public.welcome_screen_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.welcome_screen_settings (enabled) VALUES (false)
ON CONFLICT DO NOTHING;

-- 4) Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('badge-icons','badge-icons', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('welcome-bg','welcome-bg', true)
ON CONFLICT (id) DO NOTHING;

-- Public read on these buckets, admin write
CREATE POLICY "Public read badge-icons"
ON storage.objects FOR SELECT
USING (bucket_id = 'badge-icons');

CREATE POLICY "Admins upload badge-icons"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'badge-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update badge-icons"
ON storage.objects FOR UPDATE
USING (bucket_id = 'badge-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete badge-icons"
ON storage.objects FOR DELETE
USING (bucket_id = 'badge-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read welcome-bg"
ON storage.objects FOR SELECT
USING (bucket_id = 'welcome-bg');

CREATE POLICY "Admins upload welcome-bg"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'welcome-bg' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update welcome-bg"
ON storage.objects FOR UPDATE
USING (bucket_id = 'welcome-bg' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete welcome-bg"
ON storage.objects FOR DELETE
USING (bucket_id = 'welcome-bg' AND has_role(auth.uid(), 'admin'::app_role));
