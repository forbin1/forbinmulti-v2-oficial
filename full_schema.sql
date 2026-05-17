
-- User roles enum
CREATE TYPE public.app_role AS ENUM ('professional', 'company', 'admin');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Profiles table for professionals
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  bio TEXT,
  cnv_number TEXT,
  courses TEXT[] DEFAULT '{}',
  specializations TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name TEXT NOT NULL DEFAULT '',
  cnpj TEXT,
  logo_url TEXT,
  description TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  website TEXT,
  employee_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can read own data" ON public.companies FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Companies can update own data" ON public.companies FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Companies can insert own data" ON public.companies FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Public companies are viewable" ON public.companies FOR SELECT TO authenticated USING (true);

-- Trigger to auto-create profile or company on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'professional')::app_role;
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  
  IF _role = 'professional' THEN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  ELSIF _role = 'company' THEN
    INSERT INTO public.companies (user_id, company_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'company_name', ''));
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  instructor TEXT NOT NULL DEFAULT '',
  duration_hours NUMERIC(5,1) DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Geral',
  price NUMERIC(10,2) DEFAULT NULL,
  level TEXT NOT NULL DEFAULT 'Iniciante',
  is_published BOOLEAN NOT NULL DEFAULT false,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view published courses"
  ON public.courses FOR SELECT TO authenticated
  USING (is_published = true);

-- Lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view lessons"
  ON public.lessons FOR SELECT TO authenticated
  USING (true);

-- Enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments"
  ON public.enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can enroll themselves"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own enrollments"
  ON public.enrollments FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Lesson progress
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.lesson_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress"
  ON public.lesson_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
  ON public.lesson_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Certificates
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  certificate_code TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
  ON public.certificates FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own certificates"
  ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Updated_at trigger for courses
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

CREATE POLICY "Users can delete own progress"
  ON public.lesson_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid());

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

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT,
  state TEXT,
  modality TEXT NOT NULL DEFAULT 'Presencial',
  contract_type TEXT NOT NULL DEFAULT 'CLT',
  salary_min NUMERIC,
  salary_max NUMERIC,
  requirements TEXT,
  benefits TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  banner_url TEXT
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view published jobs"
  ON public.jobs FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can view all jobs"
  ON public.jobs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert jobs"
  ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update jobs"
  ON public.jobs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete jobs"
  ON public.jobs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can view all courses"
  ON public.courses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert courses"
  ON public.courses FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update courses"
  ON public.courses FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete courses"
  ON public.courses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any company"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete companies"
  ON public.companies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  author_role TEXT NOT NULL DEFAULT 'Profissional',
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  video_url TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts (created_at DESC);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view visible posts"
  ON public.posts FOR SELECT TO authenticated
  USING (is_hidden = false);

CREATE POLICY "Admins can view all posts"
  ON public.posts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own posts"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update any post"
  ON public.posts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any post"
  ON public.posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
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
('professional', 'Profissional', 'professional', 1990, 'month', 'Para profissionais da seguranÃ§a privada que querem se destacar.',
  '["Perfil profissional completo","Acesso a vagas exclusivas","Cursos e certificados","Feed de experiÃªncias","Selo de verificaÃ§Ã£o"]'::jsonb,
  'Assinar Profissional', false, 1),
('company', 'Empresa', 'company', 29790, 'month', 'Para empresas que contratam e gerenciam profissionais de seguranÃ§a.',
  '["PublicaÃ§Ã£o ilimitada de vagas","Busca avanÃ§ada de profissionais","PÃ¡gina da empresa verificada","GestÃ£o de candidatos","Suporte prioritÃ¡rio"]'::jsonb,
  'Assinar Empresa', true, 2);
CREATE TABLE public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view published templates" ON public.certificate_templates
  FOR SELECT TO authenticated USING (is_published = true);

CREATE POLICY "Admins can view all templates" ON public.certificate_templates
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert templates" ON public.certificate_templates
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update templates" ON public.certificate_templates
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete templates" ON public.certificate_templates
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view certificate files"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

CREATE POLICY "Admins can upload certificate files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'certificates' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update certificate files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'certificates' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete certificate files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'certificates' AND has_role(auth.uid(), 'admin'::app_role));
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

-- 1. Tabela de mÃ³dulos
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view modules"
ON public.course_modules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert modules"
ON public.course_modules FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update modules"
ON public.course_modules FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete modules"
ON public.course_modules FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_course_modules_updated_at
BEFORE UPDATE ON public.course_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Vincular aulas a mÃ³dulos
ALTER TABLE public.lessons ADD COLUMN module_id UUID;
CREATE INDEX idx_lessons_module ON public.lessons(module_id);
CREATE INDEX idx_lessons_course ON public.lessons(course_id);

-- 3. Permitir admin gerenciar aulas
CREATE POLICY "Admins can insert lessons"
ON public.lessons FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lessons"
ON public.lessons FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lessons"
ON public.lessons FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Bucket pÃºblico para vÃ­deos das aulas
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-videos', 'lesson-videos', true);

CREATE POLICY "Lesson videos publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-videos');

CREATE POLICY "Admins can upload lesson videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lesson-videos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lesson videos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'lesson-videos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lesson videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lesson-videos' AND has_role(auth.uid(), 'admin'::app_role));
