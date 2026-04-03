
-- Create items catalog table
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items are viewable by everyone" ON public.items FOR SELECT USING (true);
CREATE POLICY "Admins can insert items" ON public.items FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update items" ON public.items FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete items" ON public.items FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true);

-- Storage policies
CREATE POLICY "Item images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'item-images');
CREATE POLICY "Admins can upload item images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'item-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update item images" ON storage.objects FOR UPDATE USING (bucket_id = 'item-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete item images" ON storage.objects FOR DELETE USING (bucket_id = 'item-images' AND public.has_role(auth.uid(), 'admin'));
