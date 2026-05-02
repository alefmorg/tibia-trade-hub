-- Tabela de mundos gerenciáveis pelo admin
CREATE TABLE IF NOT EXISTS public.worlds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  pvp_type text NOT NULL DEFAULT 'Optional PvP',
  region text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read worlds"
  ON public.worlds FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage worlds"
  ON public.worlds FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_worlds_updated_at
  BEFORE UPDATE ON public.worlds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial com os mundos atuais
INSERT INTO public.worlds (name, pvp_type, region, sort_order) VALUES
  ('Auroria', 'Open PvP', 'South America', 1),
  ('Belaria', 'Open PvP', 'South America', 2),
  ('Bellum', 'Retro PvP', 'South America', 3),
  ('Cellenium', 'Retro PvP', 'Europe', 4),
  ('Divinian', 'Optional PvP', 'South America', 5),
  ('Elysian', 'Optional PvP', 'South America', 6),
  ('Etherian', 'Optional PvP', 'South America', 7),
  ('Halorian', 'Optional PvP', 'South America', 8),
  ('Lunarian', 'Optional PvP', 'South America', 9),
  ('Mystian', 'Optional PvP', 'South America', 10),
  ('Serenian', 'Optional PvP', 'South America', 11),
  ('Solarian', 'Optional PvP', 'South America', 12),
  ('Spectrum', 'Retro PvP', 'South America', 13),
  ('Tenebrium', 'Retro PvP', 'South America', 14),
  ('Vesperia', 'Open PvP', 'South America', 15)
ON CONFLICT (name) DO NOTHING;