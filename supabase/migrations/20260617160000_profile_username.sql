-- Nome de usuário (@) escolhido pelo profissional.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Garante unicidade (case-insensitive), permitindo nulos.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;
