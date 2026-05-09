CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'professional',
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  period TEXT NOT NULL DEFAULT 'month',
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  cta_label TEXT DEFAULT 'Assinar',
  highlight BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published plans" ON public.plans
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can view all plans" ON public.plans
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert plans" ON public.plans
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update plans" ON public.plans
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete plans" ON public.plans
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.plans (slug, name, audience, price_cents, period, description, features, cta_label, highlight, sort_order) VALUES
('professional', 'Profissional', 'professional', 1990, 'month', 'Para profissionais da segurança privada que querem se destacar.',
  '["Perfil profissional completo","Acesso a vagas exclusivas","Cursos e certificados","Feed de experiências","Selo de verificação"]'::jsonb,
  'Assinar Profissional', false, 1),
('company', 'Empresa', 'company', 29790, 'month', 'Para empresas que contratam e gerenciam profissionais de segurança.',
  '["Publicação ilimitada de vagas","Busca avançada de profissionais","Página da empresa verificada","Gestão de candidatos","Suporte prioritário"]'::jsonb,
  'Assinar Empresa', true, 2);