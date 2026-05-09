INSERT INTO storage.buckets (id, name, public) VALUES ('landing', 'landing', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view landing files"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing');

CREATE POLICY "Admins can upload landing files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'landing' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update landing files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'landing' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete landing files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'landing' AND has_role(auth.uid(), 'admin'::app_role));