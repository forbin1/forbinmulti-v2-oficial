-- Corrige uploads: foto de perfil (usuários autenticados) e VSL (admin).

-- 1) Foto de perfil / capa: bucket "certificates" — permite usuário autenticado
--    enviar/atualizar suas mídias de perfil. (Antes só admin podia inserir.)
DROP POLICY IF EXISTS "Authenticated can upload profile media" ON storage.objects;
CREATE POLICY "Authenticated can upload profile media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Authenticated can update profile media" ON storage.objects;
CREATE POLICY "Authenticated can update profile media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Public read certificates media" ON storage.objects;
CREATE POLICY "Public read certificates media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

-- 2) VSL: garante as policies (caso não tenham sido aplicadas no banco).
DROP POLICY IF EXISTS "Public read VSL" ON storage.objects;
CREATE POLICY "Public read VSL"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vsl');

DROP POLICY IF EXISTS "Admins upload VSL" ON storage.objects;
CREATE POLICY "Admins upload VSL"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vsl' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update VSL" ON storage.objects;
CREATE POLICY "Admins update VSL"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vsl' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete VSL" ON storage.objects;
CREATE POLICY "Admins delete VSL"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vsl' AND public.has_role(auth.uid(), 'admin'));

-- 3) Garante leitura/escrita de site_settings (VSL aparece na landing).
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings"
  ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
