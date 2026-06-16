-- Profissional: escolaridade, possui CNV e experiências profissionais estruturadas.

-- 1) Novos campos no perfil do profissional
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS escolaridade TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_cnv BOOLEAN NOT NULL DEFAULT false;

-- 2) Tabela de experiências profissionais
CREATE TABLE IF NOT EXISTS public.professional_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  category TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  description TEXT CHECK (description IS NULL OR char_length(description) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_professional_experiences_user
  ON public.professional_experiences(user_id);

ALTER TABLE public.professional_experiences ENABLE ROW LEVEL SECURITY;

-- O dono gerencia (insert/update/delete) suas próprias experiências
DROP POLICY IF EXISTS "Users manage own experiences" ON public.professional_experiences;
CREATE POLICY "Users manage own experiences"
  ON public.professional_experiences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Experiências são públicas para usuários autenticados (empresas visualizam perfis)
DROP POLICY IF EXISTS "Experiences are public" ON public.professional_experiences;
CREATE POLICY "Experiences are public"
  ON public.professional_experiences FOR SELECT TO authenticated
  USING (true);
