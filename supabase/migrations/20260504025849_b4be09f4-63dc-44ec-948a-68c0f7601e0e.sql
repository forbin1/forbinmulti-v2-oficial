
-- Create site_settings table for storing the VSL video URL
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings (public landing page)
CREATE POLICY "Public can read site settings"
ON public.site_settings FOR SELECT
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert site settings"
ON public.site_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for VSL videos (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vsl', 'vsl', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read VSL videos
CREATE POLICY "Public read VSL"
ON storage.objects FOR SELECT
USING (bucket_id = 'vsl');

-- Only admins can upload VSL videos
CREATE POLICY "Admins upload VSL"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vsl' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can update VSL videos
CREATE POLICY "Admins update VSL"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vsl' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete VSL videos
CREATE POLICY "Admins delete VSL"
ON storage.objects FOR DELETE
USING (bucket_id = 'vsl' AND public.has_role(auth.uid(), 'admin'));
