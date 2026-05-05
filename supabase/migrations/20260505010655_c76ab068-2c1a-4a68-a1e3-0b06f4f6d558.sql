ALTER TABLE public.worlds ADD COLUMN IF NOT EXISTS flag_url text;
ALTER TABLE public.worlds ADD COLUMN IF NOT EXISTS flag_emoji text;
ALTER TABLE public.raffles ADD COLUMN IF NOT EXISTS sales_blocked boolean NOT NULL DEFAULT false;