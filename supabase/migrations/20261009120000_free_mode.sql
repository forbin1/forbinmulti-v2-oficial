-- Modo de Gratuidade: configuração global (linha única) + registro do benefício por perfil.

CREATE TABLE IF NOT EXISTS public.free_mode_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'lifetime' CHECK (mode IN ('lifetime', 'days_90')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.free_mode_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.free_mode_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(auth.jwt() ->> 'email', '') = 'admin@gmail.com'
      OR public.has_role(auth.uid(), 'admin'::app_role);
$$;

DROP POLICY IF EXISTS "free_mode_settings admin read" ON public.free_mode_settings;
CREATE POLICY "free_mode_settings admin read" ON public.free_mode_settings
  FOR SELECT TO authenticated USING (public.is_platform_admin());

-- Registro do benefício concedido (preservado mesmo após desativar o modo)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_grant_type text,
  ADD COLUMN IF NOT EXISTS free_granted_at timestamptz;

-- Aplica o benefício a um perfil (profissional/empresa)
CREATE OR REPLACE FUNCTION public.apply_free_grant(_profile_id uuid, _mode text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.profiles%ROWTYPE;
  grant_end timestamptz := now() + interval '90 days';
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = _profile_id;
  IF NOT FOUND OR p.role IS NULL OR p.role = 'admin' THEN RETURN; END IF;

  IF _mode = 'lifetime' THEN
    IF p.free_grant_type = 'lifetime' THEN RETURN; END IF;
    UPDATE public.profiles SET
      subscription_status = 'active',
      subscription_plan = 'gratuidade-vitalicia',
      subscription_expires_at = NULL,
      free_grant_type = 'lifetime',
      free_granted_at = now()
    WHERE id = _profile_id;
  ELSIF _mode = 'days_90' THEN
    -- Concedido uma única vez por cadastro; não reduz planos pagos mais longos
    IF p.free_grant_type IS NOT NULL THEN RETURN; END IF;
    IF p.subscription_status = 'active'
       AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at >= grant_end) THEN
      RETURN;
    END IF;
    UPDATE public.profiles SET
      subscription_status = 'active',
      subscription_plan = 'gratuidade-90-dias',
      subscription_expires_at = grant_end,
      free_grant_type = 'days_90',
      free_granted_at = now()
    WHERE id = _profile_id;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.apply_free_grant(uuid, text) FROM PUBLIC, anon, authenticated;

-- Salva configuração (somente admin) e, se ativo, aplica aos cadastros existentes
CREATE OR REPLACE FUNCTION public.save_free_mode(_enabled boolean, _mode text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  n integer := 0;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  IF _mode NOT IN ('lifetime', 'days_90') THEN
    RAISE EXCEPTION 'Modo inválido';
  END IF;

  UPDATE public.free_mode_settings
    SET enabled = _enabled, mode = _mode, updated_at = now(), updated_by = auth.uid()
  WHERE id = 1;

  IF _enabled THEN
    FOR r IN SELECT id FROM public.profiles WHERE role IS NOT NULL AND role <> 'admin' LOOP
      PERFORM public.apply_free_grant(r.id, _mode);
      n := n + 1;
    END LOOP;
  END IF;
  RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.save_free_mode(boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_free_mode(boolean, text) TO authenticated;

-- Novos cadastros (ou definição de papel) enquanto o modo estiver ativo
CREATE OR REPLACE FUNCTION public.free_mode_on_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.free_mode_settings%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.free_mode_settings WHERE id = 1;
  IF s.enabled AND NEW.role IS NOT NULL AND NEW.role <> 'admin' THEN
    PERFORM public.apply_free_grant(NEW.id, s.mode);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_free_mode_on_profile ON public.profiles;
CREATE TRIGGER trg_free_mode_on_profile
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.free_mode_on_profile();
