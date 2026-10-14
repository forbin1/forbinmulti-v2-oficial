-- Função segura para salvar a VSL (ignora RLS, mas exige admin).
CREATE OR REPLACE FUNCTION public.set_vsl_url(_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar a VSL';
  END IF;
  INSERT INTO public.site_settings (key, value, updated_at)
  VALUES ('vsl_url', COALESCE(_value, ''), now())
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_vsl_url(text) TO authenticated;

-- Garante as policies de site_settings
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
