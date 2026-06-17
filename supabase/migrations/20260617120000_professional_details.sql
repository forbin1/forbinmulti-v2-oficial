-- Dados pessoais/profissionais adicionais do profissional (visíveis para empresas).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS altura TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS peso TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estado_civil TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_cnh BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disponibilidade_viagem BOOLEAN NOT NULL DEFAULT false;
