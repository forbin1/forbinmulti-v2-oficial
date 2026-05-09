
CREATE POLICY "Users can delete own progress"
  ON public.lesson_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid());
