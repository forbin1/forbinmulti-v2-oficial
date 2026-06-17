-- Prova (quiz) opcional por aula. Quando ativada, o aluno precisa acertar todas
-- as perguntas para concluir a aula.

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS quiz_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.lesson_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL DEFAULT '{}',
  correct_index INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_questions_lesson ON public.lesson_questions(lesson_id);

ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view lesson questions" ON public.lesson_questions;
CREATE POLICY "Anyone authenticated can view lesson questions"
  ON public.lesson_questions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert lesson questions" ON public.lesson_questions;
CREATE POLICY "Admins can insert lesson questions"
  ON public.lesson_questions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update lesson questions" ON public.lesson_questions;
CREATE POLICY "Admins can update lesson questions"
  ON public.lesson_questions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete lesson questions" ON public.lesson_questions;
CREATE POLICY "Admins can delete lesson questions"
  ON public.lesson_questions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
