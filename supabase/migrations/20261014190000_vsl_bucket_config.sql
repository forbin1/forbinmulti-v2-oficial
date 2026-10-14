-- Garante o bucket "vsl" público, com limite de 500 MB e tipos de vídeo aceitos.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('vsl', 'vsl', true, 524288000,
        ARRAY['video/mp4','video/webm','video/quicktime','video/ogg','video/x-m4v'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Admin precisa de SELECT para upsert/remove funcionarem (além do público).
DROP POLICY IF EXISTS "Public read VSL" ON storage.objects;
CREATE POLICY "Public read VSL"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vsl');

-- Linha de configuração sempre existe
INSERT INTO public.site_settings (key, value)
VALUES ('vsl_url', '')
ON CONFLICT (key) DO NOTHING;
