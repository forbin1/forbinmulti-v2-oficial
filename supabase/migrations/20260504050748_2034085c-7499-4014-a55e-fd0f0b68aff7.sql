
-- 1. Tabela de módulos
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

-- 2. Vincular aulas a módulos
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

-- 4. Bucket público para vídeos das aulas
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
