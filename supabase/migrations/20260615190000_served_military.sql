-- "Já serviu o quartel?" no cadastro do profissional.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS served_military BOOLEAN;
